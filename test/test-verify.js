const chai = require('chai');  chai.use( require('chai-as-promised') );
const fs = require('fs');
const opensig = require("../src/opensig");
const KeyPair = require("../src/types/keyPair");

const expect = chai.expect;

const Signature = require("../src/types/signature");
const assert = require('assert');


describe("VERIFY Feature:", function() {


	describe("Invalid arguments:", function() {


		it("calling verify with no argument results in an error", function() {
			expect( function(){ opensig.verify() } ).to.throw(OpenSigError, "file argument is missing");
		});


		it("calling verify with an empty argument results in an error", function() {
			expect( function(){ opensig.verify("") } ).to.throw(OpenSigError, "file argument is missing");
		});


		it("calling verify with a non-existent file results in an error", function() {
			return expect( opensig.verify("non-existent-file") ).to.eventually.be.rejectedWith("argument 'non-existent-file' is not a private key, readable file or wif");
		});

	});



	describe("Verify files:", function() {


		it("calling verify with an unsigned file outputs an empty array and no error", function() {

			var apiTestData = {
				expectedURL: "https://blockchain.info/address/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14?format=json",
				testType:    "response",
				file:        "test/test_files/blockchain.info/hello_world-tx_response-no_transactions.json" };
				
			return callUUT( "test/test_files/hello_world.txt", [ apiTestData ], "resolve", [] );
		});


		it("calling verify for hello_world.txt returns my signature", function() {

			var apiTestData = {
				expectedURL: "https://blockchain.info/address/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14?format=json",
				testType:    "response",
				file:        "test/test_files/blockchain.info/hello_world-tx_response-signed_by_me.json" };
			
			var signature1 = new Signature();
			signature1.time  = new Date(1459171868*1000);
			signature1.key   = "121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3";
			signature1.label = "";
			
			var signature2 = new Signature();
			signature2.time  = new Date(1459091439*1000);
			signature2.key   = "121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3";
			signature2.label = "";
			
			return callUUT( "test/test_files/hello_world.txt", [ apiTestData ], "resolve", [ signature1, signature2 ] );

		});


	});
	

	describe("Verify using a wif or private key:", function() {


		it("calling verify with hello_world.txt's wif returns my signature", function() {

			var apiTestData = {
				expectedURL: "https://blockchain.info/address/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14?format=json",
				testType:    "response",
				file:        "test/test_files/blockchain.info/hello_world-tx_response-signed_by_me.json" };
			
			var signature1 = new Signature();
			signature1.time  = new Date(1459171868*1000);
			signature1.key   = "121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3";
			signature1.label = "";
			
			var signature2 = new Signature();
			signature2.time  = new Date(1459091439*1000);
			signature2.key   = "121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3";
			signature2.label = "";
			
			return callUUT( "L4HCdx7tRz8F1azW9xUACNP2G4gnDoSdLZfJQm8MVEx9WEKwePct", [ apiTestData ], "resolve", [ signature1, signature2 ] );

		});


		it("calling verify with hello_world.txt's uncompressed wif returns my signature", function() {

			var apiTestData = {
				expectedURL: "https://blockchain.info/address/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14?format=json",
				testType:    "response",
				file:        "test/test_files/blockchain.info/hello_world-tx_response-signed_by_me.json" };
			
			var signature1 = new Signature();
			signature1.time  = new Date(1459171868*1000);
			signature1.key   = "121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3";
			signature1.label = "";
			
			var signature2 = new Signature();
			signature2.time  = new Date(1459091439*1000);
			signature2.key   = "121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3";
			signature2.label = "";
			
			return callUUT( "5KR4YUtriTY6SWTAn5QprFMrDvrLm8ob4XWXE61m4gQphACdYyz", [ apiTestData ], "resolve", [ signature1, signature2 ] );

		});


		it("calling verify with hello_world.txt's private key returns my signature", function() {

			var apiTestData = {
				expectedURL: "https://blockchain.info/address/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14?format=json",
				testType:    "response",
				file:        "test/test_files/blockchain.info/hello_world-tx_response-signed_by_me.json" };
			
			var signature1 = new Signature();
			signature1.time  = new Date(1459171868*1000);
			signature1.key   = "121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3";
			signature1.label = "";
			
			var signature2 = new Signature();
			signature2.time  = new Date(1459091439*1000);
			signature2.key   = "121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3";
			signature2.label = "";
			
			return callUUT( "d2a84f4b8b650937ec8f73cd8be2c74add5a911ba64df27458ed8229da804a26", [ apiTestData ], "resolve", [ signature1, signature2 ] );

		});


		it("calling verify with hello_world.txt's KeyPair returns my signature", function() {

			var key = new KeyPair("", "L4HCdx7tRz8F1azW9xUACNP2G4gnDoSdLZfJQm8MVEx9WEKwePct");
			
			var apiTestData = {
				expectedURL: "https://blockchain.info/address/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14?format=json",
				testType:    "response",
				file:        "test/test_files/blockchain.info/hello_world-tx_response-signed_by_me.json" };
			
			var signature1 = new Signature();
			signature1.time  = new Date(1459171868*1000);
			signature1.key   = "121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3";
			signature1.label = "";
			
			var signature2 = new Signature();
			signature2.time  = new Date(1459091439*1000);
			signature2.key   = "121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3";
			signature2.label = "";
			
			return callUUT( key, [ apiTestData ], "resolve", [ signature1, signature2 ] );

		});


	});
	

	describe("Invalid blockchain responses:", function() {

		it("error is handled cleanly when blockchain web api returns nonsense", function() {

			var apiTestData = {
				expectedURL: "https://blockchain.info/address/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14?format=json",
				testType:    "response",
				data:        "arfle barfle gloop" };
				
			var expectedError = {
				name:    'OpenSigError',
				code:    500,
				message: 'blockchain.info response was invalid',
				details: "arfle barfle gloop\nSyntaxError: Unexpected token a" };

			return callUUT( "test/test_files/hello_world.txt", [ apiTestData ], "reject", expectedError );

		});


		it("error is handled cleanly when request returns an unknown StatusCodeError 500", function() {

			var requestError = {
				  name: 'StatusCodeError',
				  message: 'Error: getaddrinfo ENOTFOUND blockchain.info blockchain.info:443',
				  statusCode: 500,
				  error: "my unknown error message" };
				  
			var apiTestData = {
				expectedURL: "https://blockchain.info/address/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14?format=json",
				testType:    "synchronousError",
				data:        JSON.stringify(requestError) };
				
			var expectedError = {
				name:    'OpenSigError',
				code:    500,
				message: 'my unknown error message',
				details: { url: "https://blockchain.info/address/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14?format=json",
				           error: requestError }
				};

			return callUUT( "test/test_files/hello_world.txt", [ apiTestData ], "reject", expectedError );

		});


	});


	describe("Signature formatting:", function() {


		it("signature toString can accept multiple formats", function() {

			var signature = new Signature();
			signature.time  = new Date(1459171868*1000);
			signature.key   = "121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3";
			signature.label = "My Label";
			
			expect( signature.toString() ).to.equal("Mon, 28 Mar 2016 13:31:08 GMT	121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3	My Label");
			expect( signature.toString( "public key: <pub>, label: <label>, $%^&@: <longtime>, time: <time>   <pub>") )
				.to.equal("public key: 121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3, label: My Label, $%^&@: Mon, 28 Mar 2016 13:31:08 GMT, time: 1459171868   121GfwxgvdEUck7Xb4d5wbMnf7Xm2b4zw3");
		});


	});
	
	
});


function callUUT( file, apiCalls, resolveOrError, expectedResponse ){

	opensig.blockchainAPI.setTestMode(true);

	for( var i=0; i<apiCalls.length; i++ ){
		fs.writeFileSync( "testURLResponse"+(i+1), JSON.stringify(apiCalls[i]) );		
	}

	if( resolveOrError == "resolve" ){

		return opensig.verify(file)
			.then( function(response){
				expect( JSON.stringify(response) ).to.equal( JSON.stringify(expectedResponse) );
			} );
	}

	else if( resolveOrError == "reject" ){

		return opensig.verify(file)
			.then( function inCaseItResolves(x){ console.log(x); } )
			.catch( function(reject){
				expect(reject).to.deep.equal( expectedResponse );
				for( var i=0; i<apiCalls.length; i++ ){
					fs.unlinkSync( "testURLResponse"+(i+1) );	
				}
			} );
	}

	else throw "Test script error: invalid resolveOrError parameter to uut";
}

