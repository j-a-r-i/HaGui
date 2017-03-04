"use strict";
/*
 * Copyright (C) 2016 Jari Ojanen
 * 
 * Interface to strava. See http://www.strava.com
 */
var myhttp = require('./myhttp'),
    log    = require('./log'),
    cmd    = require('./commands'),
    config = require('./config');

const SITE = "www.strava.com";
const PATH = "/api/v3/athlete/activities?page=1&access_token=" + config.strava_key;

//-----------------------------------------------------------------------------
function download() 
{
    return new Promise((resolve,reject) => {
        var opt = { host: SITE,
                    path: PATH,
                    port: 443,
                    method: 'GET'
        };
        
        myhttp.requests(opt, true)
        .then((value) => {
            var result = [];
            value.forEach((act) => {
                result.push([act.start_date_local, act.type, Math.floor(act.moving_time/60), Math.floor(act.elapsed_time/60), act.distance]);
            });
            resolve(result);
        })
        .catch((reason) => {
            reject(reason);
        });
    });
}

//-----------------------------------------------------------------------------
/*download()
.then((result) => {
    console.log(result);
})
.catch((err) => {
    console.log("ERROR:" + err);
});*/

//-----------------------------------------------------------------------------
function initialize(cfg)
{
    return [];
}

//-----------------------------------------------------------------------------
function read()
{
    log.normal("read strava");
}

//-----------------------------------------------------------------------------
module.exports = {
    name: cmd.PLUG_STRAVA,
    initialize: initialize,
    read: read,
};
