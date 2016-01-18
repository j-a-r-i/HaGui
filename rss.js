"use strict";
/*
 * Copyright (C) 2016 Jari Ojanen
 */
var xml2js = require('xml2js'),
    myhttp   = require('./myhttp'),
    parser = new xml2js.Parser();

const sites = ['http://yle.fi/uutiset/rss/uutiset.rss?osasto=talous',
               'http://feeds.kauppalehti.fi/rss/topic/sijoittaminen',
               'http://www.hs.fi/rss/?osastot=talous',
               'http://www.mtv.fi/api/feed/rss/uutiset_talous',
               ];

const tags = ['aktia', 'fortum', 'nokia'];

//-----------------------------------------------------------------------------
class RSS {
    contructor() {
        this.name = "rss";
        this.result = [];
        this.important = [];
    }
    
    download() {
        var self = this;
        return new Promise((resolve,reject) => {
            var items = sites.map((s) => {
                return myhttp.getp(s);
            });

            Promise.all(items)
            .then((values) => {
                self.result = [];
                self.important = [];
                values.map((obj) => {
                    parser.parseString(obj, (err, result) => {
                        if (!!err) {
                            console.log(err.message);
                        }
                        result.rss.channel[0].item.forEach((item) => {
                            var title = item.title[0];
                            
                            self.result.push([title, item.link[0]]);
                            
                            /*tags.forEach((t) => {
                                if (title.toLowercase().indexOf(t) != -1) {
                                    this.important.push(title);
                                }
                            })*/   
                        });	        
                    });     
                });
                resolve(self.result);
            })
            .catch((reason) => {
                reject(reason);
            });
        });
    }
}

//-----------------------------------------------------------------------------
module.exports = {
	RSS: RSS,
};