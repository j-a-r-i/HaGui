/*
 * Copyright (C) 2015-6 Jari Ojanen
 */

/** Store for history objects. History is for action changes.
 */
var histories = [];

/** Store for error strings (objects in future).
 */
var errors = [];

var RED    = '\u001b[31m';
var NORMAL = '\u001b[39m';

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
    return JSON.stringify(dstr + " " + tstr + " " + item.action + " " + item.state);
}

/** Add string to history.
 *
 * @param {Object} obj Message to be logged
 */
function history(obj)
{
    //var d = new Date();
    //var s = d.toISOString().slice(5,19) + " " + msg;
    //var s = d.toLocaleString() + " " + msg;
    
    histories.push(obj);
    if (histories.length > 100)
	histories.shift();
		
    console.log(getHistoryString(obj));
}

/** Add string to log (error level).
 *
 * @param {string} msg Error to be logged
 */
function error(msg)
{
	errors.push(msg);
	if (errors.length > 100)
		errors.shift();
		
	console.log(RED + "ERROR " + msg + NORMAL);
}

function getErrors()
{
	return errors;
}

function getHistory()
{
    return histories.map((i) => {
        return getHistoryString(i);
    });
}

//-----------------------------------------------------------------------------
module.exports = {
	verbose: verbose,
	normal: normal,
	history: history,
	error: error,
	
	getErrors: getErrors,
	getHistory: getHistory
};
