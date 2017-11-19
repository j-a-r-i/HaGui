"use strict";
/*
 * Copyright (C) 2016-7 Jari Ojanen
 * 
 * Interface to strava. See http://www.strava.com
 */
var myhttp = require('./myhttp'),
    log    = require('./log'),
    cmd    = require('./commands'),
    config = require('./config.json'),
    qstr   = require('querystring');

const SITE = "www.strava.com";
const PATH_ACT = "/api/v3/athlete/activities?";

//-----------------------------------------------------------------------------
async function download(path) 
{
    var qstring = qstr.stringify({page : 1,
				  access_token : config.strava_key});

    var opt = { host: SITE,
                path: path + qstring,
                port: 443,
                method: 'GET'
              };
        
    var value = await myhttp.requests(opt, true);
    var result = [];
    
    value.forEach((act) => {
        result.push([act.start_date_local, act.type, Math.floor(act.moving_time/60), Math.floor(act.elapsed_time/60), act.distance]);
    });
    
    return result;
}

//-----------------------------------------------------------------------------
function initialize(cfg)
{
    return [];
}

//-----------------------------------------------------------------------------
async function read()
{
    log.normal("read strava");

    var r = await download(PATH_ACT);
    console.log(r);
}

//read();

//-----------------------------------------------------------------------------
module.exports = {
    name: cmd.PLUG_STRAVA,
    initialize: initialize,
    read: read,
};
