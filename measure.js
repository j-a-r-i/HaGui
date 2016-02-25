"use strict";
/*
 * Copyright (C) 2015 Jari Ojanen
 */
var log        = require('./log.js');

var SENSORS_NAMES = ["ulko.temp",
                     "varasto.temp",
                     "varasto.humidity"];

//--------------------------------------------------------------------------------
function oneDecimal(x) 
{
    return Math.round(x * 10) / 10;
}

//--------------------------------------------------------------------------------
class MeasureData {
    constructor() {
        this._time = new Date(0);
        this._temp1 = -99.0;
        this._temp2 = -99.0;
        this._temp3 = -99.0;
        this._humidity = -99.0;
    }

    setItem(name, value) {
        if (name == SENSORS_NAMES[0]) {
            this._temp1 = oneDecimal(parseFloat(value));
        }
        else if (name == SENSORS_NAMES[1]) {
            this._temp2 = oneDecimal(parseFloat(value));
        }
        else if (name == SENSORS_NAMES[2]) {
            this._humidity = oneDecimal(parseFloat(value));
        }
    }

    values() {
        var s = [this._temp1, this._temp2, this._temp3, this._humidity].join(', ');
        log.normal(this._time.toLocaleTimeString() + ": " + s);
        return { time: this._time,
                 t1: this._temp1,
                 t2: this._temp2,
                 t3: this._temp3,
                 h1: this._humidity
                };
    }

    get time() {
        return this._time;
    }
    set time(value) {
        this._time = value;
    }
    
    get temp2() {
        return this._temp2;
    }
    set temp2(value) {
        this._temp2 = value;
    }
    
    get temp3() {
        return this._temp3;
    }
    set temp3(value) {
        this._temp3 = value;
    }
    
    set humidity2(value) {
        this._humidity = value;
    }
}

//-----------------------------------------------------------------------------
module.exports = {
	MeasureData: MeasureData,
    SENSORS_NAMES: SENSORS_NAMES,
    
    ACTION_CAR1 : "car1",
    ACTION_CAR2 : "car2",
    ACTION_LIGHT : "light",
    ACTION_LIGHT2 : "light2",
    ACTION_ROOM : "room",
    ACTION_WEAT : "weather"
};
