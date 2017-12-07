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
    v      = require('./var'),
    qstr   = require('querystring');

const stocks = [ 
    new v.MValue('24249'), // Citycon
    new v.MValue('24271'), // Fortum
    new v.MValue('24311'), // Nokia
    new v.MValue('24332'), // Ponsse
    new v.MValue('69423'), // Aktia A
    new v.MValue('24308'), // Nordea
    new v.MValue('36695'), // Outotec
    new v.MValue('24381'), // TeliaSonera
    new v.MValue('35363')  // Orion B
];

const SITE = "www.nasdaqomxnordic.com";


//-----------------------------------------------------------------------------
// returns Promise for downloading data from nasdaqomxnordic site.
//
async function download(system, action, instrument)
{
    var qstring = qstr.stringify({Subsystem : system,
				  Action : 'Get'+action,
				  Instrument: 'HEX' + instrument});

    if (system === 'History') {
	qstring = qstring + '&FromDate=2017-10-01';
    }
				  
    var opt = { host: SITE,
                path: '/webproxy/DataFeedProxy.aspx?' + qstring,
                port: 443,
                method: 'GET'
                };
    return await myhttp.requests(opt, false);
}

//-----------------------------------------------------------------------------
async function history()
{
    for (let mval of stocks) {
	let xml = await download('History', 'DataSeries', mval.name);

	let data = await myxml.parseXmlTags(xml, 'response/hi');

	mval.clearHistory();
	data.forEach( (i) => {
	    mval.set( parseFloat(i.cp),
		      new Date(i.dt) );
	});
    }
}

//-----------------------------------------------------------------------------
async function prices()
{
    for (let mval of stocks) {
	let data = await download('Prices', 'Instrument', mval.name);

	let result = await myxml.parseXmlTags(data, 'response/inst');
	//console.log(result);
	console.log(result[0].fnm, result[0].nm, result[0].t, result[0].bp);
    }
}

//history();
//prices();

//-----------------------------------------------------------------------------
module.exports = {
    name: cmd.PLUG_NASDAQ,
    initialize: (cfg) => { return stocks; },
    action: {
        read: () => { history(); },
        readSim: () => { }
    }
};
