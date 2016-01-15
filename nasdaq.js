"use strict";
/*
 * Copyright (C) 2016 Jari Ojanen
 */
var xml2js = require('xml2js'),
    myhttp   = require('./myhttp'),
    parser = new xml2js.Parser();

const stocks = [
    'HEX24249', // Citycon
    'HEX24271', // Fortum
    'HEX24311', // Nokia
    'HEX24332', // Ponsse
    'HEX69423', // Aktia A
    'HEX24308', // Nordea
    'HEX36695', // Outotec
    'HEX24381', // TeliaSonera
    'HEX35363', // Orion B
];

const SITE = "http://www.nasdaqomxnordic.com";

//-----------------------------------------------------------------------------
class Nasdaq {
    contructor() {
        this.name = "nasdaq";
        this.result = [];
    }

    download() {
        var self = this;
        return new Promise((resolve,reject) => {
            var items = stocks.map((code) => {
                return myhttp.getp(SITE + '/webproxy/DataFeedProxy.aspx?Subsystem=Prices&Action=GetInstrument&Instrument=' + code);
            });

            Promise.all(items)
            .then((values) => {
                self.result = [];
                values.map((obj) => {
                    parser.parseString(obj, (err, result) => {
                        if (!!err) {
                            console.log(err.message);
                        }
                        var inst = result.response.inst[0].$;

                        self.result.push([inst.fnm, parseFloat(inst.cp)]);
                    });     
                });
                resolve(self.result);
            });
        });
    }
}

//SITE + /webproxy/DataFeedProxy.aspx?Subsystem=History&Action=GetDataSeries&Instrument=HEX24271&FromDate=2015-10-01
//SITE + /webproxy/DataFeedProxy.aspx?Subsystem=Prices&Action=GetInstrument&Instrument=HEX24271

//-----------------------------------------------------------------------------
module.exports = {
	Nasdaq: Nasdaq,
};