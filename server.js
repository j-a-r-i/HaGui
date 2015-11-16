"use strict";

var TelldusAPI = require('telldus-live'),
    Loki       = require('lokijs'),
    db         = new Loki('ha.json'),
    WebSocket  = require('ws').Server,
    async      = require("async"),
    wss        = new WebSocket({port: 8080}),
    config     = require('./config.json'),
    sche       = require('./scheduler.js'),
    fmi        = require('./fmi.js');

var publicKey   = config.publicKey,
    privateKey  = config.privateKey,
    token       = config.token,
    tokenSecret = config.secret,
    cloud,
    gSensors,
    gWeather,
    gTimer1;

var simulated = false,
    simFast = true;

const SENSORS_NAMES = ["ulko.temp",
                       "varasto.temp",
                       "varasto.humidity"];

var simData = [ { name: SENSORS_NAMES[0],
                  value: 2.0,
                  min: -5.0,
                  max: 5.0},
                { name: SENSORS_NAMES[1],
                  value: 10.0,
                  min: 5.0,
                  max: 15.0},
                { name: SENSORS_NAMES[2],
                  value: 40.0,
                  min: 30.0,
                  max: 60.0}];

var table = db.addCollection('temp', {indices:['time']});

const CMD_DATA1 ="cmd1";
const CMD_DATA2 ="cmd2";
const CMD_DATA3 ="cmd3";
const CMD_DATA4 ="cmd3";
const CMD_STATUS = "stat";
const CMD_CONTROL = "ctrl";

if (simulated == false) {
    cloud = new TelldusAPI.TelldusAPI({ publicKey  : publicKey
                                        , privateKey : privateKey }).login(token, tokenSecret, function(err, user) {
      if (!!err)
          return console.log('login error: ' + err.message);

      cloud.getSensors(function(err, sensors) {
          if (!!err) return console.log('getSensors: ' + err.message);
          gSensors = sensors;

          item.time = new Date();
          
          gSensors.forEach(function (s) {
              cloud.getSensorInfo(s, readSensor);
          });
      }).getDevices(function(err, devices) {
          var i;

          if (!!err) return console.log('getDeviceInfo: ' + err.message);

          for (i = 0; i < devices.length; i++) {
              if (devices[i].type === 'device') 
                  cloud.getDeviceInfo(devices[i], function(err,device) {
                      if (!!err) 
                          return console.log('getDeviceInfo id=' + device.id + ': ' + err.message);
                      
                      console.log(device.name + ' ' + (device.online === '0' ? 'absent' : device.status));
                  });
          }
      });
    }).on('error', function(err) {
        console.log('background error: ' + err.message);
    });
}

//--------------------------------------------------------------------------------
class MeasureData {
  constructor() {
    console.log("create");
    this._time = "";
    this._temp1 = -99.0;
    this._temp2 = -99.0;
    this._humidity = -99.0;
    this._counter = 0;
  }
  
  setItem(name, value) {
    if (name == SENSORS_NAMES[0]) {
        this._temp1 = oneDecimal(parseFloat(value));
    }
    else if (name == SENSORS_NAMES[1]) {
        this._temp2 = oneDecimal(parseFloat(value));
    }
    else if (name == SENSORS_NAMES[2]) {
        this._humidity = oneDecimal(parseFloat(value));
    }
    this._counter++;
  }
  
  print(table) {
      console.log(this._time.toLocaleTimeString() + ": " + this._temp1 + ", " + this._temp2 + ", " + this._humidity);
      table.insert( {time: this._time,
                     temp1: this._temp1,
                     temp2: this._temp2,
                     humi1: this._humidity
                    });
  }
  
  get counter() {
    return this._counter;
  }

    get time() {
        return this._time;
    }
    
  set time(value) {
    this._counter = 0;
    this._time = value;
  }
  set temp2(value) {
    this._temp2 = value;
  }
  set humidity2(value) {
    this._humidity = value;
  }
}

//--------------------------------------------------------------------------------
var item = new MeasureData();


