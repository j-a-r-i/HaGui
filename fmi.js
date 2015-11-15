"use strict";

// http://ilmatieteenlaitos.fi/tallennetut-kyselyt

var fs = require("fs");
var http = require('http');
var config = require('./config');
var parser = require("xml2js").parseString;

var url = "http://data.fmi.fi/fmi-apikey/" + config.fmi_key + "/wfs?request=getFeature&storedquery_id=fmi::forecast::hirlam::surface::point::multipointcoverage&place=oittaa";

url += "&parameters=temperature,dewpoint,windspeedms";

const FIELD_TEMP = 0;
const FIELD_DP = 1;
const FIELD_WIND = 2;


function read(url, callback)
{
    return http.get(url, function(res) {
        var body = '';
        res.on('data', function(d) {
            body += d;
        });
	res.on('error', function(e) {
	    callback(e, null);
	});
        res.on('end', function() {
	    callback(null, body);
        });
    });
    /*request(url, function(err, response, html) {
        if (!!err) {
            return callback(err, html);
        }
        callback(null, html);
    });*/
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
        var d;
        var n = result['wfs:FeatureCollection'];
        n = n['wfs:member'][0];
        n = n['omso:GridSeriesObservation'][0];
        n = n['om:result'][0];
        n = n['gmlcov:MultiPointCoverage'][0];
        d = n['gml:domainSet'][0];
        n = n['gml:rangeSet'][0];
        n = n['gml:DataBlock'][0];
        n = n['gml:doubleOrNilReasonTupleList'][0];
        
        var arr = n.split("\n");
        
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
        
        var arr2 = d.split("\n");
        arr2 = arr2.map(function(i) { 
            i = i.trim();
            if (i.length === 0)
                return null;
                
            var ret = i.split(" ");
            
            return new Date(parseInt(ret[3])*1000);
        });
        
        var i;
        for (i=0; i<arr.length; i++) {
            if (arr[i] != null)
                arr[i].date = arr2[i];
        }
        console.log(arr.length + " , " +  arr2.length);
    });
    return 0;
}


if (true) {
    var buf = fs.readFileSync("wfs.xml", "utf8");
    parseXml(buf);
}
else {
    read(url, function(err, html) {
        fs.writeFile("wfs.xml", html, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("wfs.xml was saved!");
        }); 
        console.log(err);
        parseXml(html);
    });
}
