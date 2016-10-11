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
    constructor(name) {
        this.value = -99.0;
        this.name = name;
        //this.unit = "";
    }
}

//--------------------------------------------------------------------------------
class MeasureData {
    constructor() {
        this.tm = new Date(0);
        this.items = [ new MeasureValue("time"),
                       new MeasureValue("t1"),
                       new MeasureValue("t2"),
                       new MeasureValue("t3"),
                       new MeasureValue("h1") ];
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
            return x.value;
        });
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