//--------------------------------------------------------------------------------
function readSensor(err, sensor)
{
    if (!!err) return console.log('readSensor id=' + sensor.id + ': ' + err.message);

    sensor.data.forEach(function(data) {
        var name = sensor.name + "." + data.name;

        item.setItem(name, data.value);
      
        if (item.counter == 3) {
            item.print(table);

            if (table.data.length > 300)
		table.remove(table.data[0]);
        }
      //db.run("INSERT INTO measures (sensor,time,value) VALUES (?,?,?)", name, sqltime, data.value);      
    }, this);
}

function random (low, high)
{
    return Math.random() * (high - low) + low;
}

//--------------------------------------------------------------------------------
// A periodic timer for reading data from Telldus server.
//
function timer1()
{ 
    var now  = new Date();
    //var sqltime = now.toJSON().replace("T", " ");
    //sqltime = sqltime.substring(0,19);
    //item.time = now.toLocaleTimeString();

    item.time = now;

    async.each(gSensors, function(s, callback) {
        cloud.getSensorInfo(s, readSensor);
        callback(null);
    }, function(err) {
        if (err) console.log("Error fetching sensor data.");       
    });
}

function simOffset(value, min, max)
{
    var offset = random(-0.5, 0.5);

    if (value < min)
	offset = Math.abs(offset);
    if (value > max)
	offset = -Math.abs(offset);
    return offset;
}


function timer1simulated()
{
    //gTime.setMinutes(gTime.getMinutes() + 10);
    gTime  = new Date();
    
    item.time = new Date(gTime);
    simData.forEach(function(data) {
       data.value += simOffset(data.value, data.min, data.max);
       item.setItem(data.name, data.value); 
    });
    item.print(table);

    if (table.data.length > 300) {
        table.remove(table.data[0]);
        if (simFast) {
            console.log("slow mode updating simulated data");
            simFast = false;
            clearInterval(gTimer1);
            gTimer1 = setInterval(timer1simulated, 60000)
        }
    }
}

//--------------------------------------------------------------------------------
// Dummy timer to print ping
//
function timer2()
{
  var rss = process.memoryUsage().rss / (1024*1024);
  console.log("RSS = " + rss);
}

function oneDecimal(x) 
{
    return Math.round(x * 10) / 10;
}

function onWsMessage(message)
{
    var arr = [];

    console.log("Executing " + message[0]);
    
    switch (message[0]) {
    case CMD_DATA1:
        arr.push(['time', 't1', 't2']);
        
        table.data.forEach( function(item) {
            arr.push([item.time, item.temp1, item.temp2]);
        });
        break;

    case CMD_DATA2:
        arr.push(['time', 'humidity']);
        
        table.data.forEach( function(item) {
            arr.push([item.time, item.humi1]);
        });
        break;

    case CMD_DATA3:
        arr.push(['location', 'temperature']);
        var item = table.data[table.data.length - 1];
        arr.push(['ulko', item.temp1]);
        arr.push(['varasto', item.temp2]);
        break;

    case CMD_DATA4:
        arr = gWeather;
        break;

    case CMD_STATUS:
        console.log("status");
        break;
        
    case CMD_CONTROL:
        console.log("control");
        break;

    default:
        console.log("unknown command: " + message);
        break;
    }

    return arr;
}

var gTime;
var s = new sche.Scheduler();

//--------------------------------------------------------------------------------
if (simulated == false) {
  gTimer1 = setInterval(timer1, 600000);  // 10 min
}
else {
  gTime = new Date();
  
  gTimer1 = setInterval(timer1simulated, 100);  // 1 sec
}

s.add( new sche.IntervalAction(60, function() {
    console.log("reading weather data");
    fmi.fmi_start(function(err,arr) {
        console.log(arr[1]);
        gWeather = arr;
    });
}));
s.start();

wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        //console.log('received: %s', message);
        var ret = onWsMessage(JSON.parse(message));
        ws.send(JSON.stringify(ret));
    });
    ws.send('something');
});
