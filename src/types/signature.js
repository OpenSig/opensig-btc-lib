/*
 * class opensig/Signature
 *
 * Represents a file signature queried from the blockchain.
 *
 */

// Signature
Signature = function( time, key, bcCode, label ){

	this.time = new Date(time*1000);
	this.key = key;
	this.label = (label == undefined) ? "" : label;;
	this.bcCode = bcCode;
	
	
	/*
	 * toString( [format] )
	 *
	 * format: string representation of the output format containing the following
	 *         substrings for substitution
	 *    <label>    the signee's name or label
	 *    <pub>      the public key (blockchain address)
	 *    <time>     the blockchain transaction time (seconds since 1/1/1970)
	 *    <longtime> the blockchain transaction time as a date string
	 */
	this.toString = function( format ){
		var result = ( format == undefined ) ? "<longtime>	<id>	<label>" : ""+format;
		result = result.replace( /<label>/g, this.label );
		result = result.replace( /<id>/g, "OPENSIG-"+this.key+"-"+this.bcCode );
		result = result.replace( /<pub>/g, this.key );
		result = result.replace( /<time>/g, this.time.getTime()/1000 );
		result = result.replace( /<longtime>/g, this.time.toUTCString() );
		return result;
	}
	

}


module.exports = Signature;