const chai = require('chai');  chai.use( require('chai-as-promised') );
const fs = require('fs');
const opensig = require("../src/opensig");
const KeyPair = require("../src/types/keyPair");

const expect = chai.expect;


describe("BALANCE Features:", function() {


	it("get balance with invalid parameter", function() {
	
		var expectedError = {
			name:    'OpenSigError',
			code:    200,
			message: 'argument is not a public key, private key, readable file or wif',
			details: "nonsense" };

		return callUUT( "nonsense", [ ], "reject", expectedError );
	});


	it("get balance with WIF", function() {

		var apiTestData_call1 = {
			expectedURL: "https://blockchain.info/q/addressbalance/19YYzmYa8ggFJbkUWgChfr9C6devpMFd1z",
			testType:    "response",
			data:        "3" };

		return callUUT( "L5BcG9U6Y2maUVKUt5dJyA8Pj9uo574f7sLepsKsqXY6eVQLB7Jz", [ apiTestData_call1 ], "resolve", "3" );

	});


	it("get balance with private key", function() {

		var apiTestData_call1 = {
			expectedURL: "https://blockchain.info/q/addressbalance/19YYzmYa8ggFJbkUWgChfr9C6devpMFd1z",
			testType:    "response",
			data:        "4" };

		return callUUT( "ed9e25e52ea2200039f0c2627506b98283e541d79f4c55bb737c616ef775c85b", [ apiTestData_call1 ], "resolve", "4" );

	});


	it("get balance with public key", function() {

		var apiTestData_call1 = {
			expectedURL: "https://blockchain.info/q/addressbalance/19YYzmYa8ggFJbkUWgChfr9C6devpMFd1z",
			testType:    "response",
			data:        "5" };

		return callUUT( "19YYzmYa8ggFJbkUWgChfr9C6devpMFd1z", [ apiTestData_call1 ], "resolve", "5" );

	});


	it("get balance with uncompressed public key", function() {

		var apiTestData_call1 = {
			expectedURL: "https://blockchain.info/q/addressbalance/1PrBLzaLaGgEW6bdRXJSjiygq5h7ELrHcM",
			testType:    "response",
			data:        "123456789123456789" };

		return callUUT( "1PrBLzaLaGgEW6bdRXJSjiygq5h7ELrHcM", [ apiTestData_call1 ], "resolve", "123456789123456789" );

	});


	it("get balance with file", function() {

		var apiTestData_call1 = {
			expectedURL: "https://blockchain.info/q/addressbalance/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14",
			testType:    "response",
			data:        "2100000000000000" };

		return callUUT( "test/test_files/hello_world.txt", [ apiTestData_call1 ], "resolve", "2100000000000000" );

	});


	it("get balance with KeyPair", function() {
		
		var key = new KeyPair( "", "L4HCdx7tRz8F1azW9xUACNP2G4gnDoSdLZfJQm8MVEx9WEKwePct" );
		
		var apiTestData_call1 = {
			expectedURL: "https://blockchain.info/q/addressbalance/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14",
			testType:    "response",
			data:        "2100000000000000" };

		return callUUT( key, [ apiTestData_call1 ], "resolve", "2100000000000000" );

	});


	it("error thrown by request is handled cleanly", function() {

		var apiError = {
			name:    'APIError',
			message: 'invalid url' };

		var apiTestData_call1 = {
			expectedURL: "https://blockchain.info/q/addressbalance/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14",
			testType:    "synchronousError",
			data:        JSON.stringify(apiError) };

		var expectedError = {
			name:    'OpenSigError',
			code:    500,
			message: 'unknown error from blockchain api: APIError',
			details: { url: "https://blockchain.info/q/addressbalance/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14",
			           error: apiError } };

		return callUUT( "test/test_files/hello_world.txt", [ apiTestData_call1 ], "reject", expectedError );

	});


	it("error thrown by blockchain api is handled cleanly", function() {

		var apiError = {
			name:    'APIError',
			message: 'invalid url' };

		var apiTestData_call1 = {
			expectedURL: "https://blockchain.info/q/addressbalance/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14",
			testType:    "asynchronousError",
			data:        JSON.stringify(apiError) };

		var expectedError = {
			name:    'OpenSigError',
			code:    500,
			message: 'unknown error from blockchain api: APIError',
			details: { url: "https://blockchain.info/q/addressbalance/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14",
			           error: apiError } };

		return callUUT( "test/test_files/hello_world.txt", [ apiTestData_call1 ], "reject", expectedError );

	});


	it("unknown request error thrown by blockchain api is handled cleanly", function() {

		var apiError = {
			name:    'RequestError',
			message: 'invalid url',
			cause: { code: "UNKNOWN" } };

		var apiTestData_call1 = {
			expectedURL: "https://blockchain.info/q/addressbalance/13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14",
			testType:    "asynchronousError",
			data:        JSON.stringify(apiError) };

		var expectedError = {
			name:    'OpenSigError',
			code:    500,
			message: 'Blockchain request failed',
			details: apiError };

		return callUUT( "test/test_files/hello_world.txt", [ apiTestData_call1 ], "reject", expectedError );

	});


});


function callUUT( key, apiCalls, resolveOrError, expectedResponse ){

	opensig.blockchainAPI.setTestMode(true);

	for( var i=0; i<apiCalls.length; i++ ){
		fs.writeFileSync( "testURLResponse"+(i+1), JSON.stringify(apiCalls[i]) );		
	}

	if( resolveOrError == "resolve" ){

		return opensig.balance(key)
			.then( function(response){
				expect(response).to.deep.equal( expectedResponse );
				for( var i=0; i<apiCalls.length; i++ ){
					fs.unlinkSync( "testURLResponse"+(i+1) );		
				}
			} );
	}

	else if( resolveOrError == "reject" ){

		return opensig.balance(key)
			.then( function inCaseItResolves(x){ console.log(x); } )
			.catch( function(reject){
				expect(JSON.stringify(reject)).to.equal( JSON.stringify(expectedResponse) );
				for( var i=0; i<apiCalls.length; i++ ){
					fs.unlinkSync( "testURLResponse"+(i+1) );	
				}
			} );
	}

	else throw "Test script error: invalid resolveOrError parameter to uut";
}
