"use strict";
/*
 * Copyright (C) 2016 Jari Ojanen
 */
var myhttp = require('./myhttp'),
    config = require('./config');

const SITE = "www.strava.com";
const PATH = "/api/v3/athlete/activities?page=1&access_token=" + config.strava_key;

//-----------------------------------------------------------------------------
/** Interface to strava. See http://www.strava.com
 */
class Strava {
    contructor() {
        this.name = "strava";
        this.result = [];
    }
    
    download() {
        var self = this;
        return new Promise((resolve,reject) => {
            var opt = { host: SITE,
                        path: PATH,
                        port: 443,
                        method: 'GET'
            };
            
            myhttp.requests(opt, true)
            .then((value) => {
                self.result = [];
                value.forEach((act) => {
                   self.result.push([act.start_date_local, act.type, Math.floor(act.moving_time/60), Math.floor(act.elapsed_time/60), act.distance]);
                });
                resolve(self.result);
            })
            .catch((reason) => {
                reject(reason);
            });
        });
    }
}

var s = new Strava();

s.download()
.then((res) => {
    console.log(res);
})
.catch((err) => {
    console.log("ERROR:" + err);
});

//-----------------------------------------------------------------------------
module.exports = {
	Strava: Strava,
};
