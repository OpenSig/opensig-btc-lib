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

var testData = undefined;

// Export

module.exports = {
	sign: sign,
	verify: verify,
	create: create,
	publish: publish,
	send: send,
	balance: balance,
	getKey: getKey,
	getSupportedBlockchains: getSupportedBlockchains,
	blockchainAPI: Blockchain,
	KeyPair: KeyPair,
	Error: Err,
	testPoint: testPoint
}


/*
 * getSupportedBlockchains 
 *
 * Returns a list of the blockchains supported by OpenSig.  Each element is a record of
 * the form { code: 'btc', name: 'Bitcoin' }
 */
function getSupportedBlockchains(){
	return [ { code: 'btc', name: 'Bitcoin' } ];
}


/*
 * verify <file>
 *
 * Returns a promise to verify the given file, returning an array of Signatures retrieved
 * from the blockchain.  If no-one has signed the file an empty array is returned.
 */
function verify( file ){

	checkForMissingArg( file, "file" );
	
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

	checkForMissingArg( file, "file" );
	checkForMissingArg( key, "key" );

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

	checkForMissingArg( key, "key" );
	
	return getPublicKey(key).then( Blockchain.getBalance );
}


/*
 * create [label] [privateKey]
 *
 * Creates a new KeyPair with the optional label or returns a KeyPair representing the
 * given private key.
 *
 * Parameters:
 *   label      : optional label for this key
 *   privateKey : wif or private key (hex64)
 */
function create( label, privateKey ){
	return new KeyPair(label, privateKey);
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

	checkForMissingArg( from, "from" );
	checkForMissingArg( to, "to" );
	checkForMissingArg( amount, "amount" );
	
	var payment = (amount == "all") ? amount : parseInt(amount);
	var fee = (feeIn == undefined) ? minimumFee : parseInt(feeIn);

	if( payment != "all" && ( isNaN(payment) || payment <= 0 ) ) throw new Err.ArgumentError("invalid payment amount '"+amount+"'");
	if( isNaN(fee) || fee < 0 ) throw new Err.ArgumentError("invalid fee '"+feeIn+"'");

	var fromKey;
	var receipt = new TransactionReceipt();
	receipt.to.label = (to instanceof KeyPair) ? to.label : !isPublicKey(to) ? to : undefined;

	function getToKey( fromKeyIn ){
		fromKey = fromKeyIn;
		receipt.from.address = fromKey.publicKey;
		receipt.from.label = fromKey.label;
		return getPublicKey(to);
	}
	
	function getUTXOs( toKeyIn ){
		toKey = toKeyIn;
		receipt.to.address = toKeyIn;
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

		receipt.input = txInputs.value;
		receipt.payment = payment;
		receipt.fee = fee;
		receipt.change = txInputs.change;

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
			receipt.txnID = txn.getId();
			receipt.txnHex = txn.toHex();
			return receipt.txnHex;
		}
		catch(err){ throw new Err.InternalError("could not build transaction due to: "+err.message,err); }
		
	}

	function publishTransaction( txn ){
		if( publishIn ) return publish(txn).then( formatOutput );
		else{
			receipt.response = "Not Published";
			return receipt;
		}
	}
	
	function formatOutput( pushTxResponse ){
		receipt.response = pushTxResponse;
		return receipt;
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

	checkForMissingArg( txn, "transaction" );
	
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
				if( err.code && err.code == new Err.FileSystemError().code ) throw new Err.ArgumentError("argument '"+token+"' is not a private key, readable file or wif", token); 
				else throw err;
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
	var id = decodeOpenSigID(token);
	if( id != undefined ){
		return new Promise( 
			function( resolver, rejecter ){ resolver( id.publicKey ); } );
	}
	else{ 
		return getKey(token).then( function( keyPair ){ return keyPair.publicKey } )
			.catch( function notPrivateKeyWifOrFile(err){
				throw new Err.ArgumentError("argument '"+token+"' is not a public key, private key, readable file or wif", token); 
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
		var target = payment + fee; 
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
function sha256( file, postfix ){
	if( !postfix ) postfix = "";
	return new Promise( 
		function( resolve, reject ){
			try{
				var hash = Crypto.createHash('sha256');
				var fd = FS.ReadStream(file);
				fd.on('data', function(d) { hash.update(d); });
				fd.on('error', function(err){ reject( new Err.FileSystemError(err) ); });
				fd.on('end', function() { 
					if( postfix.length > 0 ) hash.update(postfix, 'ascii');
					var keyPair;
					try{
						if( testData && testData.nonEcdsaKeyCount && postfix.length < testData.nonEcdsaKeyCount ){
							throw new Err.NonEcdsaKeyError(); // test point to simulate the generation of keys outside of the valid ECDSA range
						}
						var filename = file.fullPath || file;  // cater for both file Entry and string file name
						keyPair = new KeyPair( filename, hash.digest('hex') );
					}
					catch(err){ 
						reject( new Err.NonEcdsaKeyError() );
					}
					if( keyPair ) resolve( keyPair );
				});
			}
			catch(err){
				reject( new Err.FileSystemError(err) );
			}
		})
		.catch( function(err){
			if( err.code && err.code == new Err.NonEcdsaKeyError().code ){
				if( postfix.length < 2 ) return sha256( file, postfix + String.fromCharCode(0) );
				else throw new Err.InternalError("Failed to generate a valid ECDSA key after 3 attempts");
			}
			else throw err;
		});
}


function isPublicKey( str ){ return str && str.match && str.match(/^[0-9A-Za-z^OIl]{27,34}$/); }

function decodeOpenSigID( str ){
	if( ! str.split ) return undefined;
	var fields = str.split('-');
	if( fields.length == 1 && isPublicKey(fields[0]) ) return { publicKey: fields[0], blockchainID: 'btc' };
	if( fields.length == 2 && isPublicKey(fields[0]) ) return { publicKey: fields[0], blockchainID: fields[1].toLowerCase() };
	if( fields.length == 3 && 
	    fields[0].toLowerCase() == 'opensig' && 
	    isPublicKey(fields[1]) && fields[2].length > 0 ) return { publicKey: fields[1], blockchainID: fields[2].toLowerCase() };
	return undefined;
}

function checkForMissingArg( arg, name ){ 
	if( arg == undefined || (""+arg).match(/^\s*$/) ) throw new Err.ArgumentError(name+" argument is missing"); 
}

function testPoint( data ){
	testData = data;
}
