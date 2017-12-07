"use strict";
/*
 * Copyright (C) 2015-7 Jari Ojanen
 */

var fs = require('fs');

//-----------------------------------------------------------------------------
/**
 * @param {number} hour
 * @param {number} min
 * @returns {number} -- own time format
 */
function toClock(hour,min)
{
	return hour*60 + min;
}

//-----------------------------------------------------------------------------
/**
 * @param {Date} date
 * @returns {number} -- own time format
 */
function toClock2(date)
{
	return date.getHours()*60 + date.getMinutes();
}

//-----------------------------------------------------------------------------
/**
 * @param {number} clock -- onw time format
 * @param {number} duration
 * @returns {number} -- own time format
 */
function clockInc(clock, duration)
{
	var val = clock + duration;

	if (val >= 24*60) 
		val -= 24*60;

	return val;
}

//--------------------------------------------------------------------------------
class History {
    constructor(name) {
	this.list = [];
    }

    clear() {
	this.list = [];
    }

    add(time, value) {
	this.list.push( [time, value] );
	if (this.history.length > 300) {
	    this.history.shift();
	}
    }
}

//--------------------------------------------------------------------------------
class MValue {
	/**
	 * @param {String} name
	 */
    constructor(name) {
        this._value = -99.0;
        this.name = name;

        this.history = new History(name);
        this.lastChanged = 0;
        this.eventHandler = null;

    }

    set(value, time) {
	this.history.add(time, value);
	this._value = value;
    }

    clearHistory() {
	this.history.clear();
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        if (Math.abs(newValue - this._value) > 0.01) {  // value is changed
	    this.set(newValue, new Date());
            if (this.eventHandler != null) {
                this.eventHandler(this.name, newValue);
            }
        }
    }
}


//-----------------------------------------------------------------------------
class Base {
    constructor(aname, value, canModify) {
        this._name = aname;
        this._value = value;
        this._canModify = canModify;
    }
    
    get name() {
        return this._name;
    }
    
    get value() {
        return this._value;
    }
    
    set value(v) {
        this._value = v;
    }
}

//-----------------------------------------------------------------------------
class Time extends Base {
	get MAX_TIME() {
		return 24*60;
	}

    constructor(aname, value, canModify) {
		if (value.length === 2)
			value = toClock(value[0], value[1]);

        super(aname, value, canModify);
    }

    setVal(obj) {
		if (obj.length == 2) {  // sets [hour,min]
        	this.value = toClock(obj[0], obj[1]);
		}
		else {  // sets date
			this.value = obj;
		}
    }
    
    html(group) {
        return '<input type="time" name="'+this._name+'" ng-model="'+group+'.'+this._name+'" step="300.0">';
    }

	gt(other)
	{
		if ((this.value - other.value) < -1200)          // different days compare
			return (this.value > (other.value - 24*60));

		return this.value > other.value;
	}

	gtEq(other)
	{
		if ((this.value - other.value) < -1200)          // different days compare
			return (this.value >= (other.value - 24*60));

		return this.value >= other.value;
	}

	inc(duration)
	{
		var val = this.value + duration;

		if (val >= this.MAX_TIME) 
			val -= this.MAX_TIME;
		
		this.value = val;
	}

	incCreate(duration)
	{
		var val = this.value + duration;

		if (val >= this.MAX_TIME) 
			val -= this.MAX_TIME;
		
		return new VarTime(this.aname, val, this._canModify);
	}

	decCreate(duration)
	{
		var val = this.value - duration;

		if (val < 0) 
			val += this.MAX_TIME;
		
		return new VarTime(this.aname, val, this._canModify);
	}

	toString()
	{
		var hours = Math.floor(this.value / 60);
		var mins = this.value % 60;
		
		if (mins < 10)
			mins = "0" + mins;
		if (hours < 10)
			hours = "0" + hours;

		return "" + hours + ":" + mins;
	}
}


//-----------------------------------------------------------------------------
class Integer extends Base {
    constructor(aname, value, canModify) {
        super(aname, value, canModify);
    }

    setVal(obj) {
	    this.value = obj;
    }
    
    html(group) {
        return '<input type="number" name="'+this._name+'" ng-model="'+group+'.'+this._name+'" step="10.0">';
    }
}

//-----------------------------------------------------------------------------
module.exports = {
    toClock: toClock,
    toClock2: toClock2,
 	clockInc: clockInc,
	TIME_00_00: 0,

	Integer: Integer,
	Time: Time,

	MValue: MValue,
};
