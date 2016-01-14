"use strict";
/*
 * Copyright (C) 2016 Jari Ojanen
 */
var xml2js = require('xml2js'),
    myhttp   = require('./myhttp'),
    parser = new xml2js.Parser();

var sites = ["http://feeds.kauppalehti.fi/rss/topic/sijoittaminen",
             "http://www.hs.fi/rss/?osastot=talous"]


var items = sites.map((s) => {
    return myhttp.getp(s);
});

Promise.all(items).then((values) => {
    var res = [];
    values.map((obj) => {
	    parser.parseString(obj, (err, result) => {
            if (!!err) {
		        console.log(err.message);
            }
            result.rss.channel[0].item.forEach((item) => {
                res.push(item.title[0]);    
            });	        
	    });     
    });
    console.log(res);
});
