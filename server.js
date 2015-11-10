"use strict";

var TelldusAPI = require('telldus-live'),
    Loki       = require('lokijs'),
    db         = new Loki('ha.json'),
    WebSocket  = require('ws').Server,
    async      = require("async"),
    wss        = new WebSocket({port: 8080}),
    config     = require('./config.json');

var publicKey   = config.publicKey,
    privateKey  = config.privateKey,
    token       = config.token,
    tokenSecret = config.secret,
    cloud,
    gSensors;

var simulated = true,
    simTemp1 = 0,
    simTemp2 = 5,
    simHumi1 = 40;

var table = db.addCollection('temp', {indices:['time']});

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
    if (name == "ulko.temp") {
        this._temp1 = oneDecimal(parseFloat(value));
    }
    else if (name == "varasto.temp") {
        this._temp2 = oneDecimal(parseFloat(value));
    }
    else if (name == "varasto.humidity") {
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
    gTime.setMinutes(gTime.getMinutes() + 10);
    
    item.time = new Date(gTime);
    simTemp1 += simOffset(simTemp1, -5, 5);
    simTemp2 += simOffset(simTemp2, 5, 15);
    simHumi1 += simOffset(simHumi1, 30, 60);
    item.setItem('ulko.temp',        simTemp1);
    item.setItem('varasto.temp',     simTemp2);
    item.setItem('varasto.humidity', simHumi1);
    item.print(table);

    if (table.data.length > 300)
        table.remove(table.data[0]);
        
    //console.log(gTime);    
}

//--------------------------------------------------------------------------------
// Dummy timer to print ping
//
function timer2()
{
  //console.log(".");
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

    console.log("Executing " + message);
    
    switch (message) {
    case "cmd1":
        arr.push(['time', 't1', 't2']);
        
        table.data.forEach( function(item) {
            arr.push([item.time, item.temp1, item.temp2]);
        });
        break;

    case "cmd2":
        arr.push(['time', 'humidity']);
        
        table.data.forEach( function(item) {
            arr.push([item.time, item.humi1]);
        });
        break;

    case "cmd3":
	arr.push(['location', 'temperature']);
	var item = table.data[table.data.length - 1];
	arr.push(['ulko', item.temp1]);
	arr.push(['varasto', item.temp2]);
        console.log("Command 3");
        break;

    case "cmd4":
        console.log("Command 4");
        break;

    default:
        console.log("unknown command: " + message);
        break;
    }

    return arr;
/*    return [['Temp1','Temp2'],
            [1,2],
            [2,3],
            [3,4]];*/
}

var gTime;

//--------------------------------------------------------------------------------
if (simulated == false) {
  setInterval(timer1, 600000);  // 10 min
  //setInterval(timer2, 10000);   // 1 min
}
else {
  gTime = new Date();
  
  setInterval(timer1simulated, 100);  // 1 sec
  //setInterval(timer2, 2000);   // 1 min  
}

wss.on('connection', function(ws) {
    ws.on('message', function(message) {
        //console.log('received: %s', message);
        var ret = onWsMessage(message);
        ws.send(JSON.stringify(ret));
    });
    ws.send('something');
});
