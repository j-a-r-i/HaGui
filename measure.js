"use strict";
/*
 * Copyright (C) 2015-6 Jari Ojanen
 */
var log        = require('./log.js');

//--------------------------------------------------------------------------------
function oneDecimal(x) 
{
    return Math.round(x * 10) / 10;
}

//--------------------------------------------------------------------------------
class MeasureValue {
    constructor(shortName, name) {
        this.value = -99.0;
        this.name = name;
        this.shortName = shortName;
        this.unit = "";
    }
}

//--------------------------------------------------------------------------------
class MeasureData {
    constructor() {
        this.tm = new Date(0);
        this.items = [ new MeasureValue("t1", "ulko.temp"),
                       new MeasureValue("t2", "varasto.temp"),
                       new MeasureValue("t3", "other"),
                       new MeasureValue("h1", "varasto.humidity") ];
    }

    set(name, value) {
        var found = false;
            this.items.forEach( (x) => {
                if (x.name == name) {
                    x.value = oneDecimal(parseFloat(value));
            found = true;
                }
            });
        if (found == false) {
            log.error("invalid measurement id: "+name);
        }
    }                     

    getJson() {
        var ret = {};
        ret['tm'] = this.tm;
        this.items.forEach((x) => {
            ret[x.name] = x.value; 
        });
        
        return ret;
    }

    header() {
        var resp = ['time'];
        this.items.forEach( (x) => {
            resp.push(x.shortName);
        });
        return resp;
    }
    
    values() {
        var resp = [this.tm];
        this.items.forEach( (x) => {
            resp.push(x.value);
        });
        return resp;
    }                     

        
    get time() {
        return this.tm;
    }
    set time(value) {
        this.tm = value;
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
