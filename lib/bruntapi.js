var http = require('http');
var https = require('https');
var cookie = require('cookie');
var util = require('util')


//set to true to log http response and errors to the console
var debug = false;

function _http(data, callback) {
	var that=this;
	//var waitTime = that.timeLapse;

	//console.log("Timeout setting: ",waitTime/1000,"s");
	var options = {
	  hostname: data.host,
	  port: data.port,
	  path: data.path,
	  method: data.method,
	  headers: {}
	};
	
	//console.log(options.path);
	if ( data.data ) {
		data.data = JSON.stringify(data.data);
		options.headers['Content-Length'] = Buffer.byteLength(data.data);
		options.headers['Content-Type'] = "application/x-www-form-urlencoded; charset=UTF-8";
		options.headers['Origin'] = "https://sky.brunt.co";
		options.headers['Accept-Language'] = "en-gb";
		options.headers['Accept'] = "application/vnd.brunt.v1+json";
		options.headers['User-Agent'] = "Mozilla/5.0 (iPhone; CPU iPhone OS 11_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E216";
	}

	if (data.sessionId) {
		options.headers['Cookie'] = "skySSEIONID=" + data.sessionId;
	}

	if (debug) console.log("[Brunt API Debug] HTTP Request:\n", options);

	var str = '';

	var req = https.request(options, function(response) {

		response.on('data', function (chunk) {
	    	str += chunk;
		});

		response.on('end', function () {
		    if (debug) console.log("[Brunt API Debug] Response in http:\n", str);
		    try {

			    	if (response.statusCode = 200 && str.length > 1) {
				    	str = JSON.parse(str);

				    	if (response.headers["set-cookie"] !== undefined) {
					    	var setcookie = response.headers["set-cookie"];
					    	var cookies = cookie.parse(setcookie[0]);
					    	str.sessionId = cookies.skySSEIONID
					    	if (debug) console.log("[Brunt API Debug] Session ID: ", cookies.skySSEIONID);
				    	} 
		    		} else if (response.statusCode = 200) {
		    			// Empty 200 response
				    		str = "200";
				    }


		    } catch(e) {
		    	if (debug) {
					console.log("[Brunt API Debug] e.stack:\n", e.stack);
		    		console.log("[Brunt API Debug] Raw message:\n", str);
		    		console.log("[Brunt API Debug] Status Code:\n", response.statusCode);
				}
		    	str = undefined;
		    }

		    if (callback) callback(str);
		});
	});

	req.on('error', function(e) {
  		if (debug) console.log("[%s Brunt API Debug] Error at req: %s - %s\n", new Date(),e.code.trim(),data.path);
  		// still need to response properly
  		str = undefined;
  		if (callback) callback(str);
	});

	// For POST (submit) state
	if ( data.data ) {
		req.write(data.data);
		//console.log(data.data);
	}
	
	req.end();

}

function POST(data, callback) {
	data.method = "POST";
	_http(data, callback);
}

function PUT(data, callback) {
	data.method = "PUT";
	_http(data, callback);
}

function GET(data, callback) {
	data.method = "GET";
	_http(data, callback);
}

function DELETE(data, callback) {
	data.method = "DELETE";
	_http(data, callback);
}

function OPTIONS(data, callback) {
	data.method = "OPTIONS";
	_http(data, callback);
}

var brunt = { 

	login: function(username, password, callback) {
		var data = {};
		data.data = {
						"ID":username,
						"PASS":password,
					};
		data.path = '/session';
		data.host = 'sky.brunt.co';
		data.port = '443';
		POST(data, function(data){
			if (data && data.status && data.status == 'activate') {
				callback(data);
			} else {
				callback();
			}
		})
	},
	
	getThings: function(sessionId, callback) {
		var data = {};
		data.path = '/thing';
		data.host = 'sky.brunt.co';
		data.port = '443';
		data.sessionId = sessionId;
		GET(data,function(data){
			//if (debug) console.log(util.inspect(data, false, null));
			if (data) {
				callback(data);
			} else {
				callback();
			}
		})
	},

	getState: function(sessionId, thingUri, callback) {
		var data = {};
		data.path = "/thing"+thingUri;
		data.host = 'thing.brunt.co';
		data.port = '8080';
		data.sessionId = sessionId;
		GET(data,function(data){
			//if (debug) console.log(util.inspect(data, false, null));
			if (data) {
				callback(data);
			} else {
				callback();
			}
		})
	},

	changePosition: function(sessionId, thingUri, position, callback) {
		var data = {};
		data.data = {
						"requestPosition": position.toString(),
					};
		data.path = "/thing"+thingUri;
		data.host = 'thing.brunt.co';
		data.port = '8080';
		data.sessionId = sessionId;
		//console.log(util.inspect(data, false, null));
		PUT(data, function(data){
			if (data) {
				callback(data);
			} else {
				callback();
			}
		})
	},
}

module.exports = brunt;