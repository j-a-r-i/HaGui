/* global . */
var histories = [];
var errors = [];

function normal(msg)
{
	console.log(msg);
}

function history(msg)
{
	var d = new Date();
	histories.push(d.toLocaleString() + " " + msg);
	if (histories.length > 100)
		histories.shift();
		
	console.log(msg);
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
	normal: normal,
	history: history,
	error: error,
	
	getErrors: getErrors,
	getHistory: getHistory
};