"use strict";

var OAuth = require('oauth'),
    config = require('./config.json');

const TELLDUS_TURNON = 1
const TELLDUS_TURNOFF = 2
const TELLDUS_BELL = 4
const TELLDUS_DIM = 16
const TELLDUS_UP = 128
const TELLDUS_DOWN = 256
	
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
	
	power(deviceId, state) 
	{
		
	}
	
	getSensors(callback) 
	{
		this._doGet("/sensors/list", callback);
	}
	
	
	getSensorInfo(sensorId, callback)
	{
		this._doGet("/sensor/info?id="+sensorId, callback);
	}
	
	getDevices(callback) 
	{
		this._doGet("/devices/list?supportedMethods=" + SUPPORTED_METHODS, callback);
	}
	
	
	_doGet(url, callback)
	{
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
						   callback(null, data);
					   });		
	}
	
	_doPut(url, callback)
	{
		
	}
}


//-----------------------------------------------------------------------------
var t = new TelldusApi(config.publicKey, config.privateKey, config.token, config.secret);

t.getSensors((e, data) => {
	console.log(data.sensor);
});
t.getDevices((e, data) => {
	console.log(data.device);
});

//-----------------------------------------------------------------------------
module.exports = {
	TelldusApi: TelldusApi,
};