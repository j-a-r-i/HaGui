"use strict";
/*
 * Copyright (C) 2015-6 Jari Ojanen
 *
 * See http://ilmatieteenlaitos.fi/tallennetut-kyselyt
 */

var fs = require("fs"),
    myhttp = require('./myhttp'),
    config = require('./config'),
    log = require('./log'),
    parser = require("xml2js").parseString;

var url = "http://data.fmi.fi/fmi-apikey/" + config.fmi_key + "/wfs?request=getFeature&storedquery_id=fmi::forecast::hirlam::surface::point::multipointcoverage&place=oittaa";

url += "&parameters=temperature,dewpoint,windspeedms,precipitation1h";

const FIELD_NONE = -1;
const FIELD_TEMP = 0;
const FIELD_DP = 1;
const FIELD_WIND = 2;
const FIELD_RAIN = 3;

//-----------------------------------------------------------------------------
class FmiField {
    constructor(fid, name) {
        this.fieldId = fid;
        this.name = name;
    }

    parse(arr) {
        if (this.fieldId == FIELD_NONE)
            return "";
        return parseFloat(arr[this.fieldId]);
    }
};


var FIELDS = [
    new FmiField(FIELD_NONE, "date"),
    new FmiField(FIELD_TEMP, "temp"),
    new FmiField(FIELD_DP,   "dp"),
    new FmiField(FIELD_WIND, "wind"),
    new FmiField(FIELD_RAIN, "rain")
];


//-----------------------------------------------------------------------------
// not used anymore
function findKey(data, key)
{
    var f = Object.keys(data);
    Object.keys(data).forEach(function(k) {
        if (k != "$") {               
            if (Array.isArray(data[k])) {
                data[k].forEach(function(i) {
                    findKey(i, key);
                });
            }
            else {
                findKey(data[k], key);
            }
        }
       console.log(key); 
    });
}

//-----------------------------------------------------------------------------
function parseXml(buf, cb)
{
    var arr;
    
    parser(buf, (err, result) => {
        if (err) {
            log.error("parseXml: " + err);
            return cb(err, null);
        }
        var d;
        var n = result;
        var path = ['wfs:FeatureCollection',
                    'wfs:member',
                    'omso:GridSeriesObservation',
                    'om:result',
                    'gmlcov:MultiPointCoverage'];
        
        for (let i=0; i<path.length; i++) {
            if (i === 0)
                n = n[path[i]];
            else
                n = n[path[i]][0];
            if (n === null) {
                log.error("Invalid FMI XML");
                return cb("Invalid FMI XML", null);
            }
        }
        
        d = n['gml:domainSet'][0];
        n = n['gml:rangeSet'][0];
        n = n['gml:DataBlock'][0];
        n = n['gml:doubleOrNilReasonTupleList'][0];
        
        arr = n.trim().split("\n");
        
        arr = arr.map((i) => { 
            i = i.trim();
            if (i.length === 0)
                return null;
            
            var ret = i.split(" ");
            
            return FIELDS.map(function(i) {
                return i.parse(ret);
            });
        });
        
        d = d['gmlcov:SimpleMultiPoint'][0];
        d = d['gmlcov:positions'][0];
        
        var arr2 = d.trim().split("\n");
        arr2 = arr2.map(function(i) { 
            i = i.trim();
            if (i.length === 0)
                return null;
                
            var ret = i.split(" ");
            
            return new Date(parseInt(ret[3])*1000);
        });
        
        var i;
        for (i=0; i<arr.length; i++) {
            if (arr[i] !== null)
                arr[i][0] = arr2[i];
        }
        //console.log(arr.length + " , " +  arr2.length);

        arr.unshift(FIELDS.map(function(i) {
            return i.name;
        }));
        cb(null, arr);
    });
}

//-----------------------------------------------------------------------------
function fmiReadFile(filename, cb)
{
    fs.readFile(filename, "utf8", (err, html) => {
        if (!!err) {
            log.error("fmiReadFile:" + err);
                return cb(err, null);
        }
            parseXml(html, cb);
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
function fmiRead(cb)
{
    myhttp.get(url, (err, html) => {
        if (!!err) {
            return cb(err, null);
    }
        parseXml(html, cb);
    });
}

//-----------------------------------------------------------------------------
module.exports = {
    fmiReadFile: fmiReadFile,
    fmiWriteFile: fmiWriteFile,
	fmiRead: fmiRead
};
