"use strict";
/*
 * Copyright (C) 2015-6 Jari Ojanen
 */
var version = "0.3.0";

const SERVER_PORT=8090;
const WS_PORT=8080;

var WebSocket  = require('ws').Server,
    events     = require('events'),
    http       = require('http'),
    fs         = require('fs'),
    wss        = new WebSocket({port: WS_PORT}),
    config     = require('./config.json'),
    sche       = require('./scheduler.js'),
    fmi        = require('./fmi.js'),
    info       = require('./info.js'),
    log        = require('./log.js'),
    dweet      = require('./dweet.js'),
    measure    = require('./measure.js'),
    engine     = require('./engineReal.js');

var 
    gMeasures = [],
    gWeather = [],
    gLights = null,
    gCar1 = null,
    gCar2 = null,
    emitter = new events.EventEmitter(),
    emitterMeas = new events.EventEmitter();

const CMD_MEASURES = "meas";
const CMD_LATEST   = "last";
const CMD_WEATHER  = "weat";
const CMD_STATUS   = "stat";
const CMD_SETVAL   = "sval";
const CMD_GETVAL   = "gval";
const CMD_SCHEDULERS = "sche";
const CMD_PING = "ping";

//--------------------------------------------------------------------------------
function onWsMessage(message)
{
    var resp = { cmd: message.cmd };

    log.normal("executing " + message.cmd);
    
    switch (message.cmd) {
    case CMD_MEASURES:
        var m = new measure.MeasureData();
        var arr = [m.header()];

        gMeasures.forEach(function(i) {
            arr.push(i);
        });
        m = null;
       
        resp.data = arr;
        break;

    case CMD_LATEST:
	if (gMeasures.length === 0) {
	    resp.values = [];
	}
	else {
            var item = gMeasures[gMeasures.length - 1];
            var m = new measure.MeasureData();
            var headers = m.header();
            var obj = {}
	    
            for (var i in headers) {
		obj[headers[i]] = item[i];
            };

            resp.values = obj;
	}
        break;

    case CMD_WEATHER:
        resp.data = gWeather;
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

    case CMD_GETVAL:
        resp.values = s.get(message.action);
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

    case CMD_PING:
        resp.ping = 1;
        break;
        
    default:
        resp.error = "unknown command";
        log.error("unknown command: " + message);
        break;
    }

    return resp;
}

//--------------------------------------------------------------------------------
var myDweet = new dweet.Dweet();
var gTime = new Date();
var s = new sche.Scheduler();

log.history(gTime, "HaGUI V" + version);
log.history(gTime, "time: " + sche.toClock2(gTime));

emitterMeas.on("measure", (data) => {
    console.log("measure");
    
    gMeasures.push(data.values());
    
    if (!engine.isSimulated)
        myDweet.send(data);
            
    //if (simulated === false)
    emitter.emit("temp", data.temp2);

    if (gMeasures.length > 300)
        gMeasures.shift();
});
emitterMeas.on("tick", (time) => {  // for simulated engine
    var c = sche.toClock2(time);
    s.tick(c);
});

engine.init(emitterMeas);
engine.start();

//--------------------------------------------------------------------------------
// Configure scheduler actions
//
s.add(new sche.IntervalAction(measure.ACTION_WEAT, emitter, 60,
                              sche.toClock2(gTime), 
                              function() {
    log.verbose("reading weather data");
    fmi.fmiRead(engine.isSimulated, function(err,arr) {
        if (err) {
            log.error(err);
        }
        else {
            gWeather = arr;
        }
    });
}));

s.add(new sche.CarHeaterAction(measure.ACTION_CAR1, emitter, function(action, state) {
    log.history(engine.time(), action.name + " " + state);
    engine.action(action.name, state);
}));

s.add(new sche.CarHeaterAction(measure.ACTION_CAR2, emitter, function(action, state) {
    log.history(engine.time(), action.name + " " + state);
    engine.action(action.name, state);
}));

s.add(new sche.RangeAction(measure.ACTION_LIGHT, emitter, function(action, state) {
    log.history(engine.time(), action.name + " " + state);
    engine.action(action.name, state);
}));

s.add(new sche.RangeAction(measure.ACTION_LIGHT2, emitter, function(action, state) {
    log.history(engine.time(), action.name + " " + state);
    engine.action(action.name, state);
}));

s.add(new sche.RoomHeaterAction(measure.ACTION_ROOM, emitter, function(action, state) {
    log.history(engine.time(), action.name + " " + state);
    engine.action(action.name, state);
}));

s.load();

if (engine.isSimulated === false) {
    //s.genHtml();
    s.start();
}
else {
    s.genHtml();
    emitter.emit("temp", -12.0);
}

//------------------------------------------------------------------------------
// The web socket
//
wss.on('connection', (ws) => {
    console.log("WebSocket opened.");
    ws.on('message', (message) => {
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

//------------------------------------------------------------------------------
// The web server
//
var server = http.createServer((req,res) => {
    var filename = 'html/dist/report.html';
    var stat     = fs.statSync(filename);
    
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Length': stat.size });

    var reader = fs.createReadStream(filename);

    res.on('error', (err) => {
        reader.end();
    });

    reader.pipe(res);
    //res.end('It <b>Works</b>!! Path Hit: ' + req.url);    
});

server.listen(SERVER_PORT, () => {
    console.log("Server listening on: http://localhost:%s", SERVER_PORT);
});


//------------------------------------------------------------------------------
process.on('exit', () => {
    console.log("Shutting down server.js");
});
