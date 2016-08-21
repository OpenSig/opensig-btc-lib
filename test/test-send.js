const chai = require('chai');  chai.use( require('chai-as-promised') );
const fs = require('fs');
const opensig = require("../src/opensig");

const expect = chai.expect;

describe("SEND Feature:", function() {

	// the SEND feature is tested almost complete by the sign feature tests

	describe("Invalid arguments:", function() {

		var wif1 = "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a";


		it("calling send with no argument results in an error", function() {
			expect( function(){ opensig.send() } ).to.throw(OpenSigError, "from argument is missing");
		});


		it("calling send with an empty argument results in an error", function() {
			expect( function(){ opensig.send("") } ).to.throw(OpenSigError, "from argument is missing");
		});


		it("calling send with no to argument results in an error", function() {
			expect( function(){ opensig.send( wif1 ) } ).to.throw(OpenSigError, "to argument is missing");
		});


		it("calling send with no amount argument results in an error", function() {
			expect( function(){ opensig.send( wif1, wif1 ) } ).to.throw(OpenSigError, "amount argument is missing");
		});


		it("calling send with invalid from argument results in an error", function() {
			expect( opensig.send( "nonsense", wif1, 100 ) ).to.eventually.throw(OpenSigError, "argument 'nonsense' is not a private key, readable file or wif");
		});


		it("calling send with invalid to argument results in an error", function() {
			expect( opensig.send( wif1, "nonsense", 100 ) ).to.eventually.throw(OpenSigError, "argument 'nonsense' is not a public key, private key, readable file or wif");
		});


		it("calling send with invalid OpenSig id in its to argument results in an error", function() {
			expect( opensig.send( wif1, "OPENS-13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14-btc", 100 ) ).to.eventually.throw(OpenSigError, "argument 'OPENS-13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14-btc' is not a public key, private key, readable file or wif");
		});


		it("calling send with an invalid amount argument results in an error", function() {
			expect( function(){ opensig.send( wif1, wif1, "nonsense" ) } ).to.throw(OpenSigError, "invalid payment amount 'nonsense'");
		});


		it("calling send with a negative payment amount results in an error", function() {
			expect( function(){ opensig.send(wif1, wif1, -1) } ).to.throw(OpenSigError, "invalid payment amount '-1'");
		});


		it("calling send with a zero payment amount results in an error", function() {
			expect( function(){ opensig.send(wif1, wif1, 0) } ).to.throw(OpenSigError, "invalid payment amount '0'");
		});


		it("calling send with a negative fee results in an error", function() {
			expect( function(){ opensig.send(wif1, wif1, 100, -1) } ).to.throw(OpenSigError, "invalid fee '-1'");
		});


	});



	it("use the pay 'all' feature, should use all utxos with one 1490000 output and no change", function() {

		var parameters = {
			to: "test/test_files/hello_world.txt",
			from: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
			publish: false,
			amount: "all",
			fee: undefined };
			
		var apiTestData_call1 = {
			expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
			testType:    "response",
			file:        "test/test_files/blockchain.info/utxo_response-multiple_outputs.json" };

		var expectedResponse = {
			from: { address: "1M9jofAErijG4eiPUy19Qxot1KkPRRzyet", label: undefined },
			to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
			input:    1500000,
			payment:  1490000,
			fee:      10000,
			change:   0,
			response: 'Not Published', 
			txnID:    'd984471d35bc97804ba6bed6e10f040a724425d7f97662e6e6bcbbac16b51ac4', 
			txnHex:   '010000000509882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c181b010000006a47304402201870f86f4c6b710efd4d033e6a14b5002426b43965077333d56b214914d5c340022005baa9d5586dd81345d1f2ae3fd6f0d6166dbb9fd998c423a3c906eb0bc8c4be012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30000000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c581b050000006a473044022075273dc36d131f051c9324feab8a26af32bdd18916005a5e0a08fbe977deff0502205407eec8088aeed79d4c3346920ffe67e1338fa181f5f8810eb43e3f545365e9012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30100000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c281b020000006a473044022045cee1709e0362bea7b6e7b60e7e43422c2fba0842c48efbddb3a2d01b5be302022039780f1e9fe6505151bea4c79954660e98a31a1f7351beb57b3c4652c2f20239012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30200000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c481b040000006b483045022100e31acb8a9db4e2f0634c9c22c60953585185a7e8edc106b01172eca174e635b5022015446f5a285766b609e73daff14e1bf406a4e127b46cc91e58272c06840a1a42012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30300000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c381b030000006b483045022100c9ef2ecac0c8c9a69e37e2f3863b4f654076588d301184d1d2dc10ea54ad3e95022037f3f84e233286d34cbe569eeae8ecfaf609b5a3cd42929ced9926776c624c9b012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3040000000150bc1600000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac00000000' };

		return callUUT( parameters, [ apiTestData_call1 ], "resolve", expectedResponse );

	});


	it("should accept an OpenSig id in its 'to' parameter", function() {

		var parameters = {
			to: "OPENSIG-13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14-btc",
			from: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
			publish: false,
			amount: "all",
			fee: undefined };
			
		var apiTestData_call1 = {
			expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
			testType:    "response",
			file:        "test/test_files/blockchain.info/utxo_response-multiple_outputs.json" };

		var expectedResponse = {
			from: { address: "1M9jofAErijG4eiPUy19Qxot1KkPRRzyet", label: undefined },
			to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "OPENSIG-13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14-btc" },
			input:    1500000,
			payment:  1490000,
			fee:      10000,
			change:   0,
			response: 'Not Published', 
			txnID:    'd984471d35bc97804ba6bed6e10f040a724425d7f97662e6e6bcbbac16b51ac4', 
			txnHex:   '010000000509882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c181b010000006a47304402201870f86f4c6b710efd4d033e6a14b5002426b43965077333d56b214914d5c340022005baa9d5586dd81345d1f2ae3fd6f0d6166dbb9fd998c423a3c906eb0bc8c4be012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30000000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c581b050000006a473044022075273dc36d131f051c9324feab8a26af32bdd18916005a5e0a08fbe977deff0502205407eec8088aeed79d4c3346920ffe67e1338fa181f5f8810eb43e3f545365e9012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30100000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c281b020000006a473044022045cee1709e0362bea7b6e7b60e7e43422c2fba0842c48efbddb3a2d01b5be302022039780f1e9fe6505151bea4c79954660e98a31a1f7351beb57b3c4652c2f20239012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30200000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c481b040000006b483045022100e31acb8a9db4e2f0634c9c22c60953585185a7e8edc106b01172eca174e635b5022015446f5a285766b609e73daff14e1bf406a4e127b46cc91e58272c06840a1a42012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30300000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c381b030000006b483045022100c9ef2ecac0c8c9a69e37e2f3863b4f654076588d301184d1d2dc10ea54ad3e95022037f3f84e233286d34cbe569eeae8ecfaf609b5a3cd42929ced9926776c624c9b012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3040000000150bc1600000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac00000000' };

		return callUUT( parameters, [ apiTestData_call1 ], "resolve", expectedResponse );

	});


});


function callUUT( parameters, apiCalls, resolveOrError, expectedResponse ){

	opensig.blockchainAPI.setTestMode(true);

	for( var i=0; i<apiCalls.length; i++ ){
		fs.writeFileSync( "testURLResponse"+(i+1), JSON.stringify(apiCalls[i]) );		
	}

	if( resolveOrError == "resolve" ){

		return opensig.send(parameters.from, parameters.to, parameters.amount, parameters.fee, parameters.publish )
			.then( function(response){
				expect(response).to.deep.equal( expectedResponse );
				for( var i=0; i<apiCalls.length; i++ ){
					fs.unlinkSync( "testURLResponse"+(i+1) );		
				}
			} );
	}

	else if( resolveOrError == "reject" ){

		return opensig.send(parameters.from, parameters.to, parameters.amount, parameters.fee, parameters.publish )
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
