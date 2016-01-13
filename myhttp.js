"use strict";
/*
 * Copyright (C) 2016 Jari Ojanen
 */

var http = require('http');

//-----------------------------------------------------------------------------
function get(url, callback)
{
    return http.get(url, function(res) {
        var body = '';
        res.on('data', function(d) {
            body += d;
        });
        res.on('error', function(e) {
            callback(e, null);
        });
        res.on('end', function() {
	        callback(null, body);
        });
    });
}

 //-----------------------------------------------------------------------------
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
module.exports = {
	get: get,
	getp: getp,
};
