/*
 * class opensig/Receipt
 *
 * Represents a signature transaction published (or to be published) on the blockchain.
 * Contains the transaction (hex), the transaction id, the address of the file signed
 * and the blockchain api response (or 'Not Published').
 */
 
function Receipt( publicKey, response, txnID, txnHex ){
	this.response = response;
	this.address = publicKey
	this.txnID = txnID;
	this.txnHex = txnHex;
}
 

module.exports = Receipt;