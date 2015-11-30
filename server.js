"use strict";

var version = "0.1.1";

var WebSocket  = require('ws').Server,
    events     = require('events'),
    wss        = new WebSocket({port: 8080}),
    config     = require('./config.json'),
    settings   = require('./settings.json'),
    sche       = require('./scheduler.js'),
    fmi        = require('./fmi.js'),
    info       = require('./info.js'),
    log        = require('./log.js'),
    telldus    = require('./telldus.js');

var tcloud,
    gMeasures = [],
    gWeather = [],
    gTimer1,
    gLights = null,
    gCar1 = null,
    emitter = new events.EventEmitter();

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

const CMD_DATA1 ="cmd1";
const CMD_DATA2 ="cmd2";
const CMD_DATA3 ="cmd3";
const CMD_WEATHER ="cmd4";
const CMD_STATUS = "stat";
const CMD_CONTROL1 = "ctl1";
const CMD_CONTROL2 = "ctl2";
const CMD_CONTROL3 = "ctl3";
const CMD_LOGGING = "log1";

const ACTION_CAR1 = "car1";
const ACTION_CAR2 = "car2";
const ACTION_LIGHT = "light";
const ACTION_ROOM = "room";
const ACTION_WEAT = "weather"

if (simulated == false) {
    tcloud = new telldus.Telldus();
    
    tcloud.init((err) => {
        if (!!err) {
            log.error(err);
        }
        else {
            gLights = tcloud.getDevice("valot1");
            gCar1   = tcloud.getDevice("auto1");
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
            })      
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
        
        if (simulated == false)
            emitter.emit("temp", this._temp2);
    }
    else if (name == SENSORS_NAMES[2]) {
        this._humidity = oneDecimal(parseFloat(value));
    }
  }
  
  print(table) {
      log.normal(this._time.toLocaleTimeString() + ": " + this._temp1 + ", " + this._temp2 + ", " + this._humidity);
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
    Promise.all([tcloud.sensor(0), tcloud.sensor(1)]).then((values) => {
        item.time = new Date();              
        values.forEach((i) => {
            i.forEach((i2) => {
                item.setItem(i2[0], i2[1]);             
            });
        });
        item.print(gMeasures);               

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
    gTime.setMinutes(gTime.getMinutes() + 10);
    //gTime = new Date();
    
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
            gTimer1 = setInterval(timer1simulated, 2000)
        }
    }
}

//--------------------------------------------------------------------------------
// Dummy timer to print ping
//
function timer2()
{
  var rss = process.memoryUsage().rss / (1024*1024);
  log.normal("RSS = " + rss);
}

function oneDecimal(x) 
{
    return Math.round(x * 10) / 10;
}

function parseTime(name)
{
    var hour = parseInt(name.hour)
    var min  = parseInt(name.min);
    
    return sche.toClock(hour,min);
}

function onWsMessage(message)
{
    var arr = [];

    log.normal("Executing " + message[0]);
    
    switch (message[0]) {
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
        arr.push(version);
        arr.push(info.loadavg());
        arr.push(info.meminfo());
        arr.push(log.getErrors());
        arr.push(log.getHistory());
        break;
        
    case CMD_CONTROL1:
        arr.push("ok");
        settings.car1.hour = message[1];
        settings.car1.min = message[2];
        s.setVal(ACTION_CAR1, "LEAVE", parseTime(settings.car1));
        break;

    case CMD_CONTROL2:
        arr.push("ok");
        settings.car2.hour = message[1];
        settings.car2.min = message[2];
        s.setVal(ACTION_CAR2, "LEAVE", parseTime(settings.car2));
        break;

    case CMD_CONTROL3:
        arr.push("ok");
        settings.lights_start.hour = message[1];
        settings.lights_start.min = message[2];
        settings.lights_stop.hour = message[3];
        settings.lights_stop.min = message[4];

        s.setVal(ACTION_LIGHT, "START", parseTime(settings.lights_start));
        s.setVal(ACTION_LIGHT, "STOP",  parseTime(settings.lights_stop));
        break;

    default:
        arr.push("unknown command");
        log.error("unknown command: " + message);
        break;
    }

    return arr;
}

var gTime = new Date();
var s = new sche.Scheduler();

log.history("HaGUI V" + version);

//--------------------------------------------------------------------------------
if (simulated == false) {
  gTimer1 = setInterval(timer1, 600000);  // 10 min
}
else {
  gTimer1 = setInterval(timer1simulated, 100);  // 1 sec
}

s.add(new sche.IntervalAction(ACTION_WEAT, emitter, 60, 
                              sche.toClock2(gTime), 
                              function() {
    log.normal("reading weather data");
    fmi.fmiRead(simulated, function(err,arr) {
        //console.log(arr[1]);
        gWeather = arr;
    });
}));

s.add(new sche.CarHeaterAction(ACTION_CAR1, emitter, parseTime(settings.car1), function(state) {
    log.history("CAR1 " + state);
    if (gCar1) 
        tcloud.power(gCar1, state).then();
}));

s.add(new sche.CarHeaterAction(ACTION_CAR2, emitter, parseTime(settings.car2), function(state) {
    log.history("CAR2 " + state); 
}));

s.add(new sche.RangeAction(ACTION_LIGHT, emitter, parseTime(settings.lights_start),
                                 parseTime(settings.lights_stop), 
                                 function(state) {
    log.history("LIGHT " + state);
    if (gLights) 
        tcloud.power(gLights, state);
}));

s.add(new sche.RoomHeaterAction(ACTION_ROOM, emitter, 5.0, 10.0, function(state) {
    log.history("ROOM " + state);
}));


if (simulated == false) {
    s.start();
}
else {
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
});
