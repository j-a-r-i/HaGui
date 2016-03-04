"use strict";
/*
 * Copyright (C) 2016 Jari Ojanen
 */

var http = require('http'),
    https = require('https');

//-----------------------------------------------------------------------------
/** http get without promise.
 */
function get(url, callback)
{
    return http.get(url, function(res) {
        var body = '';
        res.on('data', function(d) {
            body += d;
        });
        res.on('end', function() {
	        callback(null, body);
        });
    })
    .on('error', (e) => {
        console.log(e.code + ' in ' + url);
        callback(e.code);
    });
}

//-----------------------------------------------------------------------------
/** http get with promise.
 */
function getp(url)
{
    return new Promise((resolve,reject) => {
        http.get(url, function(res) {
            var body = '';
            res.on('data', function(d) {
                body += d;
            });
            res.on('error', function(e) {
                reject(e);
            });
            res.on('end', function() {
                resolve(body);
            });
        });
    });
}

//-----------------------------------------------------------------------------
/** https request with promise.
 */
function requests(options, parseJson)
{
    return new Promise((resolve,reject) => {
        var r = https.request(options, (res) => {
            if (res.statusCode != 200) {
                console.log('status: ' + res.statusCode);
                reject(res.statusCode);
            }
            //console.log('header: ' + JSON.stringify(res.headers));
            var data = "";
            res.on('data', (d) => {
                data += d;
            });
            res.on('end', () => {
                if (parseJson)
                    resolve(JSON.parse(data.toString()));
                else
                    resolve(data.toString());
            });          
        });
        r.end();
    });
}

//-----------------------------------------------------------------------------
module.exports = {
	get: get,
	getp: getp,
    requests: requests,
};
