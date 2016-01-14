"use strict";
/*
 * Copyright (C) 2016 Jari Ojanen
 */
var xml2js = require('xml2js'),
    myhttp   = require('./myhttp'),
    parser = new xml2js.Parser();

var stocks = [
    {id: 'HEX24249', name: 'Citycon',     value: 0.0},
    {id: 'HEX24271', name: 'Fortum',      value: 0.0},
    {id: 'HEX24311', name: 'Nokia',       value: 0.0},
    {id: 'HEX24332', name: 'Ponsse',      value: 0.0},
    {id: 'HEX69423', name: 'Aktia A',     value: 0.0},
    {id: 'HEX24308', name: 'Nordea',      value: 0.0},
    {id: 'HEX36695', name: 'Outotec',     value: 0.0},
    {id: 'HEX24381', name: 'TeliaSonera', value: 0.0},
    {id: 'HEX35363', name: 'Orion B',     value: 0.0},
]

//-----------------------------------------------------------------------------
function current(id)
{
    var ret = 0.0;
    
    stocks.forEach(function(i) {
        if (i.name === id) {
            ret = i.value;
        }
    });
    return ret;
}

//-----------------------------------------------------------------------------
function parse(xml)
{
    return new Promise((resolve,reject) => {
	    parser.parseString(xml, (err, result) => {
            if (!!err) {
		        console.log(err.message);
                reject(err);
            }
	        var inst = result.response.inst[0].$;

	        resolve(parseFloat(inst.cp));
	    });
    });
}

//-----------------------------------------------------------------------------
var counter = stocks.length;

var items = stocks.map((obj) => {
    return myhttp.getp('http://www.nasdaqomxnordic.com/webproxy/DataFeedProxy.aspx?Subsystem=Prices&Action=GetInstrument&Instrument=' + obj.id);
});

Promise.all(items).then((values) => {
    var res = [];
    values.map((obj) => {
	    parser.parseString(obj, (err, result) => {
            if (!!err) {
		        console.log(err.message);
            }
	        var inst = result.response.inst[0].$;

	        res.push([inst.fnm, parseFloat(inst.cp)]);
	    });     
    });
    console.log(res);
});

/*
stocks.forEach((i) => {
    var url = 'http://www.nasdaqomxnordic.com/webproxy/DataFeedProxy.aspx?Subsystem=Prices&Action=GetInstrument&Instrument=' + i.id;

    myhttp.get(url, function(err, xml) {
        if (!!err) {
            return console.log(err.message);
        }
	    parser.parseString(xml, function(err, result) {
            if (!!err) {
		        return console.log(err.message);
            }
	        var inst = result.response.inst[0].$;

	        i.value = parseFloat(inst.cp);
	    
	        counter--;
	        if (counter == 0) {
		        console.log(stocks);
	        }
	    });
    });
});
*/
//http://www.nasdaqomxnordic.com/webproxy/DataFeedProxy.aspx?Subsystem=History&Action=GetDataSeries&Instrument=HEX24271&FromDate=2015-10-01
//http://www.nasdaqomxnordic.com/webproxy/DataFeedProxy.aspx?Subsystem=Prices&Action=GetInstrument&Instrument=HEX24271
