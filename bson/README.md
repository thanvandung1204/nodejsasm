# BSON parser

BSON is short for "Binary JSON," and is the binary-encoded serialization of JSON-like documents.
You can learn more about it in [the specification](http://bsonspec.org).

### Table of Contents
- [Usage](#usage)
- [Bugs/Feature Requests](#bugs--feature-requests)
- [Installation](#installation)
- [Documentation](#documentation)
- [FAQ](#faq)

## Bugs / Feature Requests

Think you've found a bug? Want to see a new feature in `bson`? Please open a case in our issue management tool, JIRA:

1. Create an account and login: [jira.mongodb.org](https://jira.mongodb.org)
2. Navigate to the NODE project: [jira.mongodb.org/browse/NODE](https://jira.mongodb.org/browse/NODE)
3. Click **Create Issue** - Please provide as much information as possible about the issue and how to reproduce it.

Bug reports in JIRA for all driver projects (i.e. NODE, PYTHON, CSHARP, JAVA) and the Core Server (i.e. SERVER) project are **public**.

## Usage

To build a new version perform the following operations:

```
npm install
npm run build
```

### Node.js or Bundling Usage

When using a bundler or Node.js you can import bson using the package name:

```js
import { BSON, EJSON, ObjectId } from 'bson';
// or:
// const { BSON, EJSON, ObjectId } = require('bson');

const bytes = BSON.serialize({ _id: new ObjectId() });
console.log(bytes);
const doc = BSON.deserialize(bytes);
console.log(EJSON.stringify(doc));
// {"_id":{"$oid":"..."}}
```

### Browser Usage

If you are working directly in the browser without a bundler please use the `.mjs` bundle like so:

```html
<script type="module">
  import { BSON, EJSON, ObjectId } from './lib/bson.mjs';

  const bytes = BSON.serialize({ _id: new ObjectId() });
  console.log(bytes);
  const doc = BSON.deserialize(bytes);
  console.log(EJSON.stringify(doc));
  // {"_id":{"$oid":"..."}}
</script>
```

## Installation

```sh
npm install bson
```

## Documentation

### Objects

<dl>
<dt><a href="#EJSON">EJSON</a> : <code>object</code></dt>
<dd></dd>
</dl>

### Functions

<dl>
<dt><a href="#setInternalBufferSize">setInternalBufferSize(size)</a></dt>
<dd><p>Sets the size of the internal serialization buffer.</p>
</dd>
<dt><a href="#serialize">serialize(object)</a> ⇒ <code>Buffer</code></dt>
<dd><p>Serialize a Javascript object.</p>
</dd>
<dt><a href="#serializeWithBufferAndIndex">serializeWithBufferAndIndex(object, buffer)</a> ⇒ <code>Number</code></dt>
<dd><p>Serialize a Javascript object using a predefined Buffer and index into the buffer, useful when pre-allocating the space for serialization.</p>
</dd>
<dt><a href="#deserialize">deserialize(buffer)</a> ⇒ <code>Object</code></dt>
<dd><p>Deserialize data as BSON.</p>
</dd>
<dt><a href="#calculateObjectSize">calculateObjectSize(object)</a> ⇒ <code>Number</code></dt>
<dd><p>Calculate the bson size for a passed in Javascript object.</p>
</dd>
<dt><a href="#deserializeStream">deserializeStream(data, startIndex, numberOfDocuments, documents, docStartIndex, [options])</a> ⇒ <code>Number</code></dt>
<dd><p>Deserialize stream data as BSON documents.</p>
</dd>
</dl>

<a name="EJSON"></a>

### EJSON

* [EJSON](#EJSON)

    * [.parse(text, [options])](#EJSON.parse)

    * [.stringify(value, [replacer], [space], [options])](#EJSON.stringify)

    * [.serialize(bson, [options])](#EJSON.serialize)

    * [.deserialize(ejson, [options])](#EJSON.deserialize)


<a name="EJSON.parse"></a>

#### *EJSON*.parse(text, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| text | <code>string</code> |  |  |
| [options] | <code>object</code> |  | Optional settings |
| [options.relaxed] | <code>boolean</code> | <code>true</code> | Attempt to return native JS types where possible, rather than BSON types (if true) |

Parse an Extended JSON string, constructing the JavaScript value or object described by that
string.

**Example**
```js
const { EJSON } = require('bson');
const text = '{ "int32": { "$numberInt": "10" } }';

// prints { int32: { [String: '10'] _bsontype: 'Int32', value: '10' } }
console.log(EJSON.parse(text, { relaxed: false }));

// prints { int32: 10 }
console.log(EJSON.parse(text));
```
<a name="EJSON.stringify"></a>

#### *EJSON*.stringify(value, [replacer], [space], [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | <code>object</code> |  | The value to convert to extended JSON |
| [replacer] | <code>function</code> \| <code>array</code> |  | A function that alters the behavior of the stringification process, or an array of String and Number objects that serve as a whitelist for selecting/filtering the properties of the value object to be included in the JSON string. If this value is null or not provided, all properties of the object are included in the resulting JSON string |
| [space] | <code>string</code> \| <code>number</code> |  | A String or Number object that's used to insert white space into the output JSON string for readability purposes. |
| [options] | <code>object</code> |  | Optional settings |
| [options.relaxed] | <code>boolean</code> | <code>true</code> | Enabled Extended JSON's `relaxed` mode |
| [options.legacy] | <code>boolean</code> | <code>true</code> | Output in Extended JSON v1 |

Converts a BSON document to an Extended JSON string, optionally replacing values if a replacer
function is specified or optionally including only the specified properties if a replacer array
is specified.

**Example**
```js
const { EJSON } = require('bson');
const Int32 = require('mongodb').Int32;
const doc = { int32: new Int32(10) };

// prints '{"int32":{"$numberInt":"10"}}'
console.log(EJSON.stringify(doc, { relaxed: false }));

// prints '{"int32":10}'
console.log(EJSON.stringify(doc));
```
<a name="EJSON.serialize"></a>

#### *EJSON*.serialize(bson, [options])

| Param | Type | Description |
| --- | --- | --- |
| bson | <code>object</code> | The object to serialize |
| [options] | <code>object</code> | Optional settings passed to the `stringify` function |

Serializes an object to an Extended JSON string, and reparse it as a JavaScript object.

<a name="EJSON.deserialize"></a>

#### *EJSON*.deserialize(ejson, [options])

| Param | Type | Description |
| --- | --- | --- |
| ejson | <code>object</code> | The Extended JSON object to deserialize |
| [options] | <code>object</code> | Optional settings passed to the parse method |

Deserializes an Extended JSON object into a plain JavaScript object with native/BSON types

<a name="setInternalBufferSize"></a>

### setInternalBufferSize(size)

| Param | Type | Description |
| --- | --- | --- |
| size | <code>number</code> | The desired size for the internal serialization buffer |

Sets the size of the internal serialization buffer.

<a name="serialize"></a>

### serialize(object)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| object | <code>Object</code> |  | the Javascript object to serialize. |
| [options.checkKeys] | <code>Boolean</code> |  | the serializer will check if keys are valid. |
| [options.serializeFunctions] | <code>Boolean</code> | <code>false</code> | serialize the javascript functions **(default:false)**. |
| [options.ignoreUndefined] | <code>Boolean</code> | <code>true</code> | ignore undefined fields **(default:true)**. |

Serialize a Javascript object.

**Returns**: <code>Buffer</code> - returns the Buffer object containing the serialized object.
<a name="serializeWithBufferAndIndex"></a>

### serializeWithBufferAndIndex(object, buffer)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| object | <code>Object</code> |  | the Javascript object to serialize. |
| buffer | <code>Buffer</code> |  | the Buffer you pre-allocated to store the serialized BSON object. |
| [options.checkKeys] | <code>Boolean</code> |  | the serializer will check if keys are valid. |
| [options.serializeFunctions] | <code>Boolean</code> | <code>false</code> | serialize the javascript functions **(default:false)**. |
| [options.ignoreUndefined] | <code>Boolean</code> | <code>true</code> | ignore undefined fields **(default:true)**. |
| [options.index] | <code>Number</code> |  | the index in the buffer where we wish to start serializing into. |

Serialize a Javascript object using a predefined Buffer and index into the buffer, useful when pre-allocating the space for serialization.

**Returns**: <code>Number</code> - returns the index pointing to the last written byte in the buffer.
<a name="deserialize"></a>

### deserialize(buffer)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| buffer | <code>Buffer</code> |  | the buffer containing the serialized set of BSON documents. |
| [options.evalFunctions] | <code>Object</code> | <code>false</code> | evaluate functions in the BSON document scoped to the object deserialized. |
| [options.cacheFunctions] | <code>Object</code> | <code>false</code> | cache evaluated functions for reuse. |
| [options.useBigInt64] | <code>Object</code> | <code>false</code> | when deserializing a Long will return a BigInt. |
| [options.promoteLongs] | <code>Object</code> | <code>true</code> | when deserializing a Long will fit it into a Number if it's smaller than 53 bits |
| [options.promoteBuffers] | <code>Object</code> | <code>false</code> | when deserializing a Binary will return it as a node.js Buffer instance. |
| [options.promoteValues] | <code>Object</code> | <code>false</code> | when deserializing will promote BSON values to their Node.js closest equivalent types. |
| [options.fieldsAsRaw] | <code>Object</code> | <code></code> | allow to specify if there what fields we wish to return as unserialized raw buffer. |
| [options.bsonRegExp] | <code>Object</code> | <code>false</code> | return BSON regular expressions as BSONRegExp instances. |
| [options.allowObjectSmallerThanBufferSize] | <code>boolean</code> | <code>false</code> | allows the buffer to be larger than the parsed BSON object. |

Deserialize data as BSON.

**Returns**: <code>Object</code> - returns the deserialized Javascript Object.
<a name="calculateObjectSize"></a>

### calculateObjectSize(object)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| object | <code>Object</code> |  | the Javascript object to calculate the BSON byte size for. |
| [options.serializeFunctions] | <code>Boolean</code> | <code>false</code> | serialize the javascript functions **(default:false)**. |
| [options.ignoreUndefined] | <code>Boolean</code> | <code>true</code> | ignore undefined fields **(default:true)**. |

Calculate the bson size for a passed in Javascript object.

**Returns**: <code>Number</code> - returns the number of bytes the BSON object will take up.
<a name="deserializeStream"></a>

### deserializeStream(data, startIndex, numberOfDocuments, documents, docStartIndex, [options])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>Buffer</code> |  | the buffer containing the serialized set of BSON documents. |
| startIndex | <code>Number</code> |  | the start index in the data Buffer where the deserialization is to start. |
| numberOfDocuments | <code>Number</code> |  | number of documents to deserialize. |
| documents | <code>Array</code> |  | an array where to store the deserialized documents. |
| docStartIndex | <code>Number</code> |  | the index in the documents array from where to start inserting documents. |
| [options] | <code>Object</code> |  | additional options used for the deserialization. |
| [options.evalFunctions] | <code>Object</code> | <code>false</code> | evaluate functions in the BSON document scoped to the object deserialized. |
| [options.cacheFunctions] | <code>Object</code> | <code>false</code> | cache evaluated functions for reuse. |
| [options.promoteLongs] | <code>Object</code> | <code>true</code> | when deserializing a Long will fit it into a Number if it's smaller than 53 bits |
| [options.promoteBuffers] | <code>Object</code> | <code>false</code> | when deserializing a Binary will return it as a node.js Buffer instance. |
| [options.promoteValues] | <code>Object</code> | <code>false</code> | when deserializing will promote BSON values to their Node.js closest equivalent types. |
| [options.fieldsAsRaw] | <code>Object</code> | <code></code> | allow to specify if there what fields we wish to return as unserialized raw buffer. |
| [options.bsonRegExp] | <code>Object</code> | <code>false</code> | return BSON regular expressions as BSONRegExp instances. |

Deserialize stream data as BSON documents.

**Returns**: <code>Number</code> - returns the next index in the buffer after deserialization **x** numbers of documents.

## Error Handling

It is our recommendation to use `BSONError.isBSONError()` checks on errors and to avoid relying on parsing `error.message` and `error.name` strings in your code. We guarantee `BSONError.isBSONError()` checks will pass according to semver guidelines, but errors may be sub-classed or their messages may change at any time, even patch releases, as we see fit to increase the helpfulness of the errors.

Any new errors we add to the driver will directly extend an existing error class and no existing error will be moved to a different parent class outside of a major release.
This means `BSONError.isBSONError()` will always be able to accurately capture the errors that our BSON library throws.

Hypothetical example: A collection in our Db has an issue with UTF-8 data:

```ts
let documentCount = 0;
const cursor = collection.find({}, { utf8Validation: true });
try {
  for await (const doc of cursor) documentCount += 1;
} catch (error) {
  if (BSONError.isBSONError(error)) {
    console.log(`Found the troublemaker UTF-8!: ${documentCount} ${error.message}`);
    return documentCount;
  }
  throw error;
}
```

## React Native

BSON requires that `TextEncoder`, `TextDecoder`, `atob`, `btoa`, and `crypto.getRandomValues` are available globally.  These are present in most Javascript runtimes but require polyfilling in React Native.  Polyfills for the missing functionality can be installed with the following command:
```sh
npm install --save react-native-get-random-values text-encoding-polyfill base-64
```

The following snippet should be placed at the top of the entrypoint (by default this is the root `index.js` file) for React Native projects using the BSON library.  These lines must be placed for any code that imports `BSON`.

```typescript
// Required Polyfills For ReactNative
import {encode, decode} from 'base-64';
if (global.btoa == null) {
  global.btoa = encode;
}
if (global.atob == null) {
  global.atob = decode;
}
import 'text-encoding-polyfill';
import 'react-native-get-random-values';
```

Finally, import the `BSON` library like so:

```typescript
import { BSON, EJSON } from 'bson';
```

This will cause React Native to import the `node_modules/bson/lib/bson.cjs` bundle (see the `"react-native"` setting we have in the `"exports"` section of our [package.json](./package.json).)

### Technical Note about React Native module import

The `"exports"` definition in our `package.json` will result in BSON's CommonJS bundle being imported in a React Native project instead of the ES module bundle.  Importing the CommonJS bundle is necessary because BSON's ES module bundle of BSON uses top-level await, which is not supported syntax in [React Native's runtime hermes](https://hermesengine.dev/).

## FAQ

#### Why does `undefined` get converted to `null`?

The `undefined` BSON type has been [deprecated for many years](http://bsonspec.org/spec.html), so this library has dropped support for it. Use the `ignoreUndefined` option (for example, from the [driver](http://mongodb.github.io/node-mongodb-native/2.2/api/MongoClient.html#connect) ) to instead remove `undefined` keys.

#### How do I add custom serialization logic?

This library looks for `toBSON()` functions on every path, and calls the `toBSON()` function to get the value to serialize.

```javascript
const BSON = require('bson');

class CustomSerialize {
  toBSON() {
    return 42;
  }
}

const obj = { answer: new CustomSerialize() };
// "{ answer: 42 }"
console.log(BSON.deserialize(BSON.serialize(obj)));
```
