const chai = require('chai');  chai.use( require('chai-as-promised') );
const fs = require('fs');
const opensig = require("../src/opensig");

const expect = chai.expect;


describe ("CREATE Feature", function() {


	describe("creates", function() {

		it("a new key without label", function() {
			var key = opensig.create();
			checkKey( key, undefined );
		});


		it("a new key with an empty label", function() {
			var key = opensig.create("");
			checkKey( key, undefined );
		});


		it("a new key with a whitespace only label", function() {
			var key = opensig.create("	 \n");
			checkKey( key, undefined );
		});


		it("a new key with an explicit undefined label", function() {
			var key = opensig.create("undefined");
			checkKey( key, undefined );
		});


		it("a new key with a label", function() {
			var key = opensig.create("String with $%£ chars and SpAcEs");
			checkKey( key, "String with $%£ chars and SpAcEs" );
		});

	});
	

});


function checkKey( key, label ){
	expect( key.label ).to.equal( label );
	expect( key.publicKeyC ).to.match( /^[A-Za-z0-9]{27,34}$/ );
	expect( key.publicKeyU ).to.match( /^[A-Za-z0-9]{27,34}$/ );
	expect( key.publicKeyU ).to.not.equal( key.publicKeyC );
	expect( key.publicKey ).to.equal( key.publicKeyC );
	expect( key.wifC ).to.match( /^[5KL][A-Za-z0-9]{51}$/ );
	expect( key.wifU ).to.match( /^[A-Za-z0-9]{51}$/ );
	expect( key.wif ).to.equal( key.wifC );
	expect( key.privateKey ).to.match( /^[0-9a-f]{1,64}$/ );
}
