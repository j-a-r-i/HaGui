/*
 * Copyright (C) 2015 Jari Ojanen
 * 
 * https://nodejs.org/api/child_process.html
 */

var exec = require('child_process').exec,
    log  = require('./log.js'),
    fs   = require('fs');

const MEMINFO = '/proc/meminfo';
const LOADAVG = '/proc/loadavg';
const UPTIME  = '/proc/uptime';

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
    var minfo = {};
    try {
        var data = fs.readFileSync(MEMINFO).toString().trim();
        data.split("\n").forEach(function (line) {
            var arr = line.split(':');
            arr[0] = arr[0].replace('(', '_');
            arr[0] = arr[0].replace(')', '');
            if (arr.length === 2) {
                minfo[arr[0]] = parseInt(arr[1]);
            }
        });
    }
    catch (e) {
        log.error(e);
        minfo = { free: 0 };
    }
    return minfo;
}

//-----------------------------------------------------------------------------
function loadavg()
{
    var line = "";
    try {
        line = fs.readFileSync(LOADAVG).toString();
    }
    catch (e) {
        log.error(e);
        line = "-1 -1 -1 -1";
    }
    return line.trim().split(" ");
}

//-----------------------------------------------------------------------------
function uptime()
{
    var line = fs.readFileSync(UPTIME).toString();
    var up = line.trim().split(" ");
    
    up[0] = parseFloat(up[0]) / (24*3600); 
    up[1] = parseFloat(up[1]) / (24*3600);
    
    return up;
}

//--------------------------------------------------------------------------------
// Dummy timer to print ping
//
function timer2()
{
  var rss = process.memoryUsage().rss / (1024*1024);
  log.normal("RSS = " + rss);
}


//-----------------------------------------------------------------------------
module.exports = {
	meminfo: meminfo,
	loadavg: loadavg,
    uptime: uptime
};