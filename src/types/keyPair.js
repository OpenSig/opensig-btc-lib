/*
 * class opensig/KeyPair
 *
 * Represents a public/private key pair with an optional label.
 *
 * Example usage:
 *   const KeyPair = require('opensig/keyPair')
 *   var newKey = new KeyPair("My New Key")     // generate a new key with the given label
 *   var toKey  = new KeyPair("My Key", myWIF)  // create a KeyPair using the given wif and label
 *
 * Uses bitcoinjs-lib/ECPair to generate the key properties
 */

const Err = require('./error');

var bitcoin = require("bitcoinjs-lib");
var BigInteger = require('bigi');


function KeyPair( label, key ){

	// generate ECPair depending on the type of the key parameter
	
	var ecPair;

	if( key == undefined ){
		ecPair = bitcoin.ECPair.makeRandom();
	}
	else if( isPrivateKey(key) ){
		var keyInt = new BigInteger( key, 16 );
		ecPair = new bitcoin.ECPair(keyInt);
	}
	else if( isWIF(key) ){
		ecPair = bitcoin.ECPair.fromWIF(key);
	}
	else throw new Err.ArgumentError("Cannot create KeyPair from '"+key+"'");

	// generate all key properties
	
	this.privateKey = ("000000000000000000000000000000000000000000000000000000000000000" + ecPair.d.toString(16)).substr(-64);
	
	var trimmedLabel = label ? label.trim() : label;
	this.label = ( trimmedLabel == "undefined" || trimmedLabel == "" ) ? undefined : label;

	ecPair.compressed = true;	
	this.publicKeyC =  ecPair.getAddress();
	this.wifC = ecPair.toWIF();

	ecPair.compressed = false;	
	this.publicKeyU =  ecPair.getAddress();
	this.wifU = ecPair.toWIF();

	this.publicKey = this.publicKeyC;
	this.wif = this.wifC;
	
	this.ecPair = ecPair;
	this.ecPair.compressed = true;	
	
	
	/*
	 * toString( [format] )
	 *
	 * format: string representation of the output format containing the following
	 *         substrings for substitution
	 *    <label>  the key's label
	 *    <pub>    the public key (blockchain address)
	 *    <priv>   the private key
	 *    <wif>    the Wallet Import Format version of the private key
	 *    <pubc>   public key (compressed form)
	 *    <pubu>   public key (uncompressed form)
	 *    <wifc>   wif (compressed form)
	 *    <wifu>   wif (uncompressed form)
	 *
	 *  The following preconfigured formats can be used:
	 *    <full>   outputs the full key information in a verbose form
	 *
	 *  The following prefixes can be used:
	 *    <u>      output uncompressed values where appropriate
	 *
	 */
	this.toString = function toString( format ){

		var result = format || "";

		// check for preconfigured formats
		if( result == "" ) result = "<pub>	<wif>	<label>";
		else if( result == "<full>" ) result = FORMAT_FULL;

		// substituions
		result = result.replace( /<label>/g, this.label );
		result = result.replace( /<pub>/g, this.publicKey );
		result = result.replace( /<priv>/g, this.privateKey );
		result = result.replace( /<wif>/g, this.wif );
		result = result.replace( /<wifc>/g, this.wifC );
		result = result.replace( /<wifu>/g, this.wifU );
		result = result.replace( /<pubc>/g, this.publicKeyC );
		result = result.replace( /<pubu>/g, this.publicKeyU );

		return result;
	}
	
	this.getECPair = function(){ return this.ecPair; }
	
}


module.exports = KeyPair;


/*
 * Constants
 */
 
const FORMAT_FULL = "\nlabel                   : <label>\nprivate key             : <priv>\nwif compressed          : <wifc>\nwif uncompressed        : <wifu>\npublic key compressed   : <pubc>\npublic key uncompressed : <pubu>\n";


/*
 * Local functions
 */
function isWIF( str ){ return str.match('[5KL][A-Za-z0-9]{51}') || str.match('[A-Za-z0-9]{51}'); }
function isPrivateKey( str ){ return str.match('[a-z0-9]{64}'); }

