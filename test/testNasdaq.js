/*
 * Copyright (C) 2016 Jari Ojanen
 */
var nasdaq = require("./nasdaq.js");
var http = require("./myhttp.js");

var n = new nasdaq.Nasdaq();

/*
n.prices().then((result) => {
    console.log(result);
});
*/
const SITE = "www.nasdaqomxnordic.com";

function post(path) {
    var options = { host: SITE,
                    path: path,
                    port: 443,
                    method: "GET"
                  };
    
    return http.requests(options, false);
}

post("/webproxy/DataFeedProxy.aspx?Subsystem=Prices&Action=GetInstrument&Instrument=HEX24249")
    .then((val) => {
        console.log(val);
    });

