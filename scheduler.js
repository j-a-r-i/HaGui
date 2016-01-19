"use strict";
/*
 * Copyright (C) 2015 Jari Ojanen
 */

var fs = require('fs');

//-----------------------------------------------------------------------------
function clock(hour,min)
{
	return hour*60 + min;
}

//-----------------------------------------------------------------------------
function clock2(date)
{
	return date.getHours()*60 + date.getMinutes();
}

//-----------------------------------------------------------------------------
function toStr(clock)
{
	var hours = Math.ceil(clock / 60);
	var mins = clock % 60;
	
	return "" + hours + ":" + mins;
}

//-----------------------------------------------------------------------------
class Action {
	constructor(aname, exports) {
		this._name = aname;
		this._exports = exports;
	}
	
	get name()
	{
		return this._name;
	}
	
    setVal(name, val)
	{
		console.log(this._name + "." + name + " = " + val);
		this[name] = val;
	}
	
	load(obj)
	{
		Object.keys(obj).forEach((key) => {
			if (key.indexOf("Time") > 0) {
				var time = clock(obj[key][0], obj[key][1]);
				this.setVal(key, time);
			}
			else {
				this.setVal(key, obj[key]);
			}
		});
	}

	strings()
	{
		var ret = [];
		
		this._exports.forEach((i) => {
			//ret.push( (i + ":") + this[i] );
			ret.push( { name: i,
						value: this[i]});
		});		
		return ret;
	}

	values()
	{
		var ret = {};
		
		this._exports.forEach((i) => {
			ret[i] = this[i];
		});
		
		return ret;
	}
	
	dump()
	{
		var out = this._name;
		
		this._exports.forEach((i) => {
			out = out.concat(" ", i, ":", this[i]);
		});
		
		console.log(out);
		return out;
	}
}

//-----------------------------------------------------------------------------
class RangeAction extends Action {
	constructor(aname, emitter, func)
	{
		super(aname, ['startTime', 'stopTime']);
		this.startTime = 0;
		this.stopTime = 0;
		this._active = false;
		this._callback = func;
	}

	tick(clock)
	{
		if (clock < this.startTime) {
			// do nothing
		}
		else if (clock < this.stopTime) {
			if (!this._active) {
				this._callback(this, 1);
				this._active = true;
			}	
		}
		else {
			if (this._active) {
				this._callback(this, 0);
				this._active = false;
			}
		}
	}
}

//-----------------------------------------------------------------------------
class IntervalAction extends Action {
	constructor(aname, emitter, ainterval, initialClock, func)
	{
		super(aname, ['interval', '_startedTime']);
		this.interval = ainterval;
		this._callback = func;
		this._startedTime = initialClock; // + this._interval;
	}

	tick(clock)
	{
		if (clock > 800 && this._startedTime < 100)  // handle 24 -> 0 transition
			return;
	
		if (clock >= this._startedTime) {
			this._callback(this);
			//console.log("set started time:" + (clock + this.interval))
			this._startedTime = clock + this.interval;
			if (this._startedTime > 24*60) {
				//console.log("too large clock value!");
				this._startedTime -= 24*60;
			}		
		}
	}
}

//-----------------------------------------------------------------------------
class CarHeaterAction extends Action {
	constructor(aname, emitter, func)
	{
		super(aname, ['leaveTime']);
		this.leaveTime = 0;
		this._callback = func;
		this._temp = 0;
		this._active = false;
			
		var self = this;
		emitter.on("temp", (temp) => {
			self._temp = temp;
		});
	}
	
	set leave(leaveTime)
	{
		this.leaveTime = leaveTime;
	}

	calcStarting()
	{
		var sTime = 60;
		
		if (this._temp < -20) {
			sTime = 150;
		}
		else if (this._temp < -10) {
			sTime = 120;
		}
		else if (this._temp < -5) {
			sTime = 60;
		}
		else if (this._temp < 5) {
			sTime = 30;
		}
		else {
			sTime = 0;
		}
		return sTime;
	}
	
	tick(clock)
	{
		if (this._active === true) {
			if (clock > this.leaveTime) {
				this._callback(this, 0);
				this._active = false;
			}
		}
		else {
			var start = this.calcStarting();
			
			if (start === 0)  // no need to heat car
				return;
			if (clock > this.leaveTime)
				return;
				
			var sClock = this.leaveTime - start;
			
			if (clock >= sClock) {
				this._callback(this, 1);
				this._active = true;			
			}			
		}
	}
}

//-----------------------------------------------------------------------------
class RoomHeaterAction extends Action {
	constructor(aname, emitter, func)
	{
		super(aname, ['lowTemp', 'highTemp']);
		this._callback = func;
		this.lowTemp = 0;
		this.highTemp = 0;
		this._active = false;
		
		emitter.on("temp", (temp) => {
			this.setTemp(temp);
		});
	}
	
	setTemp(value)
	{
		if ((this._active === false) && (value < this.lowTemp)) {
			this._callback(this, 1);
			this._active = true;
		}
		if ((this._active === true) && (value > this.highTemp)) {
			this._callback(this, 0);
			this._active = false;				
		}		
	}

	tick(clock)
	{
		// todo: ensure heater is on/off after some time is activated/deactivated
		//       It's possible that controller is missing the signal sometimes.
	}
}


//-----------------------------------------------------------------------------
class Scheduler {
	constructor()
	{
		this._actions = [];
		this._timer = null;
	}
	
	start()
	{
		this._timer = setInterval(this.onTimer, 60000, this);  // 1 min interval
	}
	
	stop()
	{
		clearInterval(this._timer);
	}
	
	add(action)
	{
		this._actions.push(action);
	}
	
	tick(clock)
	{
		this._actions.forEach(function(act) {
			act.tick(clock);
		});
	}

    set(action, values)
	{
		this._actions.forEach(function(act) {
			if (act.name === action) {
				act.load(values);
			}
		});				
	}
	
    setVal(action, sname, value)  // not used anymore
	{
		this._actions.forEach(function(act) {
			if (act.name === action) {
				act.setVal(sname, value);
			}
		});				
	}

	onTimer(self)
	{
		var c = clock2(new Date());
		//console.log("<timer2>");
		self.tick(c);
	}
	
	load()
	{
		var settings = require('./settings.json');
		
		this._actions.forEach((act) => {
			act.load(settings[act.name]);
		});
	}
	
	genHtml()
	{
		var fout = fs.createWriteStream('partials/config2.html');
		this._actions.forEach(function(act) {
			fout.write('<form ng-submit="submit1(\''+act.name+'\')" ng-controller="HaCtrlController">\n');
			fout.write('  <fieldset>\n');
			fout.write('    <legend><b>'+act.name+'</b></legend>\n');
			act._exports.forEach((name) => {
				fout.write('    <label for="'+name+'">'+name+'</label>\n');
				fout.write('    <input type="time" name="'+name+'" ng-model="'+act.name+'.'+name+'" step="300.0"><br>\n');
			});
			fout.write('    <br>\n');
			fout.write('    <input type="submit" value="Save">\n');
			fout.write('  </fieldset>\n');
			fout.write('</form>\n');
		});
		fout.end();
	}
}

//-----------------------------------------------------------------------------
module.exports = {
	toClock: clock,
	toClock2: clock2,
	toStr: toStr,
	RangeAction: RangeAction,
	IntervalAction: IntervalAction,
	CarHeaterAction: CarHeaterAction,
	RoomHeaterAction: RoomHeaterAction,
	Scheduler: Scheduler
};