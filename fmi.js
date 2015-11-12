"use strict";

// http://ilmatieteenlaitos.fi/tallennetut-kyselyt

var fs = require("fs");
var request = require('request');
var config = require('./config');
var parser = require("xml2js").parseString;

var url = "http://data.fmi.fi/fmi-apikey/" + config.fmi_key + "/wfs?request=getFeature&storedquery_id=fmi::forecast::hirlam::surface::point::multipointcoverage&place=oittaa";

url += "&parameters=temperature,humidity,dewpoint,windspeedms";

const FIELD_TEMP = 1;
const FIELD_WIND = 5;
const FIELD_DP = 10;


function read(url, callback)
{
    request(url, function(err, response, html) {
        if (!!err) {
            return callback(err, html);
        }
        callback(null, html);
    });
}

function findKey(data, key)
{
    var f = Object.keys(data);
    Object.keys(data).forEach(function(k) {
        if (k != "$") {               
            if (Array.isArray(data[k])) {
                data[k].forEach(function(i) {
                    findKey(i, key);
                })
            }
            else {
                findKey(data[k], key);
            }
        }
       console.log(key); 
    });
}

function parseXml(buf, cb)
{
    parser(buf, function(err, result) {
        if (err)
            return console.log(err);
        //findKey(result, "gmlcov:MultiPointCoverage");
        
        var n = result['wfs:FeatureCollection'];
        n = n['wfs:member'][0];
        n = n['omso:GridSeriesObservation'][0];
        n = n['om:result'][0];
        n = n['gmlcov:MultiPointCoverage'][0];
        n = n['gml:rangeSet'][0];
        n = n['gml:DataBlock'][0];
        n = n['gml:doubleOrNilReasonTupleList'][0];
        
        var arr = n.split("\n");
        
        arr = arr.map(function(i) { 
            i = i.trim();
            if (i.length === 0)
                return null;
                
            var ret = i.split(" ");
            
            return {temp: ret[FIELD_TEMP],
                    wind: ret[FIELD_WIND],
                    dp: ret[FIELD_DP]};
        });
        
        console.log(result['wfs:FeatureCollection']);
    });
    return 0;
}


if (true) {
    var buf = fs.readFileSync("wfs.xml", "utf8");
    parseXml(buf);
}
else {
    read(url, function(err, html) {
        console.log(err);
        parseXml(html);
    });
}