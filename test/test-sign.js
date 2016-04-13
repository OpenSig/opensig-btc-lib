const chai = require('chai');  chai.use( require('chai-as-promised') );
const fs = require('fs');
const opensig = require("../src/opensig");
const KeyPair = require("../src/types/keyPair");

const expect = chai.expect;

describe("SIGN Feature:", function() {


	describe("Invalid arguments:", function() {


		var wif1 = "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a";


		it("calling sign with no argument results in an error", function() {
			expect( function(){ opensig.sign() } ).to.throw(OpenSigError, "file argument is missing");
		});


		it("calling sign with an empty argument results in an error", function() {
			expect( function(){ opensig.sign("") } ).to.throw(OpenSigError, "file argument is missing");
		});


		it("calling sign with no key argument results in an error", function() {
			expect( function(){ opensig.sign( "test/test_files/hello_world.txt" ) } ).to.throw(OpenSigError, "key argument is missing");
		});


		it("calling sign with an empty key argument results in an error", function() {
			expect( function(){ opensig.sign( "test/test_files/hello_world.txt", "") } ).to.throw(OpenSigError, "key argument is missing");
		});


		it("calling sign with a non-existent file results in an error", function() {
			return expect( opensig.sign("non-existent-file", "test/test_files/hello_world.txt") ).to.eventually.be.rejectedWith("argument 'non-existent-file' is not a public key, private key, readable file or wif");
		});


		it("calling sign with an invalid key results in an error", function() {
			return expect( opensig.sign("non-existent-file", "nonsense") ).to.eventually.be.rejectedWith("argument 'nonsense' is not a private key, readable file or wif");
		});


		it("calling sign with a negative payment amount results in an error", function() {
			expect( function(){ opensig.sign("test/test_files/hello_world.txt", wif1, false, -1, 100) } ).to.throw(OpenSigError, "invalid payment amount '-1'");
		});


		it("calling sign with a zero payment amount results in an error", function() {
			expect( function(){ opensig.sign("test/test_files/hello_world.txt", wif1, false, 0, 100) } ).to.throw(OpenSigError, "invalid payment amount '0'");
		});


		it("calling sign with a negative fee results in an error", function() {
			expect( function(){ opensig.sign("test/test_files/hello_world.txt", wif1, false, 1, -1) } ).to.throw(OpenSigError, "invalid fee '-1'");
		});


	});



	describe("Valid signatures:", function() {

		it("sign file with no funds should reject with an error", function() {
		
			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: false,
				paymentIn: undefined,
				feeIn: undefined };
				
			var apiError = { 
				"name": "StatusCodeError",
				"statusCode": 500,
				"message": "500 - No free outputs to spend",
  				"error": "No free outputs to spend" };
  				
			var apiTestData = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "asynchronousError",
				data:        JSON.stringify(apiError) };
				
			var expectedError = {
				name:    'OpenSigError',
				code:    600,
				message: 'insufficient funds',
				details: undefined };

			return callUUT( parameters, [ apiTestData ], "reject", expectedError );
		});


		it("sign file without publishing should resolve the transaction", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: false,
				paymentIn: undefined,
				feeIn: undefined };
				
			var apiTestData = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var expectedResponse = {
				from: { address: "1M9jofAErijG4eiPUy19Qxot1KkPRRzyet", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    74570,
				payment:  5430,
				fee:      10000,
				change:   59140,
				response: 'Not Published',
				txnID:    'b20d6599f5ba38780437df1618e4c18c77ab4af8c7390d7bd1fcd9aaa826d4c6', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006a473044022031f9e571cdd69f031f708ba53f7a46973812ae2baaf00b39400dcc94ed1b317802205da9f847380ebbbcd402c4229694d64ba81f96808e8cde82c2e0a7f554dca839012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3000000000236150000000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac04e70000000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000' };

			return callUUT( parameters, [ apiTestData ], "resolve", expectedResponse );
		});


		it("sign file with publishing should resolve the transaction and pass on the status rxd from the blockchain api", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: true,
				paymentIn: undefined,
				feeIn: undefined };
				
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var apiTestData_call2 = {
				expectedURL: JSON.stringify({ method: "POST", 
							   url: "https://blockchain.info/pushtx", 
							   form:{ tx: "010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006a473044022031f9e571cdd69f031f708ba53f7a46973812ae2baaf00b39400dcc94ed1b317802205da9f847380ebbbcd402c4229694d64ba81f96808e8cde82c2e0a7f554dca839012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3000000000236150000000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac04e70000000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000"}}),
				testType:    "response",
				data:        "My status response" };

			var expectedResponse = {
				from: { address: "1M9jofAErijG4eiPUy19Qxot1KkPRRzyet", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    74570,
				payment:  5430,
				fee:      10000,
				change:   59140,
				response: 'My status response', 
				txnID:    'b20d6599f5ba38780437df1618e4c18c77ab4af8c7390d7bd1fcd9aaa826d4c6', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006a473044022031f9e571cdd69f031f708ba53f7a46973812ae2baaf00b39400dcc94ed1b317802205da9f847380ebbbcd402c4229694d64ba81f96808e8cde82c2e0a7f554dca839012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3000000000236150000000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac04e70000000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000' };

			return callUUT( parameters, [ apiTestData_call1, apiTestData_call2 ], "resolve", expectedResponse );

		});


		it("sign different file with publishing should resolve the transaction and pass on the status rxd from the blockchain api", function() {

			var parameters = {
				file: "test/test_files/the_great_gig_in_the_sky.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: true,
				paymentIn: undefined,
				feeIn: undefined };
				
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var apiTestData_call2 = {
				expectedURL: JSON.stringify({ method: "POST", 
							   url: "https://blockchain.info/pushtx", 
							   form:{ tx: "010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100b224e97c0b99b556474be728bddc04da2c0d4226627bbfdac792ee617c3c1b990220524511457c3dd7e995aabc35af5e2637e7a371b4429cf05df9cc7abc818ea602012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3000000000236150000000000001976a914df68e381dee7029d47dad0b5942906f3c162fb0588ac04e70000000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000"}}),
				testType:    "response",
				data:        "My other status response" };

			var expectedResponse = {
				from: { address: "1M9jofAErijG4eiPUy19Qxot1KkPRRzyet", label: undefined },
				to:   { address: "1MNHLaE5NZ1PwA7iyu9jyZ5vqayfQFE669", label: "test/test_files/the_great_gig_in_the_sky.txt" },
				input:    74570,
				payment:  5430,
				fee:      10000,
				change:   59140,
				response: 'My other status response', 
				txnID:    '94b1c7ebacbe21b62a58a1f07601c5a25bdfc92225d1c58589473ec2ade6a968', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100b224e97c0b99b556474be728bddc04da2c0d4226627bbfdac792ee617c3c1b990220524511457c3dd7e995aabc35af5e2637e7a371b4429cf05df9cc7abc818ea602012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3000000000236150000000000001976a914df68e381dee7029d47dad0b5942906f3c162fb0588ac04e70000000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000' };

			return callUUT( parameters, [ apiTestData_call1, apiTestData_call2 ], "resolve", expectedResponse );

		});


	});
	
	
	describe("Signing with different keys:", function() {

		it("sign file with other wif should resolve the same transaction", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L3ZugXLgbaWpq1hgeRCWKBrAsNYK2Y7Pq64HciUP7K2nVJhGvr2u",
				publish: false,
				paymentIn: undefined,
				feeIn: undefined };

			var apiTestData = {
				expectedURL: "https://blockchain.info/unspent?active=15J4SyQ9yCGetJ8uUyUoqjULASspzJMgAa",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var expectedResponse = {
				from: { address: "15J4SyQ9yCGetJ8uUyUoqjULASspzJMgAa", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    74570,
				payment:  5430,
				fee:      10000,
				change:   59140,
				response: 'Not Published', 
				txnID:    '7bbc8418047484c62a470b8c9684af45346db3eaad787c1f50fca73de2ada5ae', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100ddabf63ce014c4ba2097ff770f382425016ca55a7b594bfdedb64bbf918cf3a40220452fe8632893408a57bfc84d4208d1cfd7a09da3a7d94183c48d9448c9cf15a7012102c2b7480e50454bbe03a28780cbceafa7358414f95e69496c2f48e5363f13399c000000000236150000000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac04e70000000000001976a9142f1a73db3c8b1757f6e989132c641e30f2e0f19a88ac00000000' };

			return callUUT( parameters, [ apiTestData ], "resolve", expectedResponse );
		});


		it("sign file with public key should fail", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55",
				publish: false,
				paymentIn: undefined,
				feeIn: undefined };

			var expectedError = {
				name:    "OpenSigError",
				code:    200,
				message: 'argument \'1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55\' is not a private key, readable file or wif',
				details: "1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55"
  				};

			return callUUT( parameters, [ ], "reject", expectedError );
		});


		it("sign file with another wif should resolve a transaction", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "KyqQvMgADbygFyPzYVLWDcBLYiUHYrwYRphhvBDCCtnYpuEyECab",
				publish: false,
				paymentIn: undefined,
				feeIn: undefined };

			var apiTestData = {
				expectedURL: "https://blockchain.info/unspent?active=1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var expectedResponse = {
				from: { address: "1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    74570,
				payment:  5430,
				fee:      10000,
				change:   59140,
				response: 'Not Published', 
				txnID:    '059df7cf5ced6553d00cd06f2111dc029d4d34ba990fa46e9c55dfbe3e4cf8c8', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100d0720780ee29a4692f3a83275f93d5c32763b452f7a90876751899b318b2dacc02205120218e0a04c64c54e709a2db75ce20bdb7bea960a66cae872e48cec8387d8b0121023689c27fa5f14391451133bfbdafecaf67405f77b98d4f3eff821d45eba8bf98000000000236150000000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac04e70000000000001976a914c7976e0824d18e9e59dbc583216f5b18e2f8f4e188ac00000000' };

			return callUUT( parameters, [ apiTestData ], "resolve", expectedResponse );
		});


		it("sign file with an uncompressed wif corresponding to previous wif should resolve the same transaction", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "5JQf3aEQPLhwD16D8b4WjH8KvriymNjiZMn27cPhbsFQ54ryEij",
				publish: false,
				paymentIn: undefined,
				feeIn: undefined };

			var apiTestData = {
				expectedURL: "https://blockchain.info/unspent?active=1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var expectedResponse = {
				from: { address: "1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    74570,
				payment:  5430,
				fee:      10000,
				change:   59140,
				response: 'Not Published', 
				txnID:    '059df7cf5ced6553d00cd06f2111dc029d4d34ba990fa46e9c55dfbe3e4cf8c8', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100d0720780ee29a4692f3a83275f93d5c32763b452f7a90876751899b318b2dacc02205120218e0a04c64c54e709a2db75ce20bdb7bea960a66cae872e48cec8387d8b0121023689c27fa5f14391451133bfbdafecaf67405f77b98d4f3eff821d45eba8bf98000000000236150000000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac04e70000000000001976a914c7976e0824d18e9e59dbc583216f5b18e2f8f4e188ac00000000' };

			return callUUT( parameters, [ apiTestData ], "resolve", expectedResponse );
		});


		it("sign file with a private key corresponding to previous wif should resolve the same transaction", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "4e0a9b5de52d630a716f199812342cfc8be7308b7111c6df9e55d4a903d6d7d0",
				publish: false,
				paymentIn: undefined,
				feeIn: undefined };

			var apiTestData = {
				expectedURL: "https://blockchain.info/unspent?active=1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var expectedResponse = {
				from: { address: "1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    74570,
				payment:  5430,
				fee:      10000,
				change:   59140,
				response: 'Not Published', 
				txnID:    '059df7cf5ced6553d00cd06f2111dc029d4d34ba990fa46e9c55dfbe3e4cf8c8', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100d0720780ee29a4692f3a83275f93d5c32763b452f7a90876751899b318b2dacc02205120218e0a04c64c54e709a2db75ce20bdb7bea960a66cae872e48cec8387d8b0121023689c27fa5f14391451133bfbdafecaf67405f77b98d4f3eff821d45eba8bf98000000000236150000000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac04e70000000000001976a914c7976e0824d18e9e59dbc583216f5b18e2f8f4e188ac00000000' };

			return callUUT( parameters, [ apiTestData ], "resolve", expectedResponse );
		});


		it("sign file with a KeyPair object corresponding to previous wif should resolve the same transaction", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: new KeyPair("my key", "4e0a9b5de52d630a716f199812342cfc8be7308b7111c6df9e55d4a903d6d7d0"),
				publish: false,
				paymentIn: undefined,
				feeIn: undefined };

			var apiTestData = {
				expectedURL: "https://blockchain.info/unspent?active=1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var expectedResponse = {
				from: { address: "1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55", label: "my key" },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    74570,
				payment:  5430,
				fee:      10000,
				change:   59140,
				response: 'Not Published', 
				txnID:    '059df7cf5ced6553d00cd06f2111dc029d4d34ba990fa46e9c55dfbe3e4cf8c8', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100d0720780ee29a4692f3a83275f93d5c32763b452f7a90876751899b318b2dacc02205120218e0a04c64c54e709a2db75ce20bdb7bea960a66cae872e48cec8387d8b0121023689c27fa5f14391451133bfbdafecaf67405f77b98d4f3eff821d45eba8bf98000000000236150000000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac04e70000000000001976a914c7976e0824d18e9e59dbc583216f5b18e2f8f4e188ac00000000' };

			return callUUT( parameters, [ apiTestData ], "resolve", expectedResponse );
		});


		it("sign a KeyPair object with a KeyPair object corresponding to previous wifs should resolve the same transaction", function() {

			var parameters = {
				file: new KeyPair("my file", "L4HCdx7tRz8F1azW9xUACNP2G4gnDoSdLZfJQm8MVEx9WEKwePct"),
				key: new KeyPair("my key", "4e0a9b5de52d630a716f199812342cfc8be7308b7111c6df9e55d4a903d6d7d0"),
				publish: false,
				paymentIn: undefined,
				feeIn: undefined };

			var apiTestData = {
				expectedURL: "https://blockchain.info/unspent?active=1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var expectedResponse = {
				from: { address: "1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55", label: "my key" },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "my file" },
				input:    74570,
				payment:  5430,
				fee:      10000,
				change:   59140,
				response: 'Not Published', 
				txnID:    '059df7cf5ced6553d00cd06f2111dc029d4d34ba990fa46e9c55dfbe3e4cf8c8', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100d0720780ee29a4692f3a83275f93d5c32763b452f7a90876751899b318b2dacc02205120218e0a04c64c54e709a2db75ce20bdb7bea960a66cae872e48cec8387d8b0121023689c27fa5f14391451133bfbdafecaf67405f77b98d4f3eff821d45eba8bf98000000000236150000000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac04e70000000000001976a914c7976e0824d18e9e59dbc583216f5b18e2f8f4e188ac00000000' };

			return callUUT( parameters, [ apiTestData ], "resolve", expectedResponse );
		});


		it("sign a public key with a KeyPair object corresponding to previous wifs should resolve the same transaction", function() {

			var parameters = {
				file: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14",
				key: new KeyPair("my key", "4e0a9b5de52d630a716f199812342cfc8be7308b7111c6df9e55d4a903d6d7d0"),
				publish: false,
				paymentIn: undefined,
				feeIn: undefined };

			var apiTestData = {
				expectedURL: "https://blockchain.info/unspent?active=1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var expectedResponse = {
				from: { address: "1KCLshidRL2tmD9zsXmzCSSQpe3vpc2r55", label: "my key" },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: undefined },
				input:    74570,
				payment:  5430,
				fee:      10000,
				change:   59140,
				response: 'Not Published', 
				txnID:    '059df7cf5ced6553d00cd06f2111dc029d4d34ba990fa46e9c55dfbe3e4cf8c8', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100d0720780ee29a4692f3a83275f93d5c32763b452f7a90876751899b318b2dacc02205120218e0a04c64c54e709a2db75ce20bdb7bea960a66cae872e48cec8387d8b0121023689c27fa5f14391451133bfbdafecaf67405f77b98d4f3eff821d45eba8bf98000000000236150000000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac04e70000000000001976a914c7976e0824d18e9e59dbc583216f5b18e2f8f4e188ac00000000' };

			return callUUT( parameters, [ apiTestData ], "resolve", expectedResponse );
		});


		it("sign file with another file should resolve a transaction", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "test/test_files/the_great_gig_in_the_sky.txt",
				publish: false,
				paymentIn: undefined,
				feeIn: undefined };

			var apiTestData = {
				expectedURL: "https://blockchain.info/unspent?active=1MNHLaE5NZ1PwA7iyu9jyZ5vqayfQFE669",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var expectedResponse = {
				from: { address: "1MNHLaE5NZ1PwA7iyu9jyZ5vqayfQFE669", label: "test/test_files/the_great_gig_in_the_sky.txt" },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    74570,
				payment:  5430,
				fee:      10000,
				change:   59140,
				response: 'Not Published', 
				txnID:    'e91e63b3bf1391f848aaa757a717bb11d3e4478a31cabb29280f335257c97e6e', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006a473044022049cf60758f2b37e8ebecc3c35deff01dbb11384f0b80974fae275b433d6a0c0102203378c90c2415151cabbe42af9e626e7e537579080126eca85dd27c8d4de72cc40121035af3a00daaff1bf356adb874fe2c2e94255834300a66a7a0c5aa07c9f84502b7000000000236150000000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac04e70000000000001976a914df68e381dee7029d47dad0b5942906f3c162fb0588ac00000000' };

			return callUUT( parameters, [ apiTestData ], "resolve", expectedResponse );
		});


	});
	

	describe("Invalid blockchain responses:", function() {

		it("error is handled cleanly when blockchain web api returns nonsense when querying for utxos", function() {

			var parameters = {
				file: "test/test_files/the_great_gig_in_the_sky.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: true,
				paymentIn: undefined,
				feeIn: undefined };
				
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				data:        "arfle barfle gloop" };

			var apiTestData_call2 = {
				expectedURL: JSON.stringify({ method: "POST", 
							   url: "https://blockchain.info/pushtx", 
							   form:{ tx: "010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100b224e97c0b99b556474be728bddc04da2c0d4226627bbfdac792ee617c3c1b990220524511457c3dd7e995aabc35af5e2637e7a371b4429cf05df9cc7abc818ea602012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3000000000236150000000000001976a914df68e381dee7029d47dad0b5942906f3c162fb0588ac04e70000000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000"}}),
				testType:    "response",
				data:        "My other status response" };

			var expectedError = {
				name:    'OpenSigError',
				code:    500,
				message: 'blockchain.info response was invalid',
				details: "arfle barfle gloop\nSyntaxError: Unexpected token a" };

			return callUUT( parameters, [ apiTestData_call1, apiTestData_call2 ], "reject", expectedError );

		});


		it("error is handled cleanly when blockchain web api raises error when publishing a transaction", function() {

			var parameters = {
				file: "test/test_files/the_great_gig_in_the_sky.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: true,
				paymentIn: undefined,
				feeIn: undefined };
				
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var apiError = { 
				name: "SomeUnknownError",
				statusCode: 1200,
				message: "1200 - Some unknown error",
  				error: "Some unknown error" };
  				
			var apiTestData_call2 = {
				expectedURL: JSON.stringify({ method: "POST", 
							   url: "https://blockchain.info/pushtx", 
							   form:{ tx: "010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100b224e97c0b99b556474be728bddc04da2c0d4226627bbfdac792ee617c3c1b990220524511457c3dd7e995aabc35af5e2637e7a371b4429cf05df9cc7abc818ea602012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3000000000236150000000000001976a914df68e381dee7029d47dad0b5942906f3c162fb0588ac04e70000000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000"}}),
				testType:    "asynchronousError",
				data:        JSON.stringify(apiError) };
				
			var expectedError = {
				name:    'OpenSigError',
				code:    500,
				message: 'unknown error from blockchain api: SomeUnknownError',
				details: { 
					url: "https://blockchain.info/pushtx body='010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100b224e97c0b99b556474be728bddc04da2c0d4226627bbfdac792ee617c3c1b990220524511457c3dd7e995aabc35af5e2637e7a371b4429cf05df9cc7abc818ea602012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3000000000236150000000000001976a914df68e381dee7029d47dad0b5942906f3c162fb0588ac04e70000000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000'",
					error: apiError } 
				};

			return callUUT( parameters, [ apiTestData_call1, apiTestData_call2 ], "reject", expectedError );

		});


		it("error is handled cleanly when blockchain web api is not reachable", function() {

			var parameters = {
				file: "test/test_files/the_great_gig_in_the_sky.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: true,
				paymentIn: undefined,
				feeIn: undefined };

			var requestError = {
				  name: 'RequestError',
				  message: 'Error: getaddrinfo ENOTFOUND blockchain.info blockchain.info:443',
				  cause: 
				   { code: 'ENOTFOUND',
					 errno: 'ENOTFOUND',
					 syscall: 'getaddrinfo',
					 hostname: 'blockchain.info',
					 host: 'blockchain.info',
					 port: 443 },
				  error: 
				   { code: 'ENOTFOUND',
					 errno: 'ENOTFOUND',
					 syscall: 'getaddrinfo',
					 hostname: 'blockchain.info',
					 host: 'blockchain.info',
					 port: 443 },
				  options: 
				   { uri: 'https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet',
					 callback: undefined,
					 transform: undefined,
					 simple: true,
					 resolveWithFullResponse: false },
				  response: undefined };
							
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "asynchronousError",
				data:        JSON.stringify(requestError) };

			var expectedError = {
				name:    'OpenSigError',
				code:    700,
				message: 'Blockchain not accessible.  Try again later.',
				details: requestError };

			return callUUT( parameters, [ apiTestData_call1 ], "reject", expectedError );

		});


		it("error is handled cleanly when request throws unknown StatusCodeError when retrieving UTXOs", function() {

			var parameters = {
				file: "test/test_files/the_great_gig_in_the_sky.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: true,
				paymentIn: undefined,
				feeIn: undefined };

			var requestError = {
				  name: 'StatusCodeError',
				  message: 'Error: getaddrinfo ENOTFOUND blockchain.info blockchain.info:443',
				  statusCode: "unknown",
				  cause: 
				   { code: 'I Dont Know',
					 errno: 'IDontKnow',
					 syscall: 'getaddrinfo',
					 hostname: 'blockchain.info',
					 host: 'blockchain.info',
					 port: 443 },
				  error: 
				   { code: 'I Dont Know',
					 errno: 'IDontKnow',
					 syscall: 'getaddrinfo',
					 hostname: 'blockchain.info',
					 host: 'blockchain.info',
					 port: 443 },
				  options: 
				   { uri: 'https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet',
					 callback: undefined,
					 transform: undefined,
					 simple: true,
					 resolveWithFullResponse: false },
				  response: undefined };
			
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "synchronousError",
				data:        JSON.stringify(requestError) };

			var expectedError = {
				name:    'OpenSigError',
				code:    500,
				message: 'unknown error from blockchain api: StatusCodeError',
				details: { url: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				           error: requestError } 
				};

			return callUUT( parameters, [ apiTestData_call1 ], "reject", expectedError );

		});


		it("error is handled cleanly when request throws unknown error when publishing a transaction", function() {

			var parameters = {
				file: "test/test_files/the_great_gig_in_the_sky.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: true,
				paymentIn: undefined,
				feeIn: undefined };

			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-single_output.json" };

			var requestError = {
				  name: 'RequestError',
				  message: 'Error: getaddrinfo ENOTFOUND blockchain.info blockchain.info:443',
				  cause: 
				   { code: 'I Dont Know',
					 errno: 'IDontKnow',
					 syscall: 'getaddrinfo',
					 hostname: 'blockchain.info',
					 host: 'blockchain.info',
					 port: 443 },
				  error: 
				   { code: 'I Dont Know',
					 errno: 'IDontKnow',
					 syscall: 'getaddrinfo',
					 hostname: 'blockchain.info',
					 host: 'blockchain.info',
					 port: 443 },
				  options: 
				   { uri: 'https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet',
					 callback: undefined,
					 transform: undefined,
					 simple: true,
					 resolveWithFullResponse: false },
				  response: undefined };
			
			var txn = "010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24cd813010000006b483045022100b224e97c0b99b556474be728bddc04da2c0d4226627bbfdac792ee617c3c1b990220524511457c3dd7e995aabc35af5e2637e7a371b4429cf05df9cc7abc818ea602012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3000000000236150000000000001976a914df68e381dee7029d47dad0b5942906f3c162fb0588ac04e70000000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000";
			
			var apiTestData_call2 = {
				expectedURL: JSON.stringify({ method: "POST", 
							   url: "https://blockchain.info/pushtx", 
							   form:{ tx: txn }}),
				testType:    "synchronousError",
				data:        JSON.stringify(requestError) };
				
			var expectedError = {
				name:    'OpenSigError',
				code:    500,
				message: 'unknown error from blockchain api: RequestError',
				details: { url: "https://blockchain.info/pushtx body='"+txn+"'",
				           error: requestError } 
				};

			return callUUT( parameters, [ apiTestData_call1, apiTestData_call2 ], "reject", expectedError );

		});


	});

	
	describe("Building a transaction:", function() {

		it("invalid UTXO id received from blockchain", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: false,
				paymentIn: 1,
				feeIn: 0 };
				
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-invalid_id.json" };

			var expectedError = {
				name:    'OpenSigError',
				code:    500,
				message: 'could not build transaction due to invalid UTXO id or sequence',
				details: { message: "Invalid hex string",
				           transaction: { id: "1b1", sequence: 3, value: 100000 } }
  				 };

			return callUUT( parameters, [ apiTestData_call1 ], "reject", expectedError );

		});


		it("pay dust amount should only use utxo 1 and 99999 change", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: false,
				paymentIn: 1,
				feeIn: 0 };
				
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-multiple_outputs.json" };

			var expectedResponse = {
				from: { address: "1M9jofAErijG4eiPUy19Qxot1KkPRRzyet", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    100000,
				payment:  1,
				fee:      0,
				change:   99999,
				response: 'Not Published', 
				txnID:    '4161519151a96133a50254ebd7d048045fb2f98e1324da4db90ec72dbe553ea8', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c181b010000006b483045022100a857c1560a8c618f7326a968b28b1ab12fc4271cf74a9602d593e083df1b78d3022079b4f0d88d7d6e4277fea7b43d9d91396882cdf7526ec25a6e96f1818a3023d7012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3000000000201000000000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac9f860100000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000' };

			return callUUT( parameters, [ apiTestData_call1 ], "resolve", expectedResponse );

		});


		it("pay amount equal to utxo 1 should only use utxo 1 and no change", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: false,
				paymentIn: 90000,
				feeIn: 10000 };
				
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-multiple_outputs.json" };

			var expectedResponse = {
				from: { address: "1M9jofAErijG4eiPUy19Qxot1KkPRRzyet", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    100000,
				payment:  90000,
				fee:      10000,
				change:   0,
				response: 'Not Published', 
				txnID:    'a3e03f5105973bbd57940d129a5588d9292a6fb91214cef3c6be2e221e608320', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c181b010000006a473044022004de00755befc362bfa0803a7e59ba05d8ab845dff54a2d3b98da0bc274093fe02206494dbb4f59ad28349fbf07eb6f5c686be0743f5c5d147bc5491ddb95412ec4c012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30000000001905f0100000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac00000000' };

			return callUUT( parameters, [ apiTestData_call1 ], "resolve", expectedResponse );

		});


		it("pay amount equal to 1 more than utxo 1, should use utxo 2 with one 90000 output and 99999 change", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: false,
				paymentIn: 90000,
				feeIn: 10001 };
				
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-multiple_outputs.json" };

			var expectedResponse = {
				from: { address: "1M9jofAErijG4eiPUy19Qxot1KkPRRzyet", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    200000,
				payment:  90000,
				fee:      10001,
				change:   99999,
				response: 'Not Published', 
				txnID:    'b9255ab6968e6fcae82e2e86c4ef81d0de98c7cc8ed1ef71b603a5a089972cc0', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c281b020000006b483045022100d2286ac6db03800c1cd07877779fcb51866294e7599a8ed2d3011dcdcf1d3f4202204df2ca8e3c017b891edfc58fec1ce8cf9a7417a3abbd53921a34786d0c533468012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30000000002905f0100000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac9f860100000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000' };

			return callUUT( parameters, [ apiTestData_call1 ], "resolve", expectedResponse );

		});


		it("pay amount equal to 1 more than utxo 2, should use utxo 3 with one 190001 output and 99999 change", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: false,
				paymentIn: 190001,
				feeIn: 10000 };
				
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-multiple_outputs.json" };

			var expectedResponse = {
				from: { address: "1M9jofAErijG4eiPUy19Qxot1KkPRRzyet", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    300000,
				payment:  190001,
				fee:      10000,
				change:   99999,
				response: 'Not Published', 
				txnID:    '0074c5c9b4529418d1a45547319d38b72fa267c26e507763c597960340aee85d', 
				txnHex:   '010000000109882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c381b030000006a47304402207aa53c305b15946fcb807c14c97c57ebf4db2c2ba7cc406617b6ed6bdb2c4ab802207d8995401fbcac379c48f0f4f74faab71b64a11ca2f0cd087ea3e8b09b8a9bc4012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3000000000231e60200000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac9f860100000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000' };

			return callUUT( parameters, [ apiTestData_call1 ], "resolve", expectedResponse );

		});


		it("pay amount equal to 1 more than utxo 5, should use utxos 5 and 4 with one 500001 output and 399999 change", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: false,
				paymentIn: 500001,
				feeIn: 0 };
				
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-multiple_outputs.json" };

			var expectedResponse = {
				from: { address: "1M9jofAErijG4eiPUy19Qxot1KkPRRzyet", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    900000,
				payment:  500001,
				fee:      0,
				change:   399999,
				response: 'Not Published', 
				txnID:    '8c60b7e1474f90f25f3ea368ad01d92d60e6a480626e00882e9db3cc7fa6997b', 
				txnHex:   '010000000209882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c581b050000006b483045022100cc88e50efced3d3cae260fe57e87bee41291debc37f63de272a6a894e5a872b202202286e3967c4141d402f750d59ebd932d88cb4f81053e0121107f8c507c800104012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30000000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c481b040000006b483045022100e8bbc864bfbf4ab22a1a5fd849e6e2fb7987faf6ab66f947fdb0d848d4255ed802206d83289ec345aef169b8909f1ecff8324a23ecf7098dfb8ec6bf1434ef602890012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3010000000221a10700000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac7f1a0600000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000' };

			return callUUT( parameters, [ apiTestData_call1 ], "resolve", expectedResponse );

		});


		it("pay amount equal to 1 more than utxos 5+4+3, should use utxos 5, 4, 3 and 2 with one 1200001 output and 199999 change", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: false,
				paymentIn: 1200001,
				feeIn: 0 };
				
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-multiple_outputs.json" };

			var expectedResponse = {
				from: { address: "1M9jofAErijG4eiPUy19Qxot1KkPRRzyet", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    1400000,
				payment:  1200001,
				fee:      0,
				change:   199999,
				response: 'Not Published', 
				txnID:    '51aba4c55adf3a6e2f1a4ac91326dce6ee1dabb896692844e8fd13a67e5d0ba2', 
				txnHex:   '010000000409882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c581b050000006a47304402202dcf9c4f52fcdb8e815915ab05044aa0fd41ca6a44f21c658e709b25da5ac5ed02204f27129d2c756ec79f94069df68ea7f1ac6429af8370d86bae5187da9b4af002012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30000000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c481b040000006b483045022100cb1e6ee784ddac26ba88d4991290454265c7e987834da816ea54812319c6737202205e4dcb3d89ac7bb13e690588310b578f9c5bc7b269c9ea34086f345cad998bf8012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30100000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c381b030000006a473044022061736cc55b885aff4da6d54e40f0a8525d07bf1061edb7b0098e7552cfea7b4e0220654be086db8ccb6d83e62f99906bc27e774f80e5124ceac87c7e232556c989fa012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30200000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c281b020000006b483045022100d080de97016386c16d8b3a6ac3d0280937becd0476f49ef52ba74546969f713902201a0eb9c0221d4524a4beb6e56688dcd756f25373e96c2a3eb674ebf1ad3b96fe012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30300000002814f1200000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac3f0d0300000000001976a914dd09932106e2fd0f296b726da9cb5cf142648e9588ac00000000' };

			return callUUT( parameters, [ apiTestData_call1 ], "resolve", expectedResponse );

		});


		it("pay amount equal to the sum of all utxos, should use all utxos with one 1500000 output and no change", function() {

			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: false,
				paymentIn: 1500000,
				feeIn: 0 };
				
			var apiTestData_call1 = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-multiple_outputs.json" };

			var expectedResponse = {
				from: { address: "1M9jofAErijG4eiPUy19Qxot1KkPRRzyet", label: undefined },
				to:   { address: "13hCoaeW632HQHpzvMmiyNbVWk8Bfpvz14", label: "test/test_files/hello_world.txt" },
				input:    1500000,
				payment:  1500000,
				fee:      0,
				change:   0,
				response: 'Not Published', 
				txnID:    'aceab390d1e05dbf0b8a64afd8e90490ad0a0a92b08b5123032203df583dfbb8', 
				txnHex:   '010000000509882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c581b050000006b483045022100ea5404b3b464ab87dd76b76db9de762a5be5cc7538d7cd087c2085903be6a77002202a1f3c81493d0d300d41179f90110ddae98b124512cff721f2100707dab5b039012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30000000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c481b040000006b4830450221009e2d14e07f3b78c5e3a682f821dc1b40a422d9e42c8edb0605cb08e1dd7b7f3802202ac3917dd9d177bf476d904e90bb41b8216aec0597881bbcb0d531a2e200f72a012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30100000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c381b030000006b483045022100c37c16d50a0f6d41b643a6462569b1f07edf0d83b7c55f41fdfe08551133033902205075af203d0da048c2364359e967259531f8d26d02b19cf8961074d048ab0f9a012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30200000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c281b020000006a4730440220390208e0ffbd93e8439a77b7207977a2455a0cd75379a533159477817ad645b502205e112030137f44fe8c81d93f27e3c105900761819c682b66e15fd4916205e3b7012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab30300000009882232243a0ff09bf0fe98f3be6130935642d11508c38d22724a81a24c181b010000006a47304402202088aec73ccbb78643d900f92c8f566e078e47d47e8d67a4df0d81aef4866472022044b9ee2d83b14467bd7c5bb66263b9406abfb16a90e03cc05b84b27493b26d43012103ef12ef92ab520c62061e07186faac5ef43e835a3ef63ddd1437d15e9fcb0dab3040000000160e31600000000001976a9141d8abe268642dda7228be625e425749f0fc5467988ac00000000' };

			return callUUT( parameters, [ apiTestData_call1 ], "resolve", expectedResponse );

		});


		it("pay amount equal to one more than the sum of all utxos should reject with an error", function() {
		
			var parameters = {
				file: "test/test_files/hello_world.txt",
				key: "L33c5Gv8Ggt99PFDPieZ5fk56u1dZVChjGsHbrRAz9yagytNs32a",
				publish: false,
				paymentIn: 1500001,
				feeIn: 0 };
				
			var apiTestData = {
				expectedURL: "https://blockchain.info/unspent?active=1M9jofAErijG4eiPUy19Qxot1KkPRRzyet",
				testType:    "response",
				file:        "test/test_files/blockchain.info/utxo_response-multiple_outputs.json" };
				
			var expectedError = {
				name:    'OpenSigError',
				code:    600,
				message: 'insufficient funds',
				details: undefined };

			return callUUT( parameters, [ apiTestData ], "reject", expectedError );
		});


	});

	
});


function callUUT( parameters, apiCalls, resolveOrError, expectedResponse ){

	opensig.blockchainAPI.setTestMode(true);

	for( var i=0; i<apiCalls.length; i++ ){
		fs.writeFileSync( "testURLResponse"+(i+1), JSON.stringify(apiCalls[i]) );		
	}

	if( resolveOrError == "resolve" ){

		return opensig.sign(parameters.file, parameters.key, parameters.publish, parameters.paymentIn, parameters.feeIn )
			.then( function(response){
				expect(response).to.deep.equal( expectedResponse );
				for( var i=0; i<apiCalls.length; i++ ){
					fs.unlinkSync( "testURLResponse"+(i+1) );		
				}
			} );
	}

	else if( resolveOrError == "reject" ){

		return opensig.sign(parameters.file, parameters.key, parameters.publish, parameters.paymentIn, parameters.feeIn )
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
