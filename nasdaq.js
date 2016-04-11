"use strict";
/*
 * Copyright (C) 2016 Jari Ojanen
 */
var xml2js = require('xml2js'),
    myhttp   = require('./myhttp'),
    log = require('./log'),
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

const SITE = "www.nasdaqomxnordic.com";

//-----------------------------------------------------------------------------
/** Interface to read stock data.
 */
class Nasdaq {
    contructor() {
        this.name = "nasdaq";
        this.result = [];
    }

    history() {
        var self = this;
        return new Promise((resolve,reject) => {
            var items = stocks.map((code) => {
                var opt = { host: SITE,
                            path: '/webproxy/DataFeedProxy.aspx?Subsystem=History&Action=GetDataSeries&Instrument=' + code + '&FromDate=2016-03-01',
                            port: 443,
                            method: 'GET'
                          };
                return myhttp.requests(opt, false);
            });

            Promise.all(items)
            .catch((error) => {
                log.error(error);
            })
            .then((values) => {
                self.result = {};
                values.map((obj) => {
                    parser.parseString(obj, (err, result) => {
                        if (!!err) {
                            log.error(err.message);
                        }
                        result.response.hi.forEach((i) => {
                            var key = i.$.dt;
                            var val = parseFloat(i.$.cp);
                            
                            if (key in self.result) {
                                self.result[key].push(val);
                            }
                            else {
                                self.result[key] = [key, val];
                            }
                        });
                    });     
                });
                var header = ['Date'].concat(stocks);
                var values = Object.keys(self.result).map(key => self.result[key]);
                values.unshift(header);
                resolve(values);
            });
        });
    }
    
    download() {
        var self = this;
        return new Promise((resolve,reject) => {
            var items = stocks.map((code) => {
                var opt = { host: SITE,
                            path: '/webproxy/DataFeedProxy.aspx?Subsystem=Prices&Action=GetInstrument&Instrument=' + code,
                            port: 443,
                            method: 'GET'
                          };
                return myhttp.requests(opt, false);
            });

            Promise.all(items)
            .catch((error) => {
                log.error(error);
            })
            .then((values) => {
                self.result = {};
                values.map((obj) => {
                    parser.parseString(obj, (err, result) => {
                        if (!!err) {
                            log.error(err.message);
                        }
                        var inst = result.response.inst[0].$;
                        var name = inst.fnm;
                        
                        if (name.indexOf(' ') > 0) {
                            name = name.substring(0, name.indexOf(' '));
                        }
                        self.result[name] = parseFloat(inst.bp);
                    });     
                });
                resolve(self.result);
            });
        });
    }
}

//SITE + /webproxy/DataFeedProxy.aspx?Subsystem=History&Action=GetDataSeries&Instrument=HEX24271&FromDate=2015-10-01
//SITE + /webproxy/DataFeedProxy.aspx?Subsystem=Prices&Action=GetInstrument&Instrument=HEX24271

/*var n = new Nasdaq();

n.history().then((result) => {
    console.log(result);
});*/


//-----------------------------------------------------------------------------
module.exports = {
	Nasdaq: Nasdaq,
};
