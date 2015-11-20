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
                    log.normal(name);
                    arr.push([name, data.value]);
                });
                return resolve(arr);
              });
         });
    }
    
    readSensors(cb)
    {
        var arr = [];
        var self = this;
        this._sensors.forEach(function (s) {
            self._cloud.getSensorInfo(s, function(err, sensor) {
                if (!!err) {
                    log.error(err.message);
                    cb(err, null); 
                    return;
                }
                sensor.data.forEach(function(data) {
                    var name = sensor.name + "." + data.name;
                    log.normal(name);
                    arr.push([name, data.value]);
                });
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
/*function readSensor(err, sensor)
{
    if (!!err) {
        return log.error('readSensor ' + err.message);
    }

    sensor.data.forEach(function(data) {
        var name = sensor.name + "." + data.name;
        
        log.normal(name);
        item.setItem(name, data.value);
      
        if (item.counter == SENSORS_NAMES.length) {
            item.print(gMeasures);

            if (gMeasures.length > 300)
                gMeasures.shift();
        }
    }, this);
}*/



var t = new Telldus();

t.init(function (err) {
    if (!!err) return log.error(err);
    
    
    Promise.all([t.sensor(0), t.sensor(1)]).then((values) => {
        log.normal(values);
    }, (reason) => {
        log.normal(reason);
    })
    
    t.readSensors(function (err,arr) {
        if (!!err) return log.error(err);
        log.normal(t._sensors);    
    })
});