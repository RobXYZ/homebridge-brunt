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
    if (debug) {
        console.log("[Brunt API Debug] Type of data.data:", typeof data.data);
        console.log("[Brunt API Debug] Value of data.data:", data.data);
    }

    // Check the type of data.data before calling Buffer.byteLength
    if (typeof data.data === 'string' || Buffer.isBuffer(data.data) || data.data instanceof ArrayBuffer) {
        options.headers['Content-Length'] = Buffer.byteLength(data.data);
    } else if (typeof data.data === 'object') {
        // If data.data is an object, stringify it
        data.data = JSON.stringify(data.data);
        options.headers['Content-Length'] = Buffer.byteLength(data.data);
    } else {
        // Log unexpected data type
        console.error("[Brunt API Debug] Unexpected data type:", typeof data.data);
    }
		options.headers['Content-Length'] = Buffer.byteLength(data.data);
		options.headers['Content-Type'] = "application/x-www-form-urlencoded; charset=UTF-8";
		options.headers['Accept'] = "application/vnd.brunt.v1+json";
		options.headers['X-Requested-With'] = "XMLHttpRequest";
		options.headers['Sec-Fetch-Site'] = "same-origin";
		options.headers['Accept-Language'] = "en-GB,en;q=0.9";
		options.headers['Accept-Encoding'] = "gzip, deflate";
		options.headers['Sec-Fetch-Mode'] = "cors";
		options.headers['Origin'] = "https://sky.brunt.co";
		options.headers['User-Agent'] = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
		options.headers['Referer'] = "https://sky.brunt.co/mobile/x8/?lang=en-GB";
		options.headers['Sec-Fetch-Dest'] = "empty";
	}

	if (data.sessionId) {
		options.headers['Cookie'] = "skySSEIONID=" + data.sessionId;
	}

    if (debug) {
        console.log("[Brunt API Debug] HTTP Request Options:\n", JSON.stringify(options, null, 4));
        console.log("[Brunt API Debug] HTTP Request Data:\n", data.data);
    }
	var str = '';

	var req = https.request(options, function (response) {

        // Log response headers
        if (debug) {
            console.log("[Brunt API Debug] HTTP Response Headers:\n", JSON.stringify(response.headers, null, 4));
        }

        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            // Log the entire response body
            if (debug) {
                console.log("[Brunt API Debug] HTTP Response Body:\n", str);
            }

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
			
					
						console.log("[Brunt API Debug] e.stack:\n", e.stack);
						console.log("[Brunt API Debug] Raw message:\n", str);
						console.log("[Brunt API Debug] Status Code:\n", response.statusCode);
					
					str = {
						error: e.message,
						rawMessage: str,
						statusCode: response.statusCode
					};
						
		    }

		    if (callback) callback(str);
		});
	});

    req.on('error', function (e) {
        if (debug) console.log("[%s Brunt API Debug] Error at req: %s - %s\n", new Date(), e.code.trim(), data.path);
        str = undefined;
        if (callback) callback(str);
    });

    if (data.data) {
        req.write(data.data);
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
		// Create the payload as a JSON string
		var payload = JSON.stringify({
			"ID": username,
			"PASS": password,
			"devicePlatform": "ios"
		});
	
		// Create the request data object
		var data = {
			data: payload,
			path: '/session',
			host: 'sky.brunt.co',
			port: '443',
			method: "POST",
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Accept': 'application/vnd.brunt.v1+json',
				'X-Requested-With': 'XMLHttpRequest',
				'Sec-Fetch-Site': 'same-origin',
				'Accept-Language': 'en-GB,en;q=0.9',
				'Accept-Encoding': 'gzip, deflate',
				'Sec-Fetch-Mode': 'cors',
				'Origin': 'https://sky.brunt.co',
				'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
				'Referer': 'https://sky.brunt.co/mobile/x8/?lang=en-GB',
				'Sec-Fetch-Dest': 'empty',
			}
		};
	
		if (debug) console.log("[Brunt API Debug] Logging in...");
		POST(data, function(responseData) {
			if (responseData && responseData.status && responseData.status == 'activate') {
				callback(null, responseData); 
			} else {
				var errorMsg = "Login failed. API Response: " + JSON.stringify(responseData);
				callback(new Error(errorMsg));
			}
		});
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
			if (debug) console.log(util.inspect(data, false, null));
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
		if (debug) console.log(util.inspect(data, false, null));
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