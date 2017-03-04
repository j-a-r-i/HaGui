"use strict";
/*
 * Copyright (C) 2015-7 Jari Ojanen
 */
const SERVER_PORT=8090;
const WS_PORT=8080;

var WebSocket  = require('ws').Server,
    events     = require('events'),
    http       = require('http'),
    fs         = require('fs'),
    config     = require('./config.json'),
    rules      = require('./rules'),
    log        = require('./log'),
    dweet      = require('./dweet'),
    cmd        = require('./commands');

var 
    gPlugins  = [],
    gData     = {},
    gCommands = {},
    emitter   = new events.EventEmitter(),
    wss       = new WebSocket({port: WS_PORT}),
    myDweet   = new dweet.Dweet(),
    gTime     = new Date();


gPlugins.push( require('./log') );
gPlugins.push( require('./info') );
gPlugins.push( require('./mqtt') );
gPlugins.push( require('./info') );
gPlugins.push( require('./fmi') );
gPlugins.push( require('./nasdaq') );
//gPlugins.push( require('./vdr') );
//gPlugins.push( require('./strava') );

for (var plugin of gPlugins) {
    log.normal(plugin.name);
    var values = plugin.initialize(gCommands);

    values.forEach((value) => {
        log.normal("   - value " + value.name);
        gData[value.name] = value;
    });

    Object.keys(plugin.action).map((key) => {
        log.normal("   - action " + key);
    });
}

gCommands[cmd.PING] = (ws,args) => {
    return [['PING', 'PING']];
};

gCommands[cmd.ARRAY] = (ws,args) => {
    var arg = args[1];

    return gData[arg].history;
};

gCommands[cmd.SCALAR] = (ws,args) => {
    return gData[args[1]].value;
};
 
gCommands[cmd.GETVAL] = (ws,args) => {
    return rules.getVar(args[1]);
};

gCommands[cmd.SETVAL] = (ws,args) => {
    rules.setVar(args[1], args[2]);
    return [];
};

gCommands[cmd.EVENT] = (ws, args) => {
    rules.event(eventHandler, args[1], args[2]);
}

//--------------------------------------------------------------------------------
function WsMessage(ws, args)
{
    var cmd = args[0];
    var resp = { cmd: cmd };
    let found = false;

    var cb = gCommands[cmd];
    if ((cb !== null) && (cb !== undefined)) {
        var ret = cb(ws, args);
        if (ret !== null) {
            WsResponse(ws, { cmd: cmd,
                             arg: args[1],
                             data: ret });
        }
    }
    else {
        log.error(WEBSOCKET + "unknown command " + cmd);

        WsResponse(ws, { cmd: cmd,
                         arg: args[1],
                         data: [["ERR","unknown command"]] });
    }
    return resp;
}

function WsResponse(ws, obj)
{
    ws.send(JSON.stringify(obj));
}

//--------------------------------------------------------------------------------
/**
 * @param {String} plugin - The name of the plugin
 * @param {String} name - event name
 * @param {String|Date} arg - argument for the event
 */
function eventHandler(plugin, name, arg)
{
    gPlugins.map((plug) => {
        if (plug.name === plugin) {
            log.normal("Handling event " + plugin + "." + name + " " + arg);
            plug.action[name](arg);
        }
    })
    var plug = gPlugins
    var state = 0;
    var realName = "";

    if (name.endsWith(".on")) {
        state = 1;
        realName = name.substring(0, name.length - 3);
    }
    else if (name.endsWith(".off")) {
        state = 0;
        realName = name.substring(0, name.length - 4);
    }
    else {
        log.error("invalid action");
        return;
    }

    log.history(gTime, realName + " " + state);
    
    mqttClient.publish('action/'+name, state.toString());
}


//--------------------------------------------------------------------------------
log.normal("HaGUI V" + cmd.version);

// generate html template and exit
//
if (process.argv.indexOf("-gen") !== -1) {
    //s.genHtml();
}

const WEBSOCKET = "WS ";

//------------------------------------------------------------------------------
// The web socket
//
wss.on('connection', (ws) => {
    log.normal(WEBSOCKET + "opened");
    ws.on('message', (message) => {
        var args = message.split(' ');
        try {
            log.normal(WEBSOCKET + ' >> ' + message);

            WsMessage(ws, args);
        }
        catch (e) {
            log.error(e);

            WsResponse(ws, {cmd: args[0],
                            arg: args[1],
                            data: [["ERR", e.message]] });
        }
    });
    
    ws.on('close', () => {
       log.normal(WEBSOCKET + "closed"); 
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
    log.normal("Server listening on: http://localhost:" + SERVER_PORT);
});

//------------------------------------------------------------------------------
process.on('exit', () => {
    log.normal("Shutting down server.js");
});
