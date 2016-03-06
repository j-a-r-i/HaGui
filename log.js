/*
 * Copyright (C) 2015 Jari Ojanen
 */

var histories = [];
var errors = [];

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

/** Add string to history.
 *
 * @param {Date}   d   Time when event happend
 * @param {string} msg Message to be logged
 */
function history(d, msg)
{
	//var d = new Date();
    //var s = d.toISOString().slice(5,19) + " " + msg;
    var s = d.toLocaleString() + " " + msg;
    
	histories.push(s);
	if (histories.length > 100)
		histories.shift();
		
	console.log(s);
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
		
	console.log(msg);
}

function getErrors()
{
	return errors;
}

function getHistory()
{
	return histories;
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
