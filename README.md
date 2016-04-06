# OpenSig Library (opensig-lib)

[![NPM](https://img.shields.io/npm/v/bitcoinjs-lib.svg)](https://www.npmjs.org/package/bitcoinjs-lib)


Blockchain e-sign library.  A class that implements the [opensig e-sign protocol](http://opensig.net/library/protocol) providing functions to sign and verify files, recording signatures on the bitcoin blockchain. 

## Primary Features
- **Create**: generate a new private key.
- **Sign**: sign any file with your private key and record your signature on the blockchain.
- **Verify**: retrieve a list of a file's signatures from the blockchain.

## Secondary Features
- **Send**: create and publish a transaction to spend any amount from one address to another.
- **Publish**: publishes a transaction on the blockchain.
- **Balance**: retrieve the balance of your key (or any public key) from the blockchain.
- **Get Key**: obtain private key, wif and public keys from any private key, WIF or file.


## Installation

`npm install opensig-lib`

## Setup
### Node.js
```javascript
const opensig = require('opensig-lib')
```

## Usage

### Create
Returns a KeyPair object containing a random private key and its associated wif and public keys.
```javascript
opensig.create( [label] )   // returns a KeyPair object
```
`label`  optional label to populate the key's lable property

### Sign
Returns a promise to resolve a Receipt object containing a transaction to sign the given file with the given key, and, optionally, to publish the transaction on the blockchain.

Equivalent to `opensig.send( key, file, payment, fee, publish )`.

```javascript
opensig.sign( <file>, <key>, [publish], [payment], [fee] );  // returns a promise
```
`file`  File to sign.  _(string containing a file path or a file's hex64 private key or WIF.  Can also accept a KeyPair object)_.

`key`   Key to sign with.  _(KeyPair, or a string containing a hex64 private key, a WIF or a file)_ 

`publish`   If true the transaction will be published on the blockchain.  _(boolean)_

`payment`   Amount to send in the transaction.  Defaults to 5430 satoshis. _(positive integer)_

`fee`   Amount to include as the miner's fee.  Defaults to 10000 satoshis. _(positive integer)_

### Verify
Returns a promise to resolve an array of Signature objects containing the list of signatures for the given file.

```javascript
opensig.verify( <file> )   // returns a promise
```
`file`  File to verify.  _(string containing a file path or a file's hex64 private key or WIF.  Can also accept a KeyPair object)_.

### Send
Returns a promise to resolve a Receipt object containing a transaction to send the given amount from the `from` key to the `to` address, and, optionally, to publish the transaction on the blockchain.
```javascript
opensig.send( <from>, <to>, [amount], [fee], [publish] );  // returns a promise
```
`from`  Private key or wif of the address to spend from.  _(string containing a hex64 private key, WIF or file.  Can also accept a KeyPair object)_.

`to`   Address to send to.  _(string containing a public key, hex64 private key, WIF or file.  Can also accept a KeyPair object)_ 

`amount`   Amount to spend in the transaction.  Defaults to 5430 satoshis. _(positive integer)_

`fee`   Amount to include as the miner's fee in addition to the amount.  Defaults to 10000 satoshis. _(positive integer)_

`publish`   If true the transaction will be published on the blockchain. Defaults to false. _(boolean)_

### Balance
Returns a promise to resolve the sum of unspent transaction outputs retrieved from the blockchain for the given public key.
```javascript
opensig.balance( <key> )   // returns a KeyPair object
```
`key`   Public key.  _(string containing a public key, hex64 private key, WIF or file.  Can also accept a KeyPair object)_ 

### Get Key
Returns a promise to resolve a KeyPair object from the given private key, WIF or file.
```javascript
opensig.getKey( <key> )   // returns a KeyPair object
```
`key`   Private key.  _(string containing a hex64 private key, WIF or file)_ 

## Examples

Require opensig-lib
```javascript
opensig = require('opensig-lib');
```
Create a new random private key and log its information to the console in various formats...
```javascript
var key = opensig.create();
console.log( key.toString() );
console.log( key.toString("<full>") );
console.log( key.toString("public key: <pub>, wif: <wif>, private key: <priv>") );
console.log( key.toString("compressed keys: <pubc> <wifc>") );
console.log( key.toString("uncompressed keys: <pubu> <wifu>") );
```
Send 100000 satoshis from another address to your new key using the WIF of the other address.  Use the default miner's fee...
```javascript
const myWellFundedWIF = "L1FpYdmkgXyRHQrMjy4ChBmJ4dbgJmr5Y1h5eX9LmsPWKBZBqkUg";
opensig.send( myWellFundedWIF, key, 100000, undefined, true )
    .then( function log(response){ console.log(response); } )
    .catch( function logError(err){ console.error(err); } );
```
Get the blockchain balance for the key...
```javascript
opensig.balance( key )
    .then( function log(balance){ console.log(balance); } )
    .catch( function logError(err){ console.error(err); } );
```
Generate a transaction to sign my_file.doc, including publishing it to the blockchain, and log the resulting Receipt object or error to the console...
```javascript
opensig.sign( "my_file.doc", key, true )
    .then( function log(receipt){ console.log(receipt); } )
    .catch( function logError(err){ console.error(err); } );
```
Verify my_file.doc and output the signatures to the console...
```javascript
opensig.verify( "my_file.doc" )
    .then( function log(signatures){
        for( var i in signatures ){
            console.log( signatures[i].toString() );
        } } )
    .catch( function logError(err){ console.error(err); } );
```
Publish a transaction taken from a Receipt obtained from a previous call to `send`, logging the blockchain api response or error to the console...
```javascript
opensig.publish( myReceipt.txnHex )
    .then( function log(response){ console.log(response); } )
    .catch( function logError(err){ console.error(err); } );
```
Get a KeyPair object from a file and output its public key...
```javascript
opensig.getKey( "my_file.doc" )
    .then( function log(keyPair){ console.log( keyPair.toString("<pub>") ); } )
    .catch( function logError(err){ console.error(err); } );
```

## Projects utilizing opensig-lib

- [OpenSig](https://github.com/opensig/opensig)

If you have a project that you feel could be listed here, please [ask for it](https://github.com/opensig/opensig-lib/issues/new)!


### Run the tests

    $ npm test
    $ npm run-script test-cov


## Copyright

OpenSig (c) 2016 D N Potter

Released under the [MIT license](LICENSE)