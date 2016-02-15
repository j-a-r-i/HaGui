var net = require('net');

var gClient = new net.Socket(),
    gTimer;

gClient.connect(8001, '192.168.100.40', function() {
    console.log('Connected');
    //gClient.write('command1');
    gTimer1 = setInterval(timer, 1000);
});

gClient.on('data', function(data) {
    console.log('Received: ' + data);
//    gClient.destroy(); // kill client after server's response
});

gClient.on('close', function() {
    console.log('Connection closed');
});


function timer()
{
    gClient.write("command");
}


