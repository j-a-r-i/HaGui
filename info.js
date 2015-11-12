// https://nodejs.org/api/child_process.html
//
var exec = require('child_process').exec;


var c1 = exec("df", function (error, stdout, stderr) {
    if (error !== null) {
        console.log('ERROR: ' + error);
        return;
    }
    console.log('stdout: ' + stdout);
});


var c2 = exec("ps", function (error, stdout, stderr) {
    if (error !== null) {
        console.log('ERROR: ' + error);
        return;
    }
    console.log('stdout: ' + stdout);
});


var c3 = exec("free", function (error, stdout, stderr) {
    if (error !== null) {
        console.log('ERROR: ' + error);
        return;
    }
    console.log('stdout: ' + stdout);
});
