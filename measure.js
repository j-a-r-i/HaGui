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
    constructor(emitter) {
        this._emitter = emitter;
        this._time = "";
        this._temp1 = -99.0;
        this._temp2 = -99.0;
        this._humidity = -99.0;
    }

    setItem(name, value) {
        if (name == SENSORS_NAMES[0]) {
            this._temp1 = oneDecimal(parseFloat(value));
        }
        else if (name == SENSORS_NAMES[1]) {
            this._temp2 = oneDecimal(parseFloat(value));
            
            //if (simulated === false)
            this._emittter.emit("temp", this._temp2);
        }
        else if (name == SENSORS_NAMES[2]) {
            this._humidity = oneDecimal(parseFloat(value));
        }
    }

    print(table) {
        log.verbose(this._time.toLocaleTimeString() + ": " + this._temp1 + ", " + this._temp2 + ", " + this._humidity);
        table.push( {time: this._time,
                     t1: this._temp1,
                     t2: this._temp2,
                     h1: this._humidity
                    });
    }

    get time() {
        return this._time;
    }

    set time(value) {
        this._time = value;
    }
    set temp2(value) {
        this._temp2 = value;
    }
    set humidity2(value) {
        this._humidity = value;
    }
}

//-----------------------------------------------------------------------------
module.exports = {
	MeasureData: MeasureData,
    SENSORS_NAMES: SENSORS_NAMES
};
