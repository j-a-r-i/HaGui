"use strict";
/*
 * Copyright (C) 2016 Jari Ojanen
 */

var myhttp = require('./myhttp'),
    querystring = require('querystring');

const SITE = "dweet.io";
const NAME = "ha.joj.home";

//------------------------------------------------------------------------------
class Dweet {
    constructor() {
    }

    post(path, meth) {
        var options = { host: SITE,
                        path: path,
                        port: 443,
                        method: meth
                        };
        
        return myhttp.requests(options, true);
    }
    
    send(data) {
        this.post("/dweet/for/"+NAME+"?"+querystring.stringify(data), "POST")
            .then((val) => {
                switch (val.this) {
                case  "failed":
                    console.log("Error dweet: " + val.because);
                    break;
                case "succeeded":
                    break;
                default:
                    console.log(val);
                    break;
                }
            });
    }
    
    read() {
        this.post("/get/dweets/for/"+NAME, "GET")
        .then((val) => {
            val.with.forEach( (i) => {
                console.log(i.created, i.content);
            });
        });
    }
}

//-----------------------------------------------------------------------------
/*var d = new Dweet();

d.send({t1:13, t2:23});
d.read();
*/
//-----------------------------------------------------------------------------
module.exports = {
	Dweet: Dweet,
};
