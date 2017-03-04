/*
 * Copyright (C) 2015 Jari Ojanen
 * 
 * https://nodejs.org/api/child_process.html
 */

var exec = require('child_process').exec,
    log  = require('./log'),
    cmd  = require('./commands'),
    v    = require('./var'),
    fs   = require('fs');

const MEMINFO = '/proc/meminfo';
const LOADAVG = '/proc/loadavg';
const UPTIME  = '/proc/uptime';


var values = [
    new v.MValue('status')
]

//-----------------------------------------------------------------------------
function df()
{
    var c1 = exec("df", function (error, stdout, stderr) {
        if (error !== null) {
            console.log('ERROR: ' + error);
            return;
        }
        console.log('stdout: ' + stdout);
    });
}

//-----------------------------------------------------------------------------
function meminfo()
{
    try {
        var data = fs.readFileSync(MEMINFO).toString().trim();
        data.split("\n").forEach(function (line) {
            var arr = line.split(':');
            arr[0] = arr[0].replace('(', '_');
            arr[0] = arr[0].replace(')', '');
            if (arr.length === 2) {
                values[0].set(parseInt(arr[1]), arr[0]);
            }
        });
    }
    catch (e) {
        log.error(e);
    }
}


//-----------------------------------------------------------------------------
/**
 *  @param {String}  filename
 *  @returns {String[]}
 */
function readLine(filename)
{
    try {
        var line = fs.readFileSync(LOADAVG).toString();

        return line.trim().split(' ');
    }
    catch (e) {
        log.error(e);
        return [];
    }    
}

//-----------------------------------------------------------------------------
function loadavg()
{
    const NAMES = ["load_1min", "load_5min", "load_15min", "Tasks", "LastPID"];

    return readFile(LOADAVG).map((item, index) => {
        values[0].set(item, NAMES[index]);
    });
}

//-----------------------------------------------------------------------------
function uptime()
{
    const NAMES = ["uptime", "idleTime"];

    return readFile(UPTIME).map((item, index) => {
        values[0].set(parseFloat(item) / (24 * 3600),
                      NAMES[index]);
    });
}

//--------------------------------------------------------------------------------
// Dummy timer to print ping
/*function timer2()
{
  var rss = process.memoryUsage().rss / (1024*1024);
  log.normal("RSS = " + rss);
}*/

//-----------------------------------------------------------------------------
function initialize(cfg)
{
    return values;
}

//-----------------------------------------------------------------------------
function read()
{
    values[0].clearHistory();

    loadavg();
    uptime();
    meminfo();
}


//-----------------------------------------------------------------------------
module.exports = {
    name: cmd.PLUG_INFO,
    initialize: initialize,
    action: {
        read: read
    }
};