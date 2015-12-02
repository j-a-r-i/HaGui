"use strict";

var TAPI   = require('telldus-live'),
    config = require('./config.json'),
    log    = require('./log.js');

class Telldus
{
    constructor()
    {
        this._sensors = [];
        this._devices = [];
        this._cloud = new TAPI.TelldusAPI({ publicKey  : config.publicKey,
                                            privateKey : config.privateKey });
                                            
        this._cloud.on('error', function(err) {
            log.error('telldus error: ' + err.message);
        });

    }
    
    init(cb)
    {
        this._cloud.login(config.token, config.secret, (err, user) => {
            if (!!err) {
                var data = JSON.parse(err.data);
                log.error(data.error);
                cb(data.error);
                return;
            }
            this._cloud.getSensors((err, sensors) => {
                if (!!err) {
                    log.error(err);
                    cb(err); 
                    return;
                }
                this._sensors = sensors;
                
                this._cloud.getDevices((err, devices) => {
                    if (!!err) {
                        log.error(err);
                        cb(err); 
                        return;
                    }
                    this._devices = devices;
                    cb(null);
                });
            });
        });       
    }
    
    getDevice(name) {
        var ret = null;
        
        this._devices.forEach((d) => {
            if (d.name == name) {
                ret = d;
            }
        });
        return ret;
    }
    
    power(device, state)
    {
        var self = this;
        return new Promise((resolve,reject) => {
            self._cloud.onOffDevice(device, state, function(err, result) {
                if (!!err)
                    return reject(err);
                resolve(result);
            });
        });
    }
    
    sensor(i)
    {
        var self = this;
        return new Promise((resolve,reject) => {
              self._cloud.getSensorInfo(self._sensors[i], function(err, sensor) {
                if (!!err) {
                    return reject(err);
                }
                var arr = []
                sensor.data.forEach((data) => {
                    var name = sensor.name + "." + data.name;
                    arr.push([name, data.value]);
                });
                return resolve(arr);
              });
         });
    }
}

/*cloud.getDevices(function(err, devices) {
    var i;

    if (!!err) 
        return log.error('telldus getDeviceInfo: ' + err.message);

    for (i = 0; i < devices.length; i++) {
        if (devices[i].type === 'device') 
            cloud.getDeviceInfo(devices[i], function(err,device) {
                if (!!err) 
                    return log.normal('getDeviceInfo id=' + device.id + ': ' + err.message);
                
                log.normal(device.name + ' ' + (device.online === '0' ? 'absent' : device.status));
            });
    }
});*/

//--------------------------------------------------------------------------------


/*var t = new Telldus();

t.init(function (err) {
    if (!!err) return log.error(err);
    
    
    Promise.all([t.sensor(0), t.sensor(1)]).then((values) => {
        var d = new Date();
        
        values.forEach((i) => {
            i.forEach((i2) => {
               log.normal(i2);             
            });
        });

    }, (reason) => {
        log.normal(reason);
    })
});*/

//-----------------------------------------------------------------------------
module.exports = {
	Telldus: Telldus
};
