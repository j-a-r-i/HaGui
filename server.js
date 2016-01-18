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
    engine     = require('./engineSim.js');

var 
    gMeasures = [],
    gWeather = [],
    gLights = null,
    gCar1 = null,
    gCar2 = null,
    emitter = new events.EventEmitter(),
    emitterMeas = new events.EventEmitter;

var simulated = true;



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

engine.init(emitterMeas);

//--------------------------------------------------------------------------------

var myDweet = new dweet.Dweet();


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


engine.start();

//--------------------------------------------------------------------------------

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