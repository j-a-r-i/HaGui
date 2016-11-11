"use strict";
/*
 * Copyright (C) 2015-6 Jari Ojanen
 */
var version = "0.4.0";

const SERVER_PORT=8090;
const WS_PORT=8080;

var WebSocket  = require('ws').Server,
    events     = require('events'),
    http       = require('http'),
    fs         = require('fs'),
    mqtt       = require('mqtt'),
//    sqlite     = require('sqlite3').verbose(),
    redis      = require('redis'),
    wss        = new WebSocket({port: WS_PORT}),
    config     = require('./config.json'),
    sche       = require('./scheduler.js'),
    fmi        = require('./fmi.js'),
    info       = require('./info.js'),
    log        = require('./log.js'),
    dweet      = require('./dweet.js'),
    nasdaq     = require("./nasdaq.js"),
    measure    = require('./measure.js');

var 
    gMeasures = [],
    gNasdaq = [],
    gWeather = [],
    emitter     = new events.EventEmitter(),
    emitterMeas = new events.EventEmitter(),
    gMeasure    = new measure.MeasureData(),
//    db          = new sqlite.Database(':memory:');
    redisClient = redis.createClient(6379, config.redisServer);


const CMD_MEASURES = 'meas';
const CMD_STOCK    = 'stoc';
const CMD_TV       = 'tvtv';
const CMD_LATEST   = 'last';
const CMD_WEATHER  = 'weat';
const CMD_STATUS   = 'stat';
const CMD_SETVAL   = 'sval';
const CMD_GETVAL   = 'gval';
const CMD_SCHEDULERS = 'sche';
const CMD_PING     = 'ping';

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
        resp.values = {};
    
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
    resp.data = [['PING']];
};

//--------------------------------------------------------------------------------
function onWsMessage(message)
{
    var resp = { cmd: message.cmd };
    let found = false;

    var cb = gCommands[message.cmd];
    if ((cb !== null) && (cb !== undefined)) {
        log.normal("executing " + message.cmd);
        cb(message, resp);
    }
    else {
        log.error("unknown command: " + message.cmd);        
        resp.error = "unknown command";
    }
    return resp;
}

//--------------------------------------------------------------------------------
var myDweet = new dweet.Dweet();
var myNasdaq = new nasdaq.Nasdaq();
var gTime = new Date();
var s = new sche.Scheduler();
var mqttClient  = mqtt.connect(config.mqttServer);

log.normal("HaGUI V" + version);
log.normal("time: " + sche.toClock2(gTime));



/*
emitterMeas.on("measure", (data) => {
    log.verbose("measure");
    
    gMeasures.push(data.values());

	//TODO dweet commented out!
    //var obj = data.getJson();
    //myDweet.send(obj);
            
    emitter.emit("temp", data.temp2);

    if (gMeasures.length > 300)
        gMeasures.shift();
});
emitterMeas.on("tick", (time) => {  // for simulated engine
    var c = sche.toClock2(time);
    s.tick(c);
});
*/

// Read initial data
//
/*myNasdaq.history()
.then((result) => {
    //console.log(result);
    gNasdaq = result;
});*/

// Read simulated FMI data.
//
fmi.fmiReadFile("wfs.xml", (err,arr) => {
    if (err) {
        return log.error(err);
    }
    gWeather = arr;
});


//--------------------------------------------------------------------------------
// Configure scheduler actions
//
/*s.add(new sche.IntervalAction(measure.ACTION_WEAT, emitter, 60,
                              sche.toClock2(gTime), 
                              () => {
    log.verbose("reading weather data");
    fmi.fmiRead((err,arr) => {
        if (err) {
            return log.error(err);
        }
        gWeather = arr;
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

//--------------------------------------------------------------------------------
mqttClient.on('connect', () => {
    console.log('mqtt connected');
    mqttClient.subscribe('sensor/#');
});
 
mqttClient.on('message', (topic, msg) => { 
    //console.log(topic + " - " + msg.toString());
    if (topic === "sensor/time") {
        gTime.setMinutes(gTime.getMinutes() + 10);
        gMeasure.time = gTime;
        s.tick(sche.toClock2(gTime));
    }
    else {
        gMeasure.set(topic.substring(7), msg.toString());
        if (topic === "sensor/t2") {
            emitter.emit("temp", msg.toString());
        }
        if (topic === "sensor/h1") {
            //console.log(gMeasure.values());
            console.log(gMeasure.RedisKey, gMeasure.RedisValue);
            redisClient.set(gMeasure.RedisKey, gMeasure.RedisValue);
        }
    }
});


redisClient.on('connect', () => {
    console.log('redis connected');
})

//--------------------------------------------------------------------------------
function action(name, state)
{
    log.history({time:   gTime,
		 action: name,
		 state:  state});
    mqttClient.publish('action/'+name, state.toString());
}

/*
 * Register actions.
 */
s.add(new sche.CarHeaterAction(measure.ACTION_CAR1,  emitter, action));
s.add(new sche.CarHeaterAction(measure.ACTION_CAR2,  emitter, action));
s.add(new sche.RangeAction(measure.ACTION_LIGHT,     emitter, action));
s.add(new sche.RangeAction(measure.ACTION_LIGHT2,    emitter, action));
s.add(new sche.RoomHeaterAction(measure.ACTION_ROOM, emitter, action));
s.load();

// generate html template and exit
//
if (process.argv.indexOf("-gen") !== -1) {
    s.genHtml();
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
