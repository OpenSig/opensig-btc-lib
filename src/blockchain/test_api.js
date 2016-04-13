/*
 * function opensig/blockchain/test_api
 *
 * Replaces the 'request' operation used by opensig/blockchain/blockchain.js allowing
 * blockchain api responses to be injected into OpenSig for testing purposes.
 *
 * Responses and expected tx data are passed via files named 'testURLResponse#', where #
 * increments for each sequential call.
 *
 * The format of each testURLResponse file (json) is as follows:
 *
 *   { "expectedURL": "<tx url data to be checked>",
 *     "testType":    "<the type of response or error to be simulated>",
 *     "data":        "<the response or error data>",
 *     "file":        "<a file name containing the response or error data>" }
 *
 * where:
 *   expectedURL  the call is rejected if this does not equal the url parameter passed
 *                to the function.
 *   testType     response (resolve with the given data);
 *                synchronousError (throw the given error data when the function is called);
 *                asynchronousError (reject with the given error data)
 *   data/file    file should contain one or the other not both.  If the testType is an
 *                error and the data is in json format then the data is assumed to be a
 *              json stringified error object and is parsed.
 *  
 * Call the function with the parameter "reset test harness" to reset the test number to
 * one.
 * 
*/

const Err = require('../types/error');
const FS = require('fs')
const assert = require('assert');

var testNumber = 0;
var test;
var testFilePrefix = "testURLResponse";

module.exports = function(url){
	if( url == "reset test harness" ){
		testNumber = 0;
	}
	else{
		testNumber++;
		var testData = readTestData( testFilePrefix+testNumber );
		var urlStr = url;
		if( (typeof url) != "string" ) urlStr = JSON.stringify(url);
		if( urlStr != testData.expectedURL ){ 
			throw new Err.TestError("Test failure: invalid URL '"+urlStr+"'",
				"Received: '"+url+"'," +
				"Expected: '"+testData.expectedURL+"'"); 
		}
		if( testData.testType == "synchronousError" )
			throw testData.error ? testData.error : new Err.TestError(testData.data);
		else return new Promise(
			function( resolve, reject ){
				if( testData.testType == "asynchronousError" )
					reject( testData.error ? testData.error : new Err.TestError(testData.data) );
				else if( testData.testType == "response" ) resolve( testData.data );
				else reject( new Err.TestHarnessError("test_api: Invalid test type in "+test.testFile) );
			} );
	}
}


function readTestData( file ){
	var rawData;
	try{
		rawData = FS.readFileSync(file, 'utf8');
	}
	catch(err){ 
		throw new Err.FileSystemError(err); 
	}
	try{
		var json = JSON.parse(rawData);
		if( json          == undefined ) throw new Err.TestHarnessError("test_api: invalid test file: "+file);
		if( json.expectedURL == undefined ) throw new Err.TestHarnessError("test_api: expectedURL is undefined in  "+file);
		if( json.data     == undefined && json.file == undefined ) throw new Err.TestHarnessError("test_api: data is undefined in "+file);
		if( json.testType == undefined ) throw new Err.TestHarnessError("test_api: testType is undefined in "+file);
		if( json.file ){
			try{
				json.data = FS.readFileSync(json.file, 'utf8');
			}
			catch(err){
				Err.TestHarnessError("test_api: error reading file "+json.file+": "+err.error);
			}
		}
		if( json.data.match(/^\s*\{/) && 
			( json.testType == "synchronousError" || json.testType == "asynchronousError" ) ){
			json.error = JSON.parse(json.data);
		}
	}
	catch(err){
		throw new Err.TestHarnessError("JSON: invalid test file: "+err.message);
	}
	return json;
}

