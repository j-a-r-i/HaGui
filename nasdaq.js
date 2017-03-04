"use strict";
/*
 * Copyright (C) 2016-7 Jari Ojanen
 * 
 * SITE + /webproxy/DataFeedProxy.aspx?Subsystem=History&Action=GetDataSeries&Instrument=HEX24271&FromDate=2015-10-01
 * SITE + /webproxy/DataFeedProxy.aspx?Subsystem=Prices&Action=GetInstrument&Instrument=HEX24271
 */
var myhttp = require('./myhttp'),
    myxml  = require('./myxml'),
    log    = require('./log'),
    cmd    = require('./commands'),
    v      = require('./var');

const stocks = [ 
    new v.MValue('HEX24249'), // Citycon
    new v.MValue('HEX24271'), // Fortum
    new v.MValue('HEX24311'), // Nokia
    new v.MValue('HEX24332'), // Ponsse
    new v.MValue('HEX69423'), // Aktia A
    new v.MValue('HEX24308'), // Nordea
    new v.MValue('HEX36695'), // Outotec
    new v.MValue('HEX24381'), // TeliaSonera
    new v.MValue('HEX35363')  // Orion B
];

const SITE = "www.nasdaqomxnordic.com";


// returns Promise for downloading data from nasdaqomxnordic site.
//
function download(path) {
    var opt = { host: SITE,
                path: '/webproxy/DataFeedProxy.aspx?Subsystem=' + path,
                port: 443,
                method: 'GET'
                };
    return myhttp.requests(opt, false);
}

//-----------------------------------------------------------------------------
function history()
{
    var items = stocks.map((mval) => {
        return download('History&Action=GetDataSeries&Instrument=' + mval.name + '&FromDate=2017-01-01');
    });

    Promise.all(items)
    .then((data) => {
        var result = data.map((r) => {
            return myxml.parseXmlTags(r, 'response/hi');
        });
        return Promise.all(result);
    })
    .then((data) => {
        var result = [];
        var len1 = data[0].length;
        var len2 = data.length;

        for (let i1=0; i1<data[0].length; i1++) {
            var date = data[0][i1].dt;
            for (let i2=0; i2<data.length; i2++) {
                var value = parseFloat(data[i2][i1].cp);
                stocks[i2].set(value, date);
            }
        }
        resolve(true);
    })
    .catch((err) => {
        log.error(err);
    });
}

//-----------------------------------------------------------------------------
function prices()
{
    var items = stocks.map((mval) => {
        return download('Prices&Action=GetInstrument&Instrument=' + mval.name);
    });

    Promise.all(items)
    .then((data) => {
        var result = data.map((r) => {
            return myxml.parseXmlTags(r, 'response/inst');
        });
        return Promise.all(result);
    })
    .then((data) => {
        data.forEach((inst) => {
            console.log(inst[0].fnm, inst[0].nm, inst[0].t, inst[0].bp);
        });
    })
    .catch((err) => {
        log.error(err);
    }); 
}

//-----------------------------------------------------------------------------
function initialize(cfg)
{
    //history();

    return stocks;
}



//-----------------------------------------------------------------------------
module.exports = {
    name: cmd.PLUG_NASDAQ,
    initialize: initialize,
    action: {
        read: () => { history(); },
        readSim: () => { }
    }
};
