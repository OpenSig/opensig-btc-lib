/*
 * OpenSig generic blockchain API interface
 *
 * Provides request and post functions for use by blockchain api interfaces.  Also
 * provides a test mode to allow simulated url responses to be injected via files.
 *
 * Opensig expects all blockchain API implementations to export the following functions:
 *
 *   verify     = function( key );         // return promise to resolve Signature[] 
 *   sign       = function( transaction ); // return promise to resolve api response string 
 *   getUTXO    = function( key );         // return promise to resolve UTXO[] 
 *   getBalance = function( key );         // return promise to resolve balance in satoshis as integer
 *
 *   getTransactionBuilder = function();   // return bitcoinjs-lib/TransactionBuilder
 *   setTestMode = function( on );         // return null
 *
 * where:
 *   key          is a public blockchain address
 *   transaction  is a hex string containing the raw transaction
 *   on           boolean
 * 
*/

const Err = require('../types/error');

var request = require('request-promise');

/*
 * request
 *
 * returns a promise to perform the given https request
 */
module.exports.request = function( url ){
    return request(url).catch( handleRequestError );
}

/*
 * post
 *
 * returns a promise to perform the given https post request
 */
module.exports.post = function( url, body ){
	var post = { method: 'POST', url: url, form: { tx: body } }
    return request(post).catch( handleRequestError );
}


/*
 * handleRequestError
 *
 * Recodes a fundamental request error 
 */
function handleRequestError( error ){
	if( error.name == "RequestError" && error.cause ){
		switch(error.cause.code){
			case "ENOTFOUND": throw new Err.BlockchainNotFoundError(error);
			default: throw new Err.BlockchainError("Blockchain request failed", error);
		}
	}
	else throw error;
}


/*
 * enableTestMode
 *
 * For testing purposes only.  Configures the blockchain to obtain its responses from the
 * test_https module.
 */
module.exports.setTestMode = function( on ){
	request = on ? require('./test_api') : require('request-promise');
	if( on ) request("reset test harness");
}