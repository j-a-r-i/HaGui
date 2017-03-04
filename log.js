/*
 * Copyright (C) 2015-7 Jari Ojanen
 */

var v   = require('./var'),
    cmd = require('./commands');

var values = [
    new v.MValue("l_hist"),  // Store for history objects. History is for action changes
    new v.MValue("l_err")    // Store for error strings
];

const INDEX_HISTORY = 0;
const INDEX_ERROR   = 1;

const RED    = '\u001b[31m';
const NORMAL = '\u001b[39m';

/** Add string to log (verbose level).
 *
 * @param {string} msg Message to be logged
 */
function verbose(msg)
{
	// do nothing	
}

/** Add string to log (normal level).
 *
 * @param {string} msg Message to be logged
 */
function normal(msg)
{
    console.log(msg);
}

function getHistoryString(item)
{
    var dstr = [item.time.getFullYear(),
                item.time.getMonth() + 1,
                item.time.getDate()].join(".");
    var tstr = [item.time.getHours(),
                item.time.getMinutes(),
                item.time.getSeconds()].join(":");
    return JSON.stringify(dstr + " " + tstr + " <" + item.action + "> " + item.state);
}

/** Add string to history.
 *
 * @param {Date} time  Time
 * @param {string} msg Message to be logged
 */
function history(time, msg)
{
    //var d = new Date();
    //var s = d.toISOString().slice(5,19) + " " + msg;
    //var s = d.toLocaleString() + " " + msg;

    values[INDEX_HISTORY].set(msg, time);

    console.log(getHistoryString(obj));
}

/** Add string to log (error level).
 *
 * @param {string} msg Error to be logged
 */
function error(msg)
{
    values[INDEX_ERROR].set(msg, "");
		
	console.log(RED + "ERROR " + msg + NORMAL);
}

//-----------------------------------------------------------------------------
function initialize(cfg)
{
    return values;
}

//-----------------------------------------------------------------------------
module.exports = {
    name: cmd.PLUG_LOG,
    initialize: initialize,
    action : {},   

	verbose: verbose,
	normal: normal,
	history: history,
	error: error,
};
