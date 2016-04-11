var net = require('net'),
    rl  = require('readline'),
    config = require('./config.json'),

// see https://www.linuxtv.org/vdrwiki/index.php/SVDRP
    

    
var PORT = 6419,
    HOST = config.vdrServer;
    
var socket = net.createConnection(PORT);

console.log('Socket created.');
//socket.on('data', function(data) {
//    // Log the response from the HTTP server.
//    //var arr = data.split('\n');
//    console.log(data.length);
//})
socket.on('connect', () => {
    // Manually write an HTTP request.
    socket.write("LSTE\r\n");
    var reader = rl.createInterface({input: socket});
    reader.on('line', (line) => {
	console.log("<" + line.substring(4) + ">");
    });
//}).on('end', function() {
//  console.log('DONE');
});
