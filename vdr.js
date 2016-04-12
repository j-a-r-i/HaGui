"use strict";

var net = require('net'),
    rl  = require('readline'),
    fs  = require('fs'),
    config = require('./config.json');

// see https://www.linuxtv.org/vdrwiki/index.php/SVDRP
    
    
var PORT = 6419,
    HOST = config.vdrServer;

//------------------------------------------------------------------------------
class EpgData
{
    constructor() {
        this.C = "";
        this.E = "";
        this.T = "";
        this.S = "";
        this.D = "";
        //this.X = "";
        //this.V = "";
    }
    
    setItem(item, value) {
        if (['X','V'].indexOf(item) < 0) {  // not in list
            this[item] = value;
        }
    }  
}

//------------------------------------------------------------------------------
function download()
{
    var fout   = fs.createWriteStream("epg.dat");
    var socket = net.createConnection(PORT, HOST);

    socket.on('connect', () => {
        socket.write("LSTE\r\n");
        var reader = rl.createInterface({input: socket});
        reader.on('line', (line) => {
	        console.log("<" + line.substring(4) + ">");
            fout.write(line.substring(4) + "\n");
        })
        .on('close',  () => {
            fout.end();          
        });
        //}).on('end', function() {
        //  console.log('DONE');
    });
}

//------------------------------------------------------------------------------
function load()
{
    var reader = rl.createInterface({input: fs.createReadStream('epg.dat')});
    var list = [];
    var epg = new EpgData();
    reader.on('line', (line) => {
	    console.log("<" + line + ">");
        var cmd = line[0];
        if (cmd == 'e') {
            list.push(epg);
            epg = new EpgData();
        }
        else {
            epg.setItem(cmd, line.substring(2));
        }
    })
    .on('close', () => {
        console.log("done");
        console.log(epg);
    });
}

//------------------------------------------------------------------------------
download();
//load();

//------------------------------------------------------------------------------
//-----------------------------------------------------------------------------
module.exports = {
	download: download,
    load: load
};
