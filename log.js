/*
 * Copyright (C) 2015 Jari Ojanen
 */

var histories = [];
var errors = [];

function verbose(msg)
{
	// do nothing	
}

function normal(msg)
{
	console.log(msg);
}

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