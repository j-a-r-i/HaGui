"use strict";
/*
 * Copyright (C) 2015-7 Jari Ojanen
 *
 * See http://ilmatieteenlaitos.fi/tallennetut-kyselyt
 */

var fs = require("fs"),
    myhttp = require('./myhttp'),
    config = require('./config'),
    log = require('./log'),
    cmd = require('./commands'),
    v   = require('./var'),
    sax = require('sax'),
    qstr= require('querystring');

const SITE = "data.fmi.fi";
const PATH = "/fmi-apikey/" + config.fmi_key + "/wfs?";

var url = "http://data.fmi.fi/fmi-apikey/" + config.fmi_key + "/wfs?request=getFeature&storedquery_id=fmi::forecast::hirlam::surface::point::multipointcoverage&place=oittaa";

var values = [
    new v.MValue("w_temp"),
    new v.MValue("w_dp"),
    new v.MValue("w_wind"),
    new v.MValue("w_rain")
];

url += "&parameters=temperature,dewpoint,windspeedms,precipitation1h";

//-----------------------------------------------------------------------------
async function parseXml(buf)
{
    return new Promise(function(resolve,reject) {
        var parser = sax.parser(true);
        var tags = [];
        var match1 = "wfs:FeatureCollection/wfs:member/omso:GridSeriesObservation/om:result/gmlcov:MultiPointCoverage/gml:domainSet/gmlcov:SimpleMultiPoint/gmlcov:positions",
            match2 = "wfs:FeatureCollection/wfs:member/omso:GridSeriesObservation/om:result/gmlcov:MultiPointCoverage/gml:rangeSet/gml:DataBlock/gml:doubleOrNilReasonTupleList";
        var arr1, arr2;

        parser.onerror = function(e) {
            log.error(e);
            return reject(e);
        };
        parser.ontext = function(t) {
            if (tags.length === 8) {
                var curTag = tags.join("/");

                if (curTag === match1) {
                    arr1 = t.trim().split('\n');
                }
                else if (curTag === match2) {
                    arr2 = t.trim().split('\n');
                }
            }
        };
        parser.onopentag = function(node) {
            tags.push(node.name);
        };
        parser.onclosetag = function(node) {
            tags.pop();
        };
        parser.onend = function() {
            var arr = arr1.forEach(function(item, i) {
                var part1 = item.trim().split(' '),
                    part2 = arr2[i].trim().split(' ');
		console.log(parseInt(part1[3])*1000, part2);
                /*var epoc = parseInt(part1[3] * 1000);
                part2 = part2.map((item, j) => {
                    values[j].set(parseFloat(item), epoc);
                });*/
                return [parseInt(part1[3])] + arr2.map(parseFloat);
            });

            resolve(arr);
        };
        parser.write(buf).close();
    });
}


async function writeFile(filename, contents)
{
    return new Promise((resolve,reject) => {
        fs.writeFile(filename, contents, (err) => {
            if (!!err) {
                log.error("fs.writeFile:" + err);
                return reject(err);
            }
            log.verbose(filename + " was saved!");
            resolve([]);
        });
    });	
}
async function readFile(filename)
{
    return new Promise((resolve,reject) => {
        fs.readFile(filename, "utf8", (err,contents) => {
            if (!!err) {
                log.error("fs.readFile " + filename + ": " + err);
                return reject(err);
            }
            log.verbose(filename + " was red!");
            resolve(contents);
        });
    });	
}

//-----------------------------------------------------------------------------
async function fmiReadFile(filename)
{
    let html = await readFile(filename);
    let resp = await parseXml(html);

    console.log(resp);
}


//-----------------------------------------------------------------------------
async function fmiWriteFile(filename)
{
    var qstring = qstr.stringify({request:        'getFeature',
				  storedquery_id: 'fmi::forecast::hirlam::surface::point::multipointcoverage',
				  place:          'oittaa',
				  parameters:     'temperature,dewpoint,windspeedms,precipitation1h'});
    
    var opt = { host: SITE,
                path: PATH + qstring,
                port: 80,
                method: 'GET'
              };

    console.log("http://"+SITE+PATH+qstring);
    
    //var html = await myhttp.requests(opt);
    var html = await myhttp.getp("http://"+SITE+PATH+qstring);

    await writeFile(filename, html);
}

fmiReadFile("test.fmi");

//-----------------------------------------------------------------------------
function fmiRead()
{
    myhttp.getp(url)
    .then((html) => {
        return parseXml(html);
    })
    .then((data) => {
        gWeather = data;
    })
    .catch((err) => {
        log.error(err);
    });
}

//-----------------------------------------------------------------------------
function initialize(cfg)
{
    read();

    return values;
}

function read()
{
}

function readSim()
{
    // Read simulated FMI data.
    //
    fmiReadFile("wfs.xml")
    .then( (html) => {
        return parseXml(html);
    })
    .then( (data) => {
        //gWeather = data;
    })
    .catch((err) => {
        log.error(err);
    })
}

//-----------------------------------------------------------------------------
module.exports = {
    name: cmd.PLUG_FMI,
    initialize: initialize,
    action: { read: read,
              readSim: readSim },

    fmiReadFile: fmiReadFile,
    fmiWriteFile: fmiWriteFile,
	fmiRead: fmiRead
};
