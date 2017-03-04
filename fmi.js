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
    sax = require('sax');

var url = "http://data.fmi.fi/fmi-apikey/" + config.fmi_key + "/wfs?request=getFeature&storedquery_id=fmi::forecast::hirlam::surface::point::multipointcoverage&place=oittaa";

var values = [
    new v.MValue("w_temp"),
    new v.MValue("w_dp"),
    new v.MValue("w_wind"),
    new v.MValue("w_rain")
];

url += "&parameters=temperature,dewpoint,windspeedms,precipitation1h";

//-----------------------------------------------------------------------------
function parseXml(buf)
{
    return new Promise((resolve,reject) => {
        var parser = sax.parser(true);
        var tags = [];
        var match1 = "wfs:FeatureCollection/wfs:member/omso:GridSeriesObservation/om:result/gmlcov:MultiPointCoverage/gml:domainSet/gmlcov:SimpleMultiPoint/gmlcov:positions",
            match2 = "wfs:FeatureCollection/wfs:member/omso:GridSeriesObservation/om:result/gmlcov:MultiPointCoverage/gml:rangeSet/gml:DataBlock/gml:doubleOrNilReasonTupleList";
        var arr1, arr2;

        parser.onerror = (e) => {
            log.error(e);
            return reject(e);
        };
        parser.ontext = (t) => {
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
        parser.onopentag = (node) => {
            tags.push(node.name);
        };
        parser.onclosetag = (node) => {
            tags.pop();
        };
        parser.onend = () => {
            var arr = arr1.map((item, i) => {
                var part1 = item.trim().split(' '),
                    part2 = arr2[i].trim().split(' ');
                var epoc = parseInt(part1[3] * 1000);
                part2 = part2.map((item, j) => {
                    values[j].set(parseFloat(item), epoc);
                });
                return [];
            });

            resolve(arr);
        };
        parser.write(buf).close();
    });
}


//-----------------------------------------------------------------------------
function fmiReadFile(filename)
{
    return new Promise((resolve,reject) => {
        fs.readFile(filename, "utf8", (err, html) => {
            if (!!err) {
                log.error("fmiReadFile" + filename + ": " + err);
                return reject(err);
            }
            resolve(html);
        });
    });
}

//-----------------------------------------------------------------------------
function fmiWriteFile(filename, cb)
{
    myhttp.get(url, (err, html) => {
        if (!!err) {
            log.error("fmiWriteFile:" + err);
            return cb(err, null);
        }
        fs.writeFile(filename, html, function(err) {
            if(err) {
                log.error("fmiWriteFile:" + err);
                return cb(err, null);
                }
            log.verbose(filename + " was saved!");
            cb(null, html);
        });
    });
}

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
