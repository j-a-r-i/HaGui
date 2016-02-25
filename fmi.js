"use strict";
/*
 * Copyright (C) 2015 Jari Ojanen
 */
// http://ilmatieteenlaitos.fi/tallennetut-kyselyt

var fs = require("fs"),
    myhttp = require('./myhttp'),
    config = require('./config'),
    parser = require("xml2js").parseString;

var url = "http://data.fmi.fi/fmi-apikey/" + config.fmi_key + "/wfs?request=getFeature&storedquery_id=fmi::forecast::hirlam::surface::point::multipointcoverage&place=oittaa";

url += "&parameters=temperature,dewpoint,windspeedms";

const FIELD_TEMP = 0;
const FIELD_DP = 1;
const FIELD_WIND = 2;

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
    
    parser(buf, function(err, result) {
        if (err)
            cb(err, null);

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
            if (n === null) 
                return cb("Invalid XML", null);
        }
        
        d = n['gml:domainSet'][0];
        n = n['gml:rangeSet'][0];
        n = n['gml:DataBlock'][0];
        n = n['gml:doubleOrNilReasonTupleList'][0];
        
        arr = n.trim().split("\n");
        
        arr = arr.map(function(i) { 
            i = i.trim();
            if (i.length === 0)
                return null;
                
            var ret = i.split(" ");
            
            return {date: "",
                    temp: ret[FIELD_TEMP],
                    wind: ret[FIELD_WIND],
                    dp: ret[FIELD_DP]};
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
                arr[i].date = arr2[i];
        }
        //console.log(arr.length + " , " +  arr2.length);
    });
    cb(null, arr);
}

//-----------------------------------------------------------------------------
function fmiRead(simulated, cb)
{
    if (simulated === true) {
        fs.readFile("wfs.xml", "utf8", function(err, html) {
            if (!!err) 
                return cb(err, null);
            parseXml(html, cb);
        });        
    }
    else {
        myhttp.get(url, function(err, html) {
            if (!!err) {
                return cb(err, null);
            }
    /*        fs.writeFile("wfs.xml", html, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("wfs.xml was saved!");
            });*/
            parseXml(html, cb);
        });
    }
}

//-----------------------------------------------------------------------------
module.exports = {
	fmiRead: fmiRead,
};
