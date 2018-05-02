var brunt = require('./lib/bruntapi');
var Service, Characteristic, Accessory, uuid;
var util = require('util');
var BruntThing;

const timeRefresh = 30000;  // refresh state cycle time in ms


module.exports = function (homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	Accessory = homebridge.hap.Accessory;
	uuid = homebridge.hap.uuid;

	BruntThing = require('./accessories/things')(Accessory, Service, Characteristic, uuid);

	homebridge.registerPlatform("homebridge-brunt", "Brunt", BruntPlatform);
};

function BruntPlatform(log, config) {
	// Load authentication From Config File
	this.user = config["user"];
	this.pass = config["pass"];
	this.api = brunt;
	this.log = log;
	this.debug = log.debug;
	this.deviceLookup = {};
}

BruntPlatform.prototype = {
	reloadData: function (callback) {
		//This is called when we need to refresh all Brunt device information.
		this.log("Refreshing Brunt Data");
		for (var i = 0; i < this.deviceLookup.length; i++) {
			this.deviceLookup[i].loadData();
		}
	},
	accessories: function (callback) {
		this.log("Fetching Brunt devices...");

		var that = this;
		var foundAccessories = [];
		this.deviceLookup = [];

		/*
		var refreshLoop = function () {
			setInterval(that.reloadData.bind(that), timeRefresh);
		};
		*/
		brunt.login(this.user, this.pass, function(loginData){
			brunt.getThings(loginData.sessionId, function(things){
					
				var thingTimeLapse = 0;
				
				if (things != null ) {
				that.log("Got things" + things);
					for (var i = 0; i < things.length; i++) {
						var thing = things[i];
						
						var accessory = undefined;
						thing.name = thing.NAME;
						thing.serial = thing.SERIAL;
						thing.uri = thing.thingUri;
						thing.session = loginData.sessionId;
						thing.refreshCycle = thing.delay + thingTimeLapse;


						accessory = new BruntThing(that, thing);

						if (accessory != undefined) {
							that.log("Device Added (Name: %s, ID: %s, Group: %s, Session: %s)", accessory.name, accessory.deviceid, accessory.deviceGroup, accessory.sessionId);
							that.deviceLookup.push(accessory);
							foundAccessories.push(accessory);
						}
					}
					callback(foundAccessories);
				} else {
					that.log("No Brunt devices return from server! Please check your login details.");
				}

			});
		});
	}
};