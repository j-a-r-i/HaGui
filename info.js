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

const VAL_FREERAM = 0;
const VAL_UPTIME = 1;
const VAL_LOAD_1MIN = 2;
const VAL_LOAD_5MIN = 3;
const VAL_LOAD_15MIN = 4;

var values = [
    new v.MValue('freeRam'),
    new v.MValue('uptime'),
    new v.MValue('load1min'),
    new v.MValue('load5min'),
    new v.MValue('load15min')
];



//-----------------------------------------------------------------------------
function df()
{
    var c1 = exec("df", (error, stdout, stderr) => {
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
	var freeMem = 0;
	var mem = {}
        var data = fs.readFileSync(MEMINFO).toString();
        data.split("\n").forEach((line) => {
            var arr = line.split(':');
	    mem[arr[0]] = parseInt(arr[1]);
        });
	freeMem = (mem['MemFree'] + mem['Cached'] + mem['Buffers']) / 1024;
	//console.log("free: " + freeMem);

	values[VAL_FREERAM].value = freeMem;
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
        let line = fs.readFileSync(filename).toString().trim();

        return line.split(' ');
    }
    catch (e) {
        log.error(e);
        return [];
    }    
}

//-----------------------------------------------------------------------------
function loadavg()
{
    //file contents: <load_1min> <load_5min> <load_15min> <Tasks> <LastPID>
    
    let items = readLine(LOADAVG);

    if (items.length === 5) {
	values[VAL_LOAD_1MIN].value = parseFloat(items[0]);
	values[VAL_LOAD_5MIN].value = parseFloat(items[1]);
	values[VAL_LOAD_15MIN].value = parseFloat(items[2]);
    }
    else {
	log.error("invalid " + LOADAVG);
    }
}

//-----------------------------------------------------------------------------
function uptime()
{
    //file contents: <uptime> <idleTime>
    var items = readLine(UPTIME);

    if (items.length === 2) {
	let uptime = parseFloat(items[0]) / (24*3600);  // unit is days

	values[VAL_UPTIME].value = uptime;
    }
    else {
	log.error("invalid " + UPTIME);
    }
}

//-----------------------------------------------------------------------------
function read()
{
    values[VAL_UPTIME].clearHistory();

    loadavg();
    uptime();
    meminfo();
}

//-----------------------------------------------------------------------------
module.exports = {
    name: cmd.PLUG_INFO,
    initialize: (cfg) => { return values; },
    action: {
        read: read
    }
};
