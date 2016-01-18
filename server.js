"use strict";
/*
 * Copyright (C) 2015 Jari Ojanen
 */

var version = "0.1.4";

var WebSocket  = require('ws').Server,
    events     = require('events'),
    wss        = new WebSocket({port: 8080}),
    config     = require('./config.json'),
    sche       = require('./scheduler.js'),
    fmi        = require('./fmi.js'),
    info       = require('./info.js'),
    log        = require('./log.js'),
    dweet      = require('./dweet.js'),
    telldus    = require('./telldus.js');

var tcloud,
    gMeasures = [],
    gWeather = [],
    gTimer1,
    gLights = null,
    gCar1 = null,
    gCar2 = null,
    emitter = new events.EventEmitter();

var simulated = false,
    simFast = false;

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

const CMD_DATA1 ="cmd1";
const CMD_DATA2 ="cmd2";
const CMD_DATA3 ="cmd3";
const CMD_WEATHER ="cmd4";
const CMD_STATUS = "stat";
const CMD_SETVAL = "sval";
const CMD_SCHEDULERS = "sche1";

const ACTION_CAR1 = "car1";
const ACTION_CAR2 = "car2";
const ACTION_LIGHT = "light";
const ACTION_LIGHT2 = "light2";
const ACTION_ROOM = "room";
const ACTION_WEAT = "weather";

if (simulated === false) {
    tcloud = new telldus.Telldus();
    
    tcloud.init((err) => {
        if (!!err) {
            log.error(err);
        }
        else {
            gLights = tcloud.getDevice("valot1");
            gCar1   = tcloud.getDevice("auto1");
            gCar2   = tcloud.getDevice("auto2");
            Promise.all([tcloud.sensor(0), tcloud.sensor(1)]).then((values) => {
                item.time = new Date();              
                values.forEach((i) => {
                    i.forEach((i2) => {
                        item.setItem(i2[0], i2[1]);             
                    });
                });
                item.print(gMeasures);               
            }, (reason) => {
                log.error(reason);
            });
        }
    });
}

//--------------------------------------------------------------------------------
class MeasureData {
  constructor() {
    this._time = "";
    this._temp1 = -99.0;
    this._temp2 = -99.0;
    this._humidity = -99.0;
  }
  
  setItem(name, value) {
    if (name == SENSORS_NAMES[0]) {
        this._temp1 = oneDecimal(parseFloat(value));
    }
    else if (name == SENSORS_NAMES[1]) {
        this._temp2 = oneDecimal(parseFloat(value));
        
        if (simulated === false)
            emitter.emit("temp", this._temp2);
    }
    else if (name == SENSORS_NAMES[2]) {
        this._humidity = oneDecimal(parseFloat(value));
    }
  }
  
  print(table) {
      log.verbose(this._time.toLocaleTimeString() + ": " + this._temp1 + ", " + this._temp2 + ", " + this._humidity);
      table.push( {time: this._time,
                   t1: this._temp1,
                   t2: this._temp2,
                   h1: this._humidity
                   });
  }
  
  get time() {
    return this._time;
  }
    
  set time(value) {
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
var myDweet = new dweet.Dweet();

//--------------------------------------------------------------------------------
function random (low, high)
{
    return Math.random() * (high - low) + low;
}

//--------------------------------------------------------------------------------
// A periodic timer for reading data from Telldus server.
//
function timer1()
{
    console.log("timer1");
    
    Promise.all([tcloud.sensor(0), tcloud.sensor(1)]).then((values) => {
        item.time = new Date();              
        values.forEach((i) => {
            i.forEach((i2) => {
                item.setItem(i2[0], i2[1]);             
            });
        });
        item.print(gMeasures);               
        myDweet.send(item);

        if (gMeasures.length > 300)
            gMeasures.shift();
    }, (reason) => {
        log.error(reason);
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
    console.log("timer1simulated");
    
    gTime.setMinutes(gTime.getMinutes() + 10);
    
    item.time = new Date(gTime);
    simData.forEach(function(data) {
       data.value += simOffset(data.value, data.min, data.max);
       item.setItem(data.name, data.value); 
    });
    item.print(gMeasures);
    
    var c = sche.toClock2(gTime);
    s.tick(c);

    if (gMeasures.length > 300) {
        gMeasures.shift();
        if (simFast) {
            log.normal("slow mode updating simulated data");
            simFast = false;
            clearInterval(gTimer1);
            gTimer1 = setInterval(timer1simulated, 2000);
        }
    }
}

function oneDecimal(x) 
{
    return Math.round(x * 10) / 10;
}

function onWsMessage(message)
{
    var resp = { cmd: message.cmd };
    var arr = [];

    log.normal("Executing " + message.cmd);
    
    switch (message.cmd) {
    case CMD_DATA1:
        arr.push(['time', 't1', 't2']);       
        gMeasures.forEach( function(item) {
            arr.push([item.time, item.t1, item.t2]);
        });
        break;

    case CMD_DATA2:
        arr.push(['time', 'humidity']);       
        gMeasures.forEach( function(item) {
            arr.push([item.time, item.h1]);
        });
        break;

    case CMD_DATA3:
        arr.push(['location', 'temperature']);
        var item = gMeasures[gMeasures.length - 1];
        arr.push(['ulko', item.t1]);
        arr.push(['varasto', item.t2]);
        break;

    case CMD_WEATHER:
        arr = gWeather;
        break;

    case CMD_STATUS:
        resp.ver = version;
        resp.load = info.loadavg();
        resp.mem = info.meminfo();
        resp.errors = log.getErrors();
        resp.history = log.getHistory();
        break;
        
    case CMD_SETVAL:
        s.set(message.action, message.values);
        break;

    case CMD_SCHEDULERS:
        //resp.items = ['one', 'two', 'three'];
        var lst = [];
        s._actions.forEach((a) => {
            var i = {};
            i.name = a.name;
            i.values = a.strings();
            lst.push(i);
        });
        resp.items = lst;
        break;
        
    default:
        resp.error = "unknown command";
        log.error("unknown command: " + message);
        break;
    }

    if (arr.length > 0)
        resp.data = arr;

    return resp;
}

var gTime = new Date();
var s = new sche.Scheduler();

log.history("HaGUI V" + version);
log.history("time: " + sche.toClock2(gTime));

//--------------------------------------------------------------------------------
if (simulated === false) {
  gTimer1 = setInterval(timer1, 600000);  // 10 min
}
else {
  gTimer1 = setInterval(timer1simulated, 100);  // 1 sec
  fmi.fmiRead(simulated, function(err,arr) {
      if (err) {
          log.error(err);
      }
      else {
        gWeather = arr;
      }
  });
}

// Configure scheduler actions
//
s.add(new sche.IntervalAction(ACTION_WEAT, emitter, 60,
                              sche.toClock2(gTime), 
                              function() {
    log.normal("reading weather data");
    fmi.fmiRead(simulated, function(err,arr) {
        if (err) {
            log.error(err);
        }
        else {
            gWeather = arr;
        }
    });
}));

s.add(new sche.CarHeaterAction(ACTION_CAR1, emitter, function(state) {
    log.history("CAR1 " + state);
    if (gCar1) 
        tcloud.power(gCar1, state).then();
}));

s.add(new sche.CarHeaterAction(ACTION_CAR2, emitter, function(state) {
    log.history("CAR2 " + state); 
    if (gCar2) 
        tcloud.power(gCar2, state).then();
}));

s.add(new sche.RangeAction(ACTION_LIGHT, emitter, function(state) {
    log.history("LIGHT " + state);
    if (gLights) 
        tcloud.power(gLights, state);
}));

s.add(new sche.RangeAction(ACTION_LIGHT2, emitter, function(state) {
    log.history("LIGHT2 " + state);
    if (gLights) 
        tcloud.power(gLights, state);
}));

s.add(new sche.RoomHeaterAction(ACTION_ROOM, emitter, function(state) {
    log.history("ROOM " + state);
}));

s.load();

if (simulated === false) {
    s.start();
}
else {
    s.genHtml();
    emitter.emit("temp", -12.0);
}
wss.on('connection', function(ws) {
    
    ws.on('message', function(message) {
        try {
            //console.log('received: %s', message);
            var ret = onWsMessage(JSON.parse(message));
            ws.send(JSON.stringify(ret));
        }
        catch (e) {
            log.error(e);
        }
    });
    
    ws.on('close', () => {
       console.log("WebSocket closed."); 
    });
});

process.on('exit', () => {
    console.log("Shutting down server.js");
});