const chai = require('chai');  chai.use( require('chai-as-promised') );
const fs = require('fs');
const opensig = require("../src/opensig");

const expect = chai.expect;


describe ("GetSupportedBlockchains Feature", function() {

		it("returns the correct set of blockchains", function() {
			var bcs = opensig.getSupportedBlockchains();
			expect( JSON.stringify(bcs) ).to.equal('[{"code":"btc","name":"Bitcoin"}]');
		});

});


describe ("GETKEY Feature", function() {

	const helloWorld_FullOutputKey = 
		"identity                : OPENSIG-13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14-btc\n" +
		"private key             : d2a84f4b8b650937ec8f73cd8be2c74add5a911ba64df27458ed8229da804a26\n" +
		"wif compressed          : L4HCdx7tRz8F1azW9xUACNP2G4gnDoSdLZfJQm8MVEx9WEKwePct\n" +
		"wif uncompressed        : 5KR4YUtriTY6SWTAn5QprFMrDvrLm8ob4XWXE61m4gQphACdYyz\n" +
		"public key compressed   : 13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14\n" +
		"public key uncompressed : 14Kjekut4gqR8DgxwQXz1nnACVxHQhcjKA\n";

	const helloWorld_plus1zero_FullOutputKey = 
		"label                   : test/test_files/hello_world.txt\n" + 
		"identity                : OPENSIG-1MaunEFnTpoAys7VouR5B7PgmKuupuEXPW-btc\n" +
		"private key             : 0e43503bad7986003585b0424d8d1f9c54c43fb9050dce3dc934643dbbaf0be2\n" +
		"wif compressed          : KwhSFZMQR8MYMQhK7qgfLErQDATbeoXAux6oG1TzP6CbNxN6XMeM\n" +
		"wif uncompressed        : 5HvZugxNcptKtJ9gT24Yo3gjsLMynioiDT5V9qbD6TZ5cox795T\n" +
		"public key compressed   : 1MaunEFnTpoAys7VouR5B7PgmKuupuEXPW\n" +
		"public key uncompressed : 1KrbppaHd5WDSvbia8BhY6FzYDUSYsMft2\n";

	const helloWorld_plus2zeros_FullOutputKey = 
		"label                   : test/test_files/hello_world.txt\n" + 
		"identity                : OPENSIG-1AZf1GGj8ajSbV56eRwB34Zi5eZQ2QfFap-btc\n" +
		"private key             : d80a2bad87a40060f11f195ee544e49a0af485ba34f95746649c1756c5fbe7bf\n" +
		"wif compressed          : L4TfTZJdig2iFQPBHr5wHUBpYVvdiiZriTJVsV5s1KrFwnCnRdga\n" +
		"wif uncompressed        : 5KTS2VAS5uo9tkMtGbgdmWiseVksTfsVUyFqgXqE9ELKLkiYymc\n" +
		"public key compressed   : 1AZf1GGj8ajSbV56eRwB34Zi5eZQ2QfFap\n" +
		"public key uncompressed : 14zrXrHhYWGxf97KS4tKJKXdNTVa4soUSV\n";

	const minimum_FullOutputKey = 
		"identity                : OPENSIG-1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH-btc\n" +
		"private key             : 0000000000000000000000000000000000000000000000000000000000000001\n" +
		"wif compressed          : KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn\n" +
		"wif uncompressed        : 5HpHagT65TZzG1PH3CSu63k8DbpvD8s5ip4nEB3kEsreAnchuDf\n" +
		"public key compressed   : 1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH\n" +
		"public key uncompressed : 1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm\n";

	const maximum_FullOutputKey = 
		"identity                : OPENSIG-1GrLCmVQXoyJXaPJQdqssNqwxvha1eUo2E-btc\n" +
		"private key             : fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140\n" +
		"wif compressed          : L5oLkpV3aqBjhki6LmvChTCV6odsp4SXM6FfU2Gppt5kFLaHLuZ9\n" +
		"wif uncompressed        : 5Km2kuu7vtFDPpxywn4u3NLpbr5jKpTB3jsuDU2KYEqetqj84qw\n" +
		"public key compressed   : 1GrLCmVQXoyJXaPJQdqssNqwxvha1eUo2E\n" +
		"public key uncompressed : 1JPbzbsAx1HyaDQoLMapWGoqf9pD5uha5m\n";

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
	

	describe("works within valid ECDSA range (secp256k1)", function() {


		afterEach(function(){
			opensig.testPoint(undefined);
		});
		
		
		it("success for the minimum private key", function() {
			
			return opensig.getKey("0000000000000000000000000000000000000000000000000000000000000001")
				.then( function checkResults( key ){
					checkKey(key, undefined);
					expect( key.toString("<full>") ).to.equal("label                   : undefined\n" + minimum_FullOutputKey );
				} );

		});


		it("success for the maximum private key", function() {
			
			return opensig.getKey("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140")
				.then( function checkResults( key ){
					checkKey(key, undefined);
					expect( key.toString("<full>") ).to.equal("label                   : undefined\n" + maximum_FullOutputKey );
				} );

		});


		it("fails if private key is min-1", function() {
			
			return expect( opensig.getKey('0000000000000000000000000000000000000000000000000000000000000000') )
			          .to.eventually.be.rejectedWith("argument '0000000000000000000000000000000000000000000000000000000000000000' is not a private key, readable file or wif");

		});


		it("fails if private key is max+1", function() {
			
			return expect( opensig.getKey('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141') )
			          .to.eventually.be.rejectedWith("argument 'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141' is not a private key, readable file or wif");

		});


		it("success when file's hash is not ECDSA compliant", function() {
			
			opensig.testPoint( { nonEcdsaKeyCount: 1 } );
			
			return opensig.getKey("test/test_files/hello_world.txt")
				.then( function checkResults( key ){
					checkKey(key, "test/test_files/hello_world.txt");
					expect( key.toString("<full>") ).to.equal(helloWorld_plus1zero_FullOutputKey);
				} );
		});


		it("success when file's hash and one added zero is not ECDSA compliant", function() {
			
			opensig.testPoint( { nonEcdsaKeyCount: 2 } );
			
			return opensig.getKey("test/test_files/hello_world.txt")
				.then( function checkResults( key ){
					checkKey(key, "test/test_files/hello_world.txt");
					expect( key.toString("<full>") ).to.equal(helloWorld_plus2zeros_FullOutputKey);
				} );
		});


		it("fails when file's hash and two added zeros is still not ECDSA compliant", function() {
			
			opensig.testPoint( { nonEcdsaKeyCount: 3 } );
			
			return expect( opensig.getKey("test/test_files/hello_world.txt") )
			          .to.eventually.be.rejectedWith("Failed to generate a valid ECDSA key after 3 attempts");
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
