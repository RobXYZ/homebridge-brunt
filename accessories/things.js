var inherits = require("util").inherits;

var Accessory, Service, Characteristic, uuid;

var stateTimeToLive = 60000; // Interval to refresh data from Brunt server (not too often)
var stateRefreshRate = 2000; // Interval for internal status update refresh


/*
 *   Blind Accessory
 */

module.exports = function (oAccessory, oService, oCharacteristic, ouuid) {
	if (oAccessory) {
		Accessory = oAccessory;
		Service = oService;
		Characteristic = oCharacteristic;
		uuid = ouuid;

		inherits(BruntBlindAccessory, Accessory);
		BruntBlindAccessory.prototype.deviceGroup = "blinds";
		BruntBlindAccessory.prototype.loadData = loadData;
		BruntBlindAccessory.prototype.getServices = getServices;
		BruntBlindAccessory.prototype.refreshState = refreshState;
		BruntBlindAccessory.prototype.identify = identify;
	
	}
	return BruntBlindAccessory;
};
module.exports.BruntBlindAccessory = BruntBlindAccessory;

function BruntBlindAccessory(platform, device) {
	
	this.deviceid = device.uri;
	this.name = device.name;
	this.platform = platform;
	this.deviceUri = device.uri;
	this.sessionId = device.session;
	this.log = platform.log;
	this.debug = platform.debug;
	this.state = {};
	
	var idKey = "hbdev:brunt:thing:" + this.deviceid;
	var id = uuid.generate(idKey);
	
	Accessory.call(this, this.name, id);
	var that = this;
	
	// HomeKit does really strange things since we have to wait on the data to get populated
	// This is just intro information. It will be corrected in a couple of seconds.
	that.state.currentPosition = 100; // closed
	that.state.targetPosition = 100; // closed
	that.state.moveState = 2; // stopped
	that.state.refreshCycle = stateRefreshRate;

	this.loadData();
	this.loadData.bind(this);

	var refreshInterval = setInterval(this.loadData.bind(this), that.state.refreshCycle);

	// AccessoryInformation characteristic
	// Manufacturer characteristic
	this.getService(Service.AccessoryInformation)
		.setCharacteristic(Characteristic.Manufacturer, "homebridge-brunt");
	
	// Model characteristic	
	this.getService(Service.AccessoryInformation)
		.setCharacteristic(Characteristic.Model, "version 0.0.1");
	
	// SerialNumber characteristic
	this.getService(Service.AccessoryInformation)
		.setCharacteristic(Characteristic.SerialNumber, "Pod ID: " + that.deviceid);
	
	// Add window blind
	this.addService(Service.WindowCovering);	

	// Current position
	this.getService(Service.WindowCovering)
		.getCharacteristic(Characteristic.CurrentPosition)
		.on("get", function (callback) {
			callback(null, that.state.currentPosition);
		});

	// Target position characteristic
	this.getService(Service.WindowCovering)
		.getCharacteristic(Characteristic.TargetPosition)
		.on("get", function (callback) {
			callback(null, that.state.targetPosition);
		})
		.on("set", function(value, callback) {
			callback();
			that.state.position = value;
			that.platform.api.changePosition(that.sessionId ,that.deviceid, value, function(data){
				if (data !== undefined) {
					var rightnow = new Date();
					that.state.targetPosition = value;
					if (that.state.targetPosition < that.state.currentPosition) {
						that.state.moveState = 0;
						that.state.updatetime = rightnow;
						stateTimeToLive = 10000;
					} else if (that.state.targetPosition > that.state.currentPosition) {
						that.state.moveState = 1;
						that.state.updatetime = rightnow;
						stateTimeToLive = 10000;
					} else {
						that.state.moveState = 2;
						stateTimeToLive = 30000;
					}
				}
			});
		});

	// Position characteristic
	this.getService(Service.WindowCovering)
		.getCharacteristic(Characteristic.PositionState)
		.on("get", function (callback) {
			callback(null, that.state.moveState);
		})

}


function refreshState(callback) {
	// This prevents this from running more often
	var that=this;
	var rightnow = new Date();
	//that.log(that.deviceid,":refreshState - timelapse:",(that.state.updatetime) ?(rightnow.getTime() - that.state.updatetime.getTime()) : 0, " - State:\n",that.state);

	// If last update was less than stateTimeToLive return callback
	if ((that.state.updatetime && (rightnow.getTime()-that.state.updatetime.getTime())<stateTimeToLive)) { 
		if (callback !== undefined) callback();
		return
	}

	// If the blind is moving then check more often
	if (that.state.targetPosition != that.state.currentPosition) {
			stateTimeToLive = 2000;
	} else {
			stateTimeToLive = 60000;
	}

	if (!that.state.updatetime) that.state.updatetime = rightnow;

	// Update the State
	that.platform.api.getState(that.sessionId ,that.deviceid, function(blindState) {

		if (blindState !== undefined ) {

			switch (blindState.moveState) {
				case "1":
					that.state.moveState = 1;
					break;
				case "2":
					that.state.moveState = 0;
					break;
				default:
					that.state.moveState = 2;
			}
				
			if(that.state.moveState == 2 && Math.abs(blindState.currentPosition - blindState.requestPosition) >=2 ){
				// change position by pressing button (requestPostion is not updated in this case) or get stuck
				that.state.targetPosition = blindState.currentPosition;
				that.state.currentPosition = blindState.currentPosition;
			}else{
				that.state.targetPosition = blindState.requestPosition;
				that.state.currentPosition = blindState.currentPosition;
			}

			// Because the Brunt blinds do not always stop exactly on the target position we allow a couple of percent eitherway or the Home app thinks the blinds are still moving

			if (that.state.currentPosition < that.state.targetPosition+2 || that.state.currentPosition < that.state.targetPosition-2 ) that.state.currentPosition = that.state.targetPosition;
			that.state.updatetime = new Date(); // Set our last update time.
		}
		
		callback();
	});		
}

function loadData() {
	var that = this;
	this.refreshState(function() { 
	// Refresh the status on home App
		for (var i = 0; i < that.services.length; i++) {
			for (var j = 0; j < that.services[i].characteristics.length; j++) {
				that.services[i].characteristics[j].getValue();
			}
		}
	});		
}


function getServices() {
	return this.services;
}

function identify() {
	this.log("Identify! (name: %s)", this.name);
}
