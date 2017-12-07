"use strict";

var net = require('net'),
    rl  = require('readline'),
    fs  = require('fs'),
    log = require('./log'),
    cmd = require('./commands'),
    config = require('./config.json');

// see https://www.linuxtv.org/vdrwiki/index.php/SVDRP

var PORT = 6419,
    HOST = config.vdrServer,
    FILENAME = 'epg.dat';

var gList = [];

var INVALID_CHANNELS = [
    "MTV Juniori",
    "MTV Leffa",
    "0700 11111 deitti",
    "Estradi",
    "Nelonen Maailma",
    "Nelonen Pro 1",
    "Nelonen Pro 2",
    "Iskelmä/Harju&Pöntinen",
    "Discovery",
    "Eurosport",
    "Nelonen Prime",
    "Digiviihde.fi K-18 01.00-06.00",
    "Disney Channel",
    "MTV MAX",
    "Yle Puhe",
    "Nelonen Nappula",
    "C More First",
    "C More Series",
    "Yle Klassinen",
    "Yle Mondo",
    "MTV Sport 1",
    "MTV",   // music tv
    "Nick Jr."
];

var INVALID_PROGRAM = [
    "Ei ohjelmaa",
    "Textnytt",
    "Uutisikkuna",
];

const EPG_CHANNEL = 'C';
const EPG_ENTRY   = 'E';
const EPG_TITLE   = 'T';
const EPG_SHORTTXT = 'S';
const EPG_DESCRIPTION = 'D';
const EPG_STREAM = 'X';
const EPG_VPS = 'V';
const EPG_END_CHANNEL = 'c';
const EPG_END_ENTRY = 'e';
const EPG_GENRE = 'G';


//------------------------------------------------------------------------------
class EpgData
{
    constructor() {
        this.C = "";
        this.E = "";
        this.T = "";
        this.S = "";
        this.D = "";
        //this.G = "";
        //this.X = "";
        //this.V = "";
    }
    
    isValid() {
        if (this.T.indexOf("Ei lähetystä") === 0)
            return false;
        if (INVALID_PROGRAM.indexOf(this.T) > -1)
            return false;
        return true;
    }

    setItem(item, value) {
        if ([EPG_STREAM, EPG_VPS, EPG_GENRE].indexOf(item) < 0) {  // not in list
            this[item] = value;
        }
    }  
}

//------------------------------------------------------------------------------
function download()
{
    var fout   = fs.createWriteStream(FILENAME);
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
        //}).on('end', () => {
        //  console.log('DONE');
    });
}

//------------------------------------------------------------------------------
function load(cbDone)
{
    var reader = rl.createInterface({input: fs.createReadStream(FILENAME)});
    var epg = new EpgData();
    var channel = '';
    reader.on('line', (line) => {
	    //console.log("<" + line + ">");
        var cmd = line[0];
        if (cmd == EPG_END_ENTRY) {
            if ((channel.length > 0) && epg.isValid()) {
                epg.C = channel;
                gList.push(epg);
            }
            epg = new EpgData();
        }
        else if (cmd == EPG_CHANNEL) {
            var regex = /C T\-([0-9\-]*) (.*)/g;
            var match = regex.exec(line);
            channel = match[2];
            if (INVALID_CHANNELS.indexOf(channel) > -1) {
                channel = '';
            }
        }
        else {
            if (channel.length > 0) {
                epg.setItem(cmd, line.substring(2));
            }
        }
    })
    .on('close', () => {
        gList.push(epg);
        cbDone();
    });
}

//------------------------------------------------------------------------------
//download();
load(() => {
    gList.forEach((e) => {
        if (e.C.length > 0)
            console.log(e.C + "- " + e.T);
    });
    process.exit(0);
});
//load();

//-----------------------------------------------------------------------------
function initialize(cfg)
{
    return [];
}

//-----------------------------------------------------------------------------
function read()
{
    log.normal("read vdr");
}

//------------------------------------------------------------------------------
//-----------------------------------------------------------------------------
module.exports = {
    name: cmd.PLUG_VDR,
    initialize: initialize,
    read: read,

 	download: download,
    load: load
};
