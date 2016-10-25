"use strict";
/*
 * Copyright (C) 2015-6 Jari Ojanen
 */
var log        = require('./log.js');

//--------------------------------------------------------------------------------
function oneDecimal(x) 
{
    return Math.round(x * 10.0) / 10.0;
}

//--------------------------------------------------------------------------------
class MeasureValue {
    constructor(name, sqlType) {
        this.value = -99.0;
        this.name = name;
        this.sqlType = sqlType;
        //this.unit = "";
    }

    get sqlDefine() {
        return this.name + " " + this.sqlType;
    }
}

//--------------------------------------------------------------------------------
class MeasureData {
    get SQL_CREATE() {
        let defs = this.items.map((i) => {
              return i.sqlDefine
            }).join(', ');
        return "CREATE TABLE meas(" + defs + ")";
    }

    get SQL_INSERT() {
        let vals = this.items.map((i) => {
              return i.value.toString()
            }).join(',');
        return "INSERT INTO meas VALUES (" + vals + ")";
    }

    get RedisKey() {
        var epoc = this.time.valueOf();
        return epoc.toString();
    }

    get RedisValue() {
        return JSON.stringify(this.getJson());
    }

    constructor() {
        this.items = [ new MeasureValue("time", "DATE"),
                       new MeasureValue("t1", "REAL"),
                       new MeasureValue("t2", "REAL"),
                       new MeasureValue("t3", "REAL"),
                       new MeasureValue("h1", "REAL") ];
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

//-----------------------------------------------------------------------------
module.exports = {
	MeasureData: MeasureData,
	MeasureValue: MeasureValue,
    
    ACTION_CAR1 : "car1",
    ACTION_CAR2 : "car2",
    ACTION_LIGHT : "light",
    ACTION_LIGHT2 : "light2",
    ACTION_ROOM : "room",
    ACTION_WEAT : "weather",
    ACTION_CLOCK1: "clock1"
};
