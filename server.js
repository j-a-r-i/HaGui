"use strict";
/*
 * Copyright (C) 2015-6 Jari Ojanen
 */
var version = "0.3.1";

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
    nasdaq     = require("./nasdaq.js"),
    measure    = require('./measure.js'),
    engine     = require('./engineSim.js');

var 
    gMeasures = [],
    gNasdaq = [],
    gWeather = [],
    gLights = null,
    gCar1 = null,
    gCar2 = null,
    emitter = new events.EventEmitter(),
    emitterMeas = new events.EventEmitter();

const CMD_MEASURES = "meas";
const CMD_STOCK    = "stoc";
const CMD_TV       = "tvtv";
const CMD_LATEST   = "last";
const CMD_WEATHER  = "weat";
const CMD_STATUS   = "stat";
const CMD_SETVAL   = "sval";
const CMD_GETVAL   = "gval";
const CMD_SCHEDULERS = "sche";
const CMD_PING     = "ping";

var gMeasure = new measure.MeasureData();

var gCommands = {};

gCommands[CMD_MEASURES] = (msg,resp) => {
    resp.data = [gMeasure.header()];

    gMeasures.forEach((i) => {
        resp.data.push(i);
    });
};
gCommands[CMD_STOCK] = (msg,resp) => {
    resp.data = gNasdaq;
};
gCommands[CMD_TV] = (msg,resp) => {
    resp.data = [];
};
gCommands[CMD_LATEST] = (msg,resp) => {
    if (gMeasures.length === 0) {
        resp.values = [];
    }
    else {
        var item = gMeasures[gMeasures.length - 1];
        var headers = gMeasure.header();
        resp.values = {}
    
        for (var i in headers) {
            resp.values[headers[i]] = item[i];
        }
    }
};
gCommands[CMD_WEATHER] = (msg,resp) => {
    resp.data = gWeather;
};
gCommands[CMD_STATUS] = (msg,resp) => {
    resp.ver = version;
    resp.load = info.loadavg();
    resp.mem = info.meminfo();
    resp.errors = log.getErrors();
    resp.history = log.getHistory();
};
gCommands[CMD_GETVAL] = (msg,resp) => {
    resp.data = s.get(msg.action);
};
gCommands[CMD_SETVAL] = (msg,resp) => {
    s.set(msg.action, msg.values);
};
gCommands[CMD_SCHEDULERS] = (msg,resp) => {
    resp.data = [];
    s._actions.forEach((a) => {
        var i = {
            name: a.name,
            values: a.strings()
        };
        resp.data.push(i);
    });
};
gCommands[CMD_PING] = (msg,resp) => {
    resp.data = ['PING'];
};

//--------------------------------------------------------------------------------
function onWsMessage(message)
{
    var resp = { cmd: message.cmd };
    let found = false;

    log.normal("executing " + message.cmd);
    
    var cb = gCommands[message.cmd];
    if (cb != null) {
        cb(message, resp);
    }
    else {
        resp.error = "unknown command";
        log.error("unknown command: " + message.cmd);        
    }
    return resp;
}

//--------------------------------------------------------------------------------
var myDweet = new dweet.Dweet();
var myNasdaq = new nasdaq.Nasdaq();
var gTime = new Date();
var s = new sche.Scheduler();

log.normal("HaGUI V" + version);
log.normal("time: " + sche.toClock2(gTime));

emitterMeas.on("measure", (data) => {
    log.verbose("measure");
    
    gMeasures.push(data.values());
    
    if (!engine.isSimulated) {
        var obj = data.getJson();
        myDweet.send(obj);
    }
    else {
        //var obj = data.getJson();
        //console.log(obj);        
    }
            
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

// Read initial data
//
/*myNasdaq.history()
.then((result) => {
    //console.log(result);
    gNasdaq = result;
});*/

//--------------------------------------------------------------------------------
// Configure scheduler actions
//
/*s.add(new sche.IntervalAction(measure.ACTION_WEAT, emitter, 60,
                              sche.toClock2(gTime), 
                              () => {
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
*/

/*s.add(new sche.ClockAction(measure.ACTION_CLOCK1,
			               emitter,
			               sche.toClock(18,0),
			               () => {
    log.normal("reading nasdaq data");
    myNasdaq.history()
    .then((result) => {
        console.log(result);
        gNasdaq = result;
    });

}));*/

/*
 * Register actions.
 */
s.add(new sche.CarHeaterAction(measure.ACTION_CAR1, emitter, engine.action));

s.add(new sche.CarHeaterAction(measure.ACTION_CAR2, emitter, engine.action));

s.add(new sche.RangeAction(measure.ACTION_LIGHT, emitter, engine.action));

s.add(new sche.RangeAction(measure.ACTION_LIGHT2, emitter, engine.action));

s.add(new sche.RoomHeaterAction(measure.ACTION_ROOM, emitter, engine.action));

s.load();

// generate html template and exit
//
if (process.argv.indexOf("-gen") !== -1) {
    s.genHtml();
}
else {
    if (engine.isSimulated === false) {
        s.start();
    }
    else {
        emitter.emit("temp", -12.0);
    }
}

//------------------------------------------------------------------------------
// The web socket
//
wss.on('connection', (ws) => {
    console.log("WebSocket opened.");
    ws.on('message', (message) => {
        try {
            console.log('WebSocket received: %s', message);
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
function WebSendFile(res, filename)
{
    var stat     = fs.statSync(filename);
    
    res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Length': stat.size });

    var reader = fs.createReadStream(filename);

    res.on('error', (err) => {
        log.error("http server:" + err);
        reader.end();
    });

    reader.pipe(res);   
}

var server = http.createServer((req,res) => {
    if (req.url === "/") {
        WebSendFile(res, 'html/dist/report.html');
    }
    else if (req.url === "/dash") {
        WebSendFile(res, 'hadash/dist/hadash.html');
    }
    //res.end('It <b>Works</b>!! Path Hit: ' + req.url);    
});

server.listen(SERVER_PORT, () => {
    console.log("Server listening on: http://localhost:%s", SERVER_PORT);
});


//------------------------------------------------------------------------------
process.on('exit', () => {
    console.log("Shutting down server.js");
});
