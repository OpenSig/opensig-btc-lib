/*
 * blockchain.info api
 *
 * Provides an interface to query blockchain.info and to post a signature transaction.
 * Conforms to the opensig/blockchain/blockchain interface.  Transforms the received data 
 * to opensig types.
 *
 * Uses bitcoinjs-lib to build transactions.
 *
*/

const BC = require('./blockchain');
const BitcoinJS = require('bitcoinjs-lib');
const Signature = require('../types/signature');
const UTXO = require('../types/utxo');
const Err = require('../types/error');


/*
 * sign
 */
module.exports.sign = function( txn ){
	var url = 'https://blockchain.info/pushtx';
	try{
		return BC.post( url, txn )
				.catch( function( response ){ handleAPIError(url+" body='"+txn+"'", response); } );
	}
	catch(err){ handleAPIError(url+" body='"+txn+"'", err) };
}


/*
 * verify
 */
module.exports.verify = function( key ){
	var url = 'https://blockchain.info/address/'+key.publicKey+'?format=json';
	try{
		return BC.request(url).then(
			function( response ){
				return parseTransactionQueryResponse( response, key.publicKey );
			} )
			.catch( function( response ){ handleAPIError(url, response); } );
	}
	catch(err){ handleAPIError(url, err) };
}


/*
 * getUTXO
 */
module.exports.getUTXO = function( key ){
	var url = 'https://blockchain.info/unspent?active='+key.publicKey;
	try{
		return BC.request(url).then(
			function( response ){
				return parseUTXOResponse( response, key.publicKey );
			} ).catch( function( response ){ handleAPIError(url, response); } );
	}
	catch(err){ handleAPIError(url, err) };	
}


/*
 * getBalance
 */
module.exports.getBalance = function( publicKey ){
	var url = 'https://blockchain.info/q/addressbalance/'+publicKey;
	try{
		return BC.request(url).catch( 
			function( response ){ handleAPIError(url, response); } );
	}
	catch(err){ handleAPIError(url, err) };
}


/*
 * getTransactionBuilder
 */
 module.exports.getTransactionBuilder = function(){
 	return new BitcoinJS.TransactionBuilder()
}
 

/*
 * setTestMode
 *
 * For testing purposes only.  Configures the blockchain to obtain its responses from 
 * test files instead of accessing the web api
 */
module.exports.setTestMode = function( on ){
	BC.setTestMode(on);
}



/*
 * Local functions
 */
 
 
/*
 * function parseTransactionQueryResponse
 *
 * Parses the response to an 'address' request
 */
function parseTransactionQueryResponse( response, key ){
	var signatures = [];
	try{
		var json = JSON.parse(response);
		for( var txn in json.txs ){
			for( var output in json.txs[txn].out ){
				if( json.txs[txn].out[output].addr == key ){
					if( json.txs[txn].inputs.length > 0 ){
						// an OpenSig signature transaction consists of 1 or more inputs from the same address so 
						// just record the first input
						var sig = new Signature(json.txs[txn].time, json.txs[txn].inputs[0].prev_out.addr, 'btc');
						signatures.push(sig);
					}
				}
			}
		}
	}
	catch(err){ 
		throw new Err.BlockchainError( "blockchain.info response was invalid", response+"\n"+err ); 
	}
	return signatures;
}


/*
 * function parseUTXOResponse
 *
 * Parses the response to an 'unspent' transaction request
 */
function parseUTXOResponse( response ){
	var utxos = [];
	try{
		var json = JSON.parse(response);
		for( var txn in json.unspent_outputs ){
			utxos.push( new UTXO.UTXO( json.unspent_outputs[txn].tx_hash_big_endian, json.unspent_outputs[txn].tx_output_n, json.unspent_outputs[txn].value ) );
		}
	}
	catch(err){ 
		throw new Err.BlockchainError( "blockchain.info response was invalid", response+"\n"+err ); 
	}
	return utxos;
}


/*
 * handleAPIError
 *
 * Recodes an error from blockchain.info
 */
function handleAPIError( url, error ){
	switch( error.name ){
		case "OpenSigError":
			throw error;
		case "StatusCodeError":
			switch(error.statusCode){
				case 500: 
					if( error.error == "No free outputs to spend" ){
						throw new Err.InsufficientFundsError();
					}
					throw new Err.BlockchainError(error.error, {url: url, error: error} );
				default: throw new Err.BlockchainError("unknown error from blockchain api: "+error.name, {url: url, error: error} );
			}
		default: throw new Err.BlockchainError("unknown error from blockchain api: "+error.name, {url: url, error: error} );
	}
}


