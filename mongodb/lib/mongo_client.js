"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoClient = exports.ServerApiVersion = void 0;
const util_1 = require("util");
const bson_1 = require("./bson");
const change_stream_1 = require("./change_stream");
const connection_string_1 = require("./connection_string");
const constants_1 = require("./constants");
const db_1 = require("./db");
const error_1 = require("./error");
const mongo_logger_1 = require("./mongo_logger");
const mongo_types_1 = require("./mongo_types");
const read_preference_1 = require("./read_preference");
const server_selection_1 = require("./sdam/server_selection");
const topology_1 = require("./sdam/topology");
const sessions_1 = require("./sessions");
const utils_1 = require("./utils");
/** @public */
exports.ServerApiVersion = Object.freeze({
    v1: '1'
});
/** @internal */
const kOptions = Symbol('options');
/**
 * The **MongoClient** class is a class that allows for making Connections to MongoDB.
 * @public
 *
 * @remarks
 * The programmatically provided options take precedence over the URI options.
 *
 * @example
 * ```ts
 * import { MongoClient } from 'mongodb';
 *
 * // Enable command monitoring for debugging
 * const client = new MongoClient('mongodb://localhost:27017', { monitorCommands: true });
 *
 * client.on('commandStarted', started => console.log(started));
 * client.db().collection('pets');
 * await client.insertOne({ name: 'spot', kind: 'dog' });
 * ```
 */
class MongoClient extends mongo_types_1.TypedEventEmitter {
    constructor(url, options) {
        super();
        this[kOptions] = (0, connection_string_1.parseOptions)(url, this, options);
        this.mongoLogger = new mongo_logger_1.MongoLogger(this[kOptions].mongoLoggerOptions);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const client = this;
        // The internal state
        this.s = {
            url,
            bsonOptions: (0, bson_1.resolveBSONOptions)(this[kOptions]),
            namespace: (0, utils_1.ns)('admin'),
            hasBeenClosed: false,
            sessionPool: new sessions_1.ServerSessionPool(this),
            activeSessions: new Set(),
            get options() {
                return client[kOptions];
            },
            get readConcern() {
                return client[kOptions].readConcern;
            },
            get writeConcern() {
                return client[kOptions].writeConcern;
            },
            get readPreference() {
                return client[kOptions].readPreference;
            },
            get isMongoClient() {
                return true;
            }
        };
    }
    get options() {
        return Object.freeze({ ...this[kOptions] });
    }
    get serverApi() {
        return this[kOptions].serverApi && Object.freeze({ ...this[kOptions].serverApi });
    }
    /**
     * Intended for APM use only
     * @internal
     */
    get monitorCommands() {
        return this[kOptions].monitorCommands;
    }
    set monitorCommands(value) {
        this[kOptions].monitorCommands = value;
    }
    get autoEncrypter() {
        return this[kOptions].autoEncrypter;
    }
    get readConcern() {
        return this.s.readConcern;
    }
    get writeConcern() {
        return this.s.writeConcern;
    }
    get readPreference() {
        return this.s.readPreference;
    }
    get bsonOptions() {
        return this.s.bsonOptions;
    }
    /**
     * Connect to MongoDB using a url
     *
     * @see docs.mongodb.org/manual/reference/connection-string/
     */
    async connect() {
        if (this.topology && this.topology.isConnected()) {
            return this;
        }
        const options = this[kOptions];
        if (typeof options.srvHost === 'string') {
            const hosts = await (0, connection_string_1.resolveSRVRecord)(options);
            for (const [index, host] of hosts.entries()) {
                options.hosts[index] = host;
            }
        }
        const topology = new topology_1.Topology(options.hosts, options);
        // Events can be emitted before initialization is complete so we have to
        // save the reference to the topology on the client ASAP if the event handlers need to access it
        this.topology = topology;
        topology.client = this;
        topology.once(topology_1.Topology.OPEN, () => this.emit('open', this));
        for (const event of constants_1.MONGO_CLIENT_EVENTS) {
            topology.on(event, (...args) => this.emit(event, ...args));
        }
        const topologyConnect = async () => {
            try {
                await (0, util_1.promisify)(callback => topology.connect(options, callback))();
            }
            catch (error) {
                topology.close({ force: true });
                throw error;
            }
        };
        if (this.autoEncrypter) {
            const initAutoEncrypter = (0, util_1.promisify)(callback => this.autoEncrypter?.init(callback));
            await initAutoEncrypter();
            await topologyConnect();
            await options.encrypter.connectInternalClient();
        }
        else {
            await topologyConnect();
        }
        return this;
    }
    /**
     * Close the client and its underlying connections
     *
     * @param force - Force close, emitting no events
     */
    async close(force = false) {
        // There's no way to set hasBeenClosed back to false
        Object.defineProperty(this.s, 'hasBeenClosed', {
            value: true,
            enumerable: true,
            configurable: false,
            writable: false
        });
        const activeSessionEnds = Array.from(this.s.activeSessions, session => session.endSession());
        this.s.activeSessions.clear();
        await Promise.all(activeSessionEnds);
        if (this.topology == null) {
            return;
        }
        // If we would attempt to select a server and get nothing back we short circuit
        // to avoid the server selection timeout.
        const selector = (0, server_selection_1.readPreferenceServerSelector)(read_preference_1.ReadPreference.primaryPreferred);
        const topologyDescription = this.topology.description;
        const serverDescriptions = Array.from(topologyDescription.servers.values());
        const servers = selector(topologyDescription, serverDescriptions);
        if (servers.length !== 0) {
            const endSessions = Array.from(this.s.sessionPool.sessions, ({ id }) => id);
            if (endSessions.length !== 0) {
                await this.db('admin')
                    .command({ endSessions }, { readPreference: read_preference_1.ReadPreference.primaryPreferred, noResponse: true })
                    .catch(() => null); // outcome does not matter
            }
        }
        // clear out references to old topology
        const topology = this.topology;
        this.topology = undefined;
        await new Promise((resolve, reject) => {
            topology.close({ force }, error => {
                if (error)
                    return reject(error);
                const { encrypter } = this[kOptions];
                if (encrypter) {
                    return encrypter.close(this, force, error => {
                        if (error)
                            return reject(error);
                        resolve();
                    });
                }
                resolve();
            });
        });
    }
    /**
     * Create a new Db instance sharing the current socket connections.
     *
     * @param dbName - The name of the database we want to use. If not provided, use database name from connection string.
     * @param options - Optional settings for Db construction
     */
    db(dbName, options) {
        options = options ?? {};
        // Default to db from connection string if not provided
        if (!dbName) {
            dbName = this.options.dbName;
        }
        // Copy the options and add out internal override of the not shared flag
        const finalOptions = Object.assign({}, this[kOptions], options);
        // Return the db object
        const db = new db_1.Db(this, dbName, finalOptions);
        // Return the database
        return db;
    }
    /**
     * Connect to MongoDB using a url
     *
     * @remarks
     * The programmatically provided options take precedence over the URI options.
     *
     * @see https://docs.mongodb.org/manual/reference/connection-string/
     */
    static async connect(url, options) {
        const client = new this(url, options);
        return client.connect();
    }
    /** Starts a new session on the server */
    startSession(options) {
        const session = new sessions_1.ClientSession(this, this.s.sessionPool, { explicit: true, ...options }, this[kOptions]);
        this.s.activeSessions.add(session);
        session.once('ended', () => {
            this.s.activeSessions.delete(session);
        });
        return session;
    }
    async withSession(optionsOrOperation, callback) {
        const options = {
            // Always define an owner
            owner: Symbol(),
            // If it's an object inherit the options
            ...(typeof optionsOrOperation === 'object' ? optionsOrOperation : {})
        };
        const withSessionCallback = typeof optionsOrOperation === 'function' ? optionsOrOperation : callback;
        if (withSessionCallback == null) {
            throw new error_1.MongoInvalidArgumentError('Missing required callback parameter');
        }
        const session = this.startSession(options);
        try {
            await withSessionCallback(session);
        }
        finally {
            try {
                await session.endSession();
            }
            catch {
                // We are not concerned with errors from endSession()
            }
        }
    }
    /**
     * Create a new Change Stream, watching for new changes (insertions, updates,
     * replacements, deletions, and invalidations) in this cluster. Will ignore all
     * changes to system collections, as well as the local, admin, and config databases.
     *
     * @remarks
     * watch() accepts two generic arguments for distinct use cases:
     * - The first is to provide the schema that may be defined for all the data within the current cluster
     * - The second is to override the shape of the change stream document entirely, if it is not provided the type will default to ChangeStreamDocument of the first argument
     *
     * @param pipeline - An array of {@link https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/|aggregation pipeline stages} through which to pass change stream documents. This allows for filtering (using $match) and manipulating the change stream documents.
     * @param options - Optional settings for the command
     * @typeParam TSchema - Type of the data being detected by the change stream
     * @typeParam TChange - Type of the whole change stream document emitted
     */
    watch(pipeline = [], options = {}) {
        // Allow optionally not specifying a pipeline
        if (!Array.isArray(pipeline)) {
            options = pipeline;
            pipeline = [];
        }
        return new change_stream_1.ChangeStream(this, pipeline, (0, utils_1.resolveOptions)(this, options));
    }
}
exports.MongoClient = MongoClient;
//# sourceMappingURL=mongo_client.js.map