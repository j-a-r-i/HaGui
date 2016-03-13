"use strict";
/*
 * Copyright (C) 2015 Jari Ojanen
 */

var OAuth = require('oauth'),
    log   = require('./log'),
    config = require('./config.json');

const TELLDUS_TURNON = 1;
const TELLDUS_TURNOFF = 2;
const TELLDUS_BELL = 4;
const TELLDUS_DIM = 16;
const TELLDUS_UP = 128;
const TELLDUS_DOWN = 256;
	
//const SUPPORTED_METHODS = TELLDUS_TURNON | TELLDUS_TURNOFF | TELLDUS_BELL | TELLDUS_DIM | TELLDUS_UP | TELLDUS_DOWN;
const SUPPORTED_METHODS = TELLDUS_TURNON | TELLDUS_TURNOFF;

//-----------------------------------------------------------------------------
class TelldusApi 
{
    constructor(publicKey, privateKey, token, secret) 
    {
	this.token = token;
	this.secret = secret;
	this.site = "https://api.telldus.com/json";
	this.oauth = new OAuth.OAuth(null, 
				     null, 
				     publicKey, 
				     privateKey, 
				     '1.0', 
				     null, 
				     'HMAC-SHA1');
    }
	
    setPower(deviceId, state, callback) 
    {
	if (state)
	    this._doPut("/device/turnOn", callback);
	else
	    this._doPut("/device/turnOff", callback);
    }
	
    getSensors(callback) 
    {
	this._doGet("/sensors/list", callback);
    }
	
    
    getSensorInfo(sensorId, callback)
    {
	    this._doGet("/sensor/info?id="+sensorId.id, callback);
    }
	
    getDevices(callback) 
    {
	this._doGet("/devices/list?supportedMethods=" + SUPPORTED_METHODS, callback);
    }
	
    getDeviceInfo(deviceId, callback)
    {
	this._doGet("/device/info?id="+deviceId, callback);
    }
	
    _doGet(url, callback)
    {
	var site = url;

	log.normal("oauth get " + site + "...");
	this.oauth.get(this.site + url,
		       this.token,
		       this.secret,
		       (e,data,res) => {
			   if (e) {
			       return callback(e, null);
			   }
			   try {
			       data = JSON.parse(data);
			       //console.log(data);
			   }
			   catch(e) {
			       return callback(e, null);
			   }
			   log.normal("oauth get " + site + " done.");
			   callback(null, data);
		       });		
    }
	
    _doPut(url, callback)
    {
	//this.oauth.put(this.site + url);
    }
}


//-----------------------------------------------------------------------------
/*var t = new TelldusApi(config.publicKey, config.privateKey, config.token, config.secret);

t.getSensors((e, data) => {
	console.log(data.sensor);
});
t.getDevices((e, data) => {
	console.log(data.device);
});
*/

//-----------------------------------------------------------------------------
module.exports = {
	TelldusApi: TelldusApi,
};
