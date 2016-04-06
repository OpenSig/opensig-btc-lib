/*
 * Class opensig/UTXO
 *
 * Represents an unspent transaction output queried from the blockchain.
 *
 */

UTXO = function( id, sequence, value ){

	this.id = id;
	this.sequence = sequence;
	this.value = value;
	
}


function compare(a,b){
	return (a.value < b.value) ? -1 : (a.value > b.value) ? 1 : 0;
}
	
function compareInReverse(a,b){
	return compare(b,a);
}


module.exports.UTXO = UTXO;	
module.exports.compare = compare;
module.exports.compareInReverse = compareInReverse;