/*
 * class opensig/Receipt
 *
 * Represents a signature transaction published (or to be published) on the blockchain.
 * Contains the transaction (hex), the transaction id, the address of the file signed
 * and the blockchain api response (or 'Not Published').
 */
 
function Receipt( from, fromLabel, to, toLabel, amount, fee, inputAmount, change, response, txnID, txnHex ){

	this.from = { address: from, label: fromLabel };
	this.to = { address: to, label: toLabel };

	this.input = inputAmount;
	this.payment = amount;
	this.fee = fee;
	this.change = change;

	this.response = response;
	this.txnID = txnID;
	this.txnHex = txnHex;

}
 

module.exports = Receipt;