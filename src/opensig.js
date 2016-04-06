/*
 * class OpenSig
 *
 * Main entry point of the opensig-lib.
 *
 */


const Err = require('./types/error');
const OpenSigError = require('./types/error');
const KeyPair = require('./types/keyPair');
const UTXO = require('./types/utxo');
const TransactionReceipt = require('./types/receipt');
const Blockchain = require('./blockchain/blockchain_info');
const Crypto = require('crypto');

const OS = require('os');
const FS = require('fs');

// Constants
const minimumPayment = 5430;
const minimumFee = 10000;


// Export

module.exports = {
	sign: sign,
	verify: verify,
	create: create,
	publish: publish,
	send: send,
	balance: balance,
	getKey: getKey,
	blockchainAPI: Blockchain
}


/*
 * verify <file>
 *
 * Returns a promise to verify the given file, returning an array of Signatures retrieved
 * from the blockchain.  If no-one has signed the file an empty array is returned.
 */
function verify( file ){

	if( !file || file == "" ) throw new Err.ArgumentError("invalid file argument"); 

	return getKey(file).then( Blockchain.verify );

}


/*
 * sign <file> [key] [publish] [payment] [miner-fee]
 *
 * Returns a promise to sign the given file using the given key and, optionally, to 
 * publish it on the blockchain.  Resolution of the promise will result in a 
 * TransactionReceipt containing the blockchain response (or 'Not Published'),
 * the file's blockchain address, the transaction id and the transaction (hex).
 *
 * Parameters:
 *   file       : file to sign.  Can be a file, KeyPair, wif or private key (hex64).
 *   key        : key to sign with.  Can be a KeyPair, wif, private key (hex64) or file.
 *   publish    : boolean.  If true the transaction will be published to the blockchain.
 *                Default: false
 *   payment    : overrides the default amount sent in the signature
 *   miner-fee  : overrides the default miner's fee
 *
 * The promise is resolved with a string containing the raw transaction.
 */
function sign( file, key, publish, paymentIn, feeIn ){

	if( !file || file == "" ) throw new Err.ArgumentError("invalid file argument"); 

	var payment = (paymentIn == undefined) ? minimumPayment : paymentIn;
	var fee = (feeIn == undefined) ? minimumFee : feeIn;

	return send( key, file, payment, fee, publish );
}


/*
 * balance <key>
 *
 * Returns a promise to get the balance for the given key
 *
 * Parameters:
 *   key        : can be a KeyPair, public key, wif, private key (hex64) or file.
 */
function balance( key ){
	return getPublicKey(key).then( Blockchain.getBalance );
}


/*
 * create [label]
 *
 * Creates a new KeyPair with the optional label.
 *
 * Parameters:
 *   label  : optional label for this key
 */
function create( label ){
	return new KeyPair(label, undefined);
}


/*
 * send <from> <to> <amount> [fee] [publish]
 *
 * Returns a promise to create a signed transaction to send the given amount from one 
 * address to another and, optionally, to publish it.  By default the transaction is
 * not published.
 *
 * Parameters:
 *   from       : can be a KeyPair, wif, private key (hex64) or file.
 *   to         : can be a public key, KeyPair, wif, private key (hex64) or file.
 *   amount     : number of satoshis to send or "all" to empty the source address
 *   fee        : miner's fee in satoshis.  If undefined the standard fee is used.
 *   publish    : if true, publish the transaction to the blockchain
 */
function send( from, to, amount, feeIn, publishIn ){

	var payment = amount;
	var fee = (feeIn == undefined) ? minimumFee : feeIn;
	if( payment < 0 ) throw new Err.ArgumentError("payment amount cannot be negative");
	if( fee < 0 ) throw new Err.ArgumentError("miner's fee cannot be negative");

	var fromKey;
	var toKey;
	var txID;
	var txHex;

	function getToKey( fromKeyIn ){
		fromKey = fromKeyIn;
		return getPublicKey(to);
	}
	
	function getUTXOs( toKeyIn ){
		toKey = toKeyIn;
		return Blockchain.getUTXO(fromKey);
	}

	function selectUTXOs( response ){
		var txInputs = greedySelectUTXO( response, payment, fee );
		if(!txInputs) throw new Err.InsufficientFundsError();
		if( payment == "all" ) payment = txInputs.value - fee;
		return txInputs;
	}

	function buildTransaction( txInputs ){
		if( payment+fee+txInputs.change != txInputs.value ) 
			throw new Err.InternalError("failed to create a valid transaction inputs",JSON.stringify(txInputs)+"\npayment: "+payment+"\nfee: "+fee);

		var txnBuilder = Blockchain.getTransactionBuilder();

		// add inputs
		var utxo;
		try{
			for( var i=0; i<txInputs.utxos.length; i++ ){
				utxo = txInputs.utxos[i];
				txnBuilder.addInput( utxo.id, utxo.sequence, i );
			}
		}
		catch(err){
			throw new Err.BlockchainError("could not build transaction due to invalid UTXO id or sequence",
			                              { message: err.message, transaction: utxo } ); 
		}
		
		// add outputs
		try{
			txnBuilder.addOutput( toKey, payment );
			if( txInputs.change > 0 ) txnBuilder.addOutput( fromKey.publicKey, txInputs.change );
		}
		catch(err){ throw new Err.InternalError("could not build transaction due to: "+err.message,err); }
		
		// sign inputs
		try{
			for( var i=0; i<txInputs.utxos.length; i++ ){
				txnBuilder.sign(i, fromKey.getECPair());
			}
		}
		catch(err){ throw new Err.InternalError("could not sign transaction due to: "+err.message,err); }
		
		// build
		try{
			var txn = txnBuilder.build();
		}
		catch(err){ throw new Err.InternalError("could not build transaction due to: "+err.message,err); }
		
		txID = txn.getId();
		txHex = txn.toHex();
		return txHex;
		
	}

	function publishTransaction( txn ){
		if( publishIn ) return publish(txn).then( formatOutput );
		else return new TransactionReceipt( toKey, "Not Published", txID, txHex );
	}
	
	function formatOutput( pushTxResponse ){
		return new TransactionReceipt( toKey, pushTxResponse, txID, txHex );;
	}
	
	return getKey( from )
		.then( getToKey )
		.then( getUTXOs )
		.then( selectUTXOs )
		.then( buildTransaction )
		.then( publishTransaction );
	
}


/*
 * publish <transaction>
 *
 * Promises to publish the given transaction (in hex) to the blockchain
 */
function publish( txn ){
	return Blockchain.sign(txn);
}
	

/*
 * getKey <token>
 *
 * Promises to return a KeyPair for the given private key, wif or file.
 */
 function getKey( token ){ 
 	if( token instanceof KeyPair ){
		return new Promise( 
			function( resolve, reject ){ resolve( token ); } );
 	}
 	try{
 		var keyPair = new KeyPair( undefined, token );
		return new Promise( 
			function( resolve, reject ){ resolve( keyPair ); } );
 	}
 	catch(err){
		return sha256( token )
			.catch( function(err){ 
				throw new Err.ArgumentError("argument is not a private key, readable file or wif", token); 
			});
 	}
}


/* 
 * Local functions
 */
 
 
/*
 * getPublicKey <token>
 *
 * Promises to return the public key for the given private key, public key, wif, 
 * or file.  
 */
function getPublicKey( token ){
	if( isPublicKey(token) ){
		return new Promise( 
			function( resolver, rejecter ){ resolver( token ); } );
	}
	else{ 
		return getKey(token).then( function( keyPair ){ return keyPair.publicKey } )
			.catch( function notPrivateKeyWifOrFile(err){
				throw new Err.ArgumentError("argument is not a public key, private key, readable file or wif", token); 
			} );
	}
}



/*
 * greedySelectUTXO <utxos> <payment> <fee>
 * 
 * Uses a greedy algorithm to select the set of unspent transaction outputs to meet
 * the given target value of payment+fee.  Returns a TransactionInputs object that contains 
 * the set of UTXOs and the amount of any change to be returned to the sender.
 */
function greedySelectUTXO( utxos, payment, fee ){
	if( !utxos || utxos.length == 0 ) return undefined;
	var result = [];
	if( payment == "all" ){
		for( var i in utxos ){
			result.push(utxos[i]);
		}
		var txInputs = new TransactionInputs( result, "all", 0 );
		if( txInputs.value > fee ) return txInputs;
	}
	else{
		// pick smallest transaction whose value >= target
		var target = payment+fee;
		utxos.sort(UTXO.compare);
		for( var i in utxos ){
			if( utxos[i].value >= target ){
				result.push(utxos[i]);
				var change = utxos[i].value - target;
				return new TransactionInputs( result, target, change );
			}
		}

		// no single utxo is large enough so sum smallest number of utxos
		utxos.sort(UTXO.compareInReverse);
		var sum = 0;
		var change = -target;
		for( var i in utxos ){
			result.push(utxos[i]);
			sum += utxos[i].value;
			change += utxos[i].value;
			if( sum >= target ) return new TransactionInputs( result, target, change );
		}
	}
	return undefined;
}


function TransactionInputs( utxos, target, change ){

	this.utxos = utxos;
	this.change = change;
	this.value = 0;
	for( var i in this.utxos ){ this.value += this.utxos[i].value; }
	if( target == "all" ) target = this.value; 
	if( this.change < 0 || this.value - this.change != target ){
		throw new Err.InternalError("failed to create a valid transaction inputs",JSON.stringify(this)+"\ntarget: "+target);
	}
	
}


 /*
  * sha256
  *
  * Returns a promise to compute the sha256 hash of the given file. 
  */
function sha256( file ){
	return new Promise( 
		function( resolve, reject ){
			var hash = Crypto.createHash('sha256');
			var fd;
			try{
				fd = FS.ReadStream(file);
			}
			catch(err){ 
				reject( new Err.FileSystemError(err) ); 
			}
			fd.on('data', function(d) { hash.update(d); });
			fd.on('error', function(err){ reject( new Err.FileSystemError(err) ); });
			fd.on('end', function() { 
				var keyPair = new KeyPair( file, hash.digest('hex') );
				resolve( keyPair ); 
			});
		} );
}



function isPublicKey( str ){ return str.match && str.match(/^[0-9A-Za-z^OIl]{27,34}$/); }
