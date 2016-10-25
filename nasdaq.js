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
        this.result = {};
    }

    // returns Promise for downloading data from nasdaqomxnordic site.
    //
    download(path) {
        var opt = { host: SITE,
                    path: '/webproxy/DataFeedProxy.aspx?Subsystem=' + path,
                    port: 443,
                    method: 'GET'
                    };
        return myhttp.requests(opt, false);
    }
    
    parseHistory(xml) {
        return new Promise((resolve, reject) => {
            var self = this;
            parser.parseString(xml, (err, result) => {
                if (err) {
                    return reject(err);
                }
                var res = {};
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
                //var foo = self.result;
                resolve(res);
            });
        });
    }

    historyItem(code) {
        return this.download('History&Action=GetDataSeries&Instrument=' + code + '&FromDate=2016-05-01')
                .then((xml) => {
                    return this.parseHistory(xml);
                })
                .catch((err) => {
                    log.error("NasDaq.historyItem:" + err);
                });        
    }
    
    history() {
        var self = this;
        this.result = {};
        return new Promise((resolve,reject) => {
            var items = stocks.map(self.historyItem.bind(self));

            Promise.all(items)
            .then((values) => {
                var header = ['Date'].concat(stocks);
                var values = Object.keys(self.result).map(key => self.result[key]);
                values.unshift(header);
                resolve(values);
            })
            .catch((error) => {
                log.error("NasDaq.history:" + error);
                reject(error);
            });
        });
    }
    
    parsePrices(xml) {
        return new Promise((resolve, reject) => {
            var self = this;
            parser.parseString(xml, (err, result) => {
                if (err) {
                    return reject(err);
                }
                var inst = result.response.inst[0].$;
                var name = inst.fnm;
                
                if (name.indexOf(' ') > 0) {
                    name = name.substring(0, name.indexOf(' '));
                }
                self.result[name] = parseFloat(inst.bp);
                
                resolve(name);
            });
        });
    }


    priceItem(code) {
        return this.download('Prices&Action=GetInstrument&Instrument=' + code)
                .then((xml) => {
                    return this.parsePrices(xml);
                })
                .catch((err) => {
                    log.error("NasDaq.priceItem:" + err);
                });        
    }
    
    prices() {
        var self = this;
        this.result = {};
        return new Promise((resolve,reject) => {
            var items = stocks.map(self.priceItem.bind(self));

            Promise.all(items)
            .then((values) => {
                resolve(self.result);
            })
            .catch((error) => {
                log.error("NasDaq.prices:" + error);
                reject(error);
            });
        });
    }
}

//SITE + /webproxy/DataFeedProxy.aspx?Subsystem=History&Action=GetDataSeries&Instrument=HEX24271&FromDate=2015-10-01
//SITE + /webproxy/DataFeedProxy.aspx?Subsystem=Prices&Action=GetInstrument&Instrument=HEX24271

var n = new Nasdaq();

n.prices()
.then((values) => {
    console.log(values);
})
.catch((err) => {
    console.log("err", err);  
});


//-----------------------------------------------------------------------------
module.exports = {
	Nasdaq: Nasdaq,
};
