"use strict";
/*
 * Copyright (C) 2015-6 Jari Ojanen
 */
var log = require('./log.js'),
    v   = require('./var'),
    cmd  = require('./commands');


//--------------------------------------------------------------------------------
function oneDecimal(x) 
{
    return Math.round(x * 10.0) / 10.0;
}

//--------------------------------------------------------------------------------
class MeasureData {
    get RedisKey() {
        var epoc = this.time.valueOf();
        return epoc.toString();
    }

    get RedisValue() {
        return JSON.stringify(this.getJson());
    }

    constructor() {
        this.items = [ new v.MValue("time"),
                       new v.MValue("t1"),
                       new v.MValue("t2"),
                       new v.MValuee("t3"),
                       new v.MValue("h1") ];
    }

    set(name, value) {
        var found = false;
            this.items.forEach( (x) => {
                if (x.name == name) {
                    x.value = oneDecimal(parseFloat(value));
                    found = true;
                }
            });
        if (found === false) {
            log.error("invalid measurement id: "+name);
        }
    }                     

    getJson() {
        var ret = {};
        this.items.forEach((x) => {
            ret[x.name] = x.value; 
        });
        
        return ret;
    }

    header() {
        return this.items.map((i) => {
            return i.name;
        });
    }
    
    values() {
        return this.items.map((i) => {
            return i.value;
        });
    }                     

        
    get time() {
        return this.items[0].value;
    }
    set time(value) {
        this.items[0].value = value;
    }
}
