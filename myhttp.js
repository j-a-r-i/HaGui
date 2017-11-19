"use strict";
/*
 * Copyright (C) 2016 Jari Ojanen
 */

var http = require('http'),
    https = require('https'),
    log = require('./log');

//-----------------------------------------------------------------------------
/** http get without promise.
 * 
 * @param {String} url
 * @param {function(Error, String)} callback
 */
function get(url, callback)
{
    return http.get(url, function(res) {
	var site = url;
        var body = '';
	log.normal("http get " + site + "...");
        res.on('data', function(d) {
            body += d;
        });
        res.on('end', function() {
	    log.normal("http get " + site + " done.");
	    callback(null, body);
        });
    })
    .on('error', (e) => {
        log.error(e.code + ' in ' + url);
        callback(e.code);
    });
}

//-----------------------------------------------------------------------------
/** http get with promise.
 * 
 * @param {String} url
 * @returns {String}
 */
function getp(url)
{
    return new Promise((resolve,reject) => {
	var site = url;

	log.normal("http getp " + url + "...");
        http.get(url, function(res) {
            var body = '';
            res.on('data', function(d) {
                body += d;
            });
            res.on('error', function(e) {
                reject(e);
            });
            res.on('end', function() {
		log.normal("http getp " + url + " done.");
                resolve(body);
            });
        });
    });
}

//-----------------------------------------------------------------------------
/** http request with promise.
 * @returns {Promise.<String>}
 */
function request(options, msg="")
{
    return new Promise((resolve,reject) => {
	    var site = options.host;
	    log.normal("request " + site + "...");
        var r = http.request(options, (res) => {
            if (res.statusCode != 200) {
                log.error('status: ' + res.statusCode + "  " + res.statusMessage);
                return reject(res.statusCode);
            }
            //console.log('header: ' + JSON.stringify(res.headers));
            var data = "";
            res.on('data', (d) => {
                data += d;
            });
            res.on('end', () => {
		        log.normal("request " + site + " done.");
                resolve(data.toString());
            });
        });
        r.on('error', (err) => {
            log.error(site);
            console.log(err);
            reject(err);
        });
        if (msg.length > 0)
            r.write(msg);
        r.end();
    });
}

//-----------------------------------------------------------------------------
/** https request with promise.
 * @param {Object} options
 * @param {Boolean} parseJson - Is response in json format
 * @returns {Promise}
 */
async function requests(options, parseJson)
{
    return new Promise((resolve,reject) => {
	    var site = options.host;
	    log.verbose("request " + site + "...");
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
		        log.verbose("request " + site + " done.");
                if (parseJson) {
                    var obj = {};
                    try {
                        obj = JSON.parse(data.toString());
                    }
                    catch (err) {
                        reject(err);
                    }
                    resolve(obj);
                }
                else
                    resolve(data.toString());
            });
        });
        r.on('error', (err) => {
            log.error(site);
            reject(err);
        });
        r.end();
    });
}

//-----------------------------------------------------------------------------
module.exports = {
	get: get,
	getp: getp,
    request: request,
    requests: requests
};
