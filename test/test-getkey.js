const chai = require('chai');  chai.use( require('chai-as-promised') );
const fs = require('fs');
const opensig = require("../src/opensig");

const expect = chai.expect;


describe ("GETKEY Feature", function() {

	const helloWorld_FullOutputKey = 
		"identity                : OPENSIG-13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14-btc\n" +
		"private key             : d2a84f4b8b650937ec8f73cd8be2c74add5a911ba64df27458ed8229da804a26\n" +
		"wif compressed          : L4HCdx7tRz8F1azW9xUACNP2G4gnDoSdLZfJQm8MVEx9WEKwePct\n" +
		"wif uncompressed        : 5KR4YUtriTY6SWTAn5QprFMrDvrLm8ob4XWXE61m4gQphACdYyz\n" +
		"public key compressed   : 13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14\n" +
		"public key uncompressed : 14Kjekut4gqR8DgxwQXz1nnACVxHQhcjKA\n";


	const helloWorld_FullOutputKey_noLabel = 
		"label                   : undefined\n" + 
		helloWorld_FullOutputKey;


	const helloWorld_FullOutputKey_fileLabel = 
		"label                   : test/test_files/hello_world.txt\n" + 
		helloWorld_FullOutputKey;


	describe("Invalid arguments:", function() {


		it("calling getKey with a non-existent file results in an error", function() {
			return expect( opensig.getKey("non-existent-file") ).to.eventually.be.rejectedWith("argument 'non-existent-file' is not a private key, readable file or wif");
		});


		it("calling getKey with nonsense results in an error", function() {
			return expect( opensig.getKey("nonsense%&£@*&") ).to.eventually.be.rejectedWith("argument 'nonsense%&£@*&' is not a private key, readable file or wif");
		});


	});



	describe("generates a random KeyPair", function() {


		it("from no argument", function() {
			
			return opensig.getKey()
				.then( function checkResults( key ){
					checkKey(key, undefined);
				} );

		});


		it("from an empty argument", function() {
			
			return opensig.getKey("")
				.then( function checkResults( key ){
					checkKey(key, undefined);
				} );

		});


	});
	

	describe("generates a KeyPair for hello_world.txt", function() {


		it("from its private key", function() {
			
			return opensig.getKey("d2a84f4b8b650937ec8f73cd8be2c74add5a911ba64df27458ed8229da804a26")
				.then( function checkResults( key ){
					checkKey(key, undefined);
					expect( key.toString("<full>") ).to.equal(helloWorld_FullOutputKey_noLabel);
				} );

		});


		it("from its compressed WIF", function() {
			
			return opensig.getKey("L4HCdx7tRz8F1azW9xUACNP2G4gnDoSdLZfJQm8MVEx9WEKwePct")
				.then( function checkResults( key ){
					checkKey(key, undefined);
					expect( key.toString("<full>") ).to.equal(helloWorld_FullOutputKey_noLabel);
				} );

		});


		it("from its uncompressed WIF", function() {
			
			return opensig.getKey("5KR4YUtriTY6SWTAn5QprFMrDvrLm8ob4XWXE61m4gQphACdYyz")
				.then( function checkResults( key ){
					checkKey(key, undefined);
					expect( key.toString("<full>") ).to.equal(helloWorld_FullOutputKey_noLabel);
				} );

		});


		it("from the file name", function() {
			
			return opensig.getKey("test/test_files/hello_world.txt")
				.then( function checkResults( key ){
					checkKey(key, "test/test_files/hello_world.txt");
					expect( key.toString("<full>") ).to.equal(helloWorld_FullOutputKey_fileLabel);
				} );

		});


	});
	

	describe("generates a KeyPair for hello_world.txt", function() {


		it("from its private key", function() {
			
			return opensig.getKey("d2a84f4b8b650937ec8f73cd8be2c74add5a911ba64df27458ed8229da804a26")
				.then( function checkResults( key ){
					checkKey(key, undefined);
					expect( key.toString("<full>") ).to.equal(helloWorld_FullOutputKey_noLabel);
				} );

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
