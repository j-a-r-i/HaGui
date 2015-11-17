var messages = [];

function normal(msg)
{
	console.log(msg);
}


function error(msg)
{
	messages.push(msg);
	console.log(msg);
}

//-----------------------------------------------------------------------------
module.exports = {
	normal: normal,
	error: error
};