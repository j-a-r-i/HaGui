// https://nodejs.org/api/child_process.html
//
var exec = require('child_process').exec,
    fs   = require('fs')

const MEMINFO = '/proc/meminfo';
const LOADAVG = '/proc/loadavg';

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
    var data = fs.readFileSync(MEMINFO).toString().trim();
    data.split("\n").forEach(function (line) {
        var arr = line.split(':');
        arr[0] = arr[0].replace('(', '_');
        arr[0] = arr[0].replace(')', '');
        if (arr.length === 2) {
            minfo[arr[0]] = parseInt(arr[1]);
        }
    });
    return minfo;
}

//-----------------------------------------------------------------------------
function loadavg()
{
    var line = fs.readFileSync(LOADAVG).toString();
    return line.trim().split(" ");
}

//-----------------------------------------------------------------------------
module.exports = {
	meminfo: meminfo,
	loadavg: loadavg
};