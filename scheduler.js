"use strict";

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
	constructor(aname, emitter, astart, astop, func)
	{
		super(aname, ['start', 'stop']);
		this.start = astart;
		this.stop = astop;
		this._active = false;
		this._callback = func;
	}
	
	setval(name, value)
	{
		switch (name) {
		case "START":
			this.start = value;
			break;
		case "STOP":
			this.stop = value;
			break;	
		}
	}
	
	tick(clock)
	{
		if (clock < this.start) {
			// do nothing
		}
		else if (clock < this.stop) {
			if (!this._active) {
				this._callback(1);
				this._active = true;
			}	
		}
		else {
			if (this._active) {
				this._callback(0);
				this._active = false;
			}
		}
	}
	
	print()
	{
		console.log("action " + this.start + " - " + this.stop);
	}
}

//-----------------------------------------------------------------------------
class IntervalAction extends Action {
	constructor(aname, emitter, interval, initialClock, func)
	{
		super(aname, []);
		this._interval = interval;
		this._callback = func;
		this._started = initialClock + this._interval;
	}

	setval(name, value)
	{
	}
	
	tick(clock)
	{
		if (clock > 800 && this._started < 100)  // handle 24 -> 0 transition
			return;
			
			
		if (clock >= this._started) {
			this._callback();
			this._started = clock + this._interval;
			if (this._started > 24*60) {
				//console.log("too large clock value!");
				this._started -= 24*60;
			}		
		}
	}
}

//-----------------------------------------------------------------------------
class CarHeaterAction extends Action {
	constructor(aname, emitter, leaveTime, func)
	{
		super(aname, ['leaveTime']);
		this.leaveTime = leaveTime;
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
	
	setval(name, value)
	{
		switch (name) {
		case "LEAVE":
			this.leaveTime = value;
			break;
		}
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
				this._callback(0);
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
				this._callback(1);
				this._active = true;			
			}			
		}
	}
}

//-----------------------------------------------------------------------------
class RoomHeaterAction extends Action {
	constructor(aname, emitter, tempLow, tempHigh, func)
	{
		super(aname, ['tlow', 'thigh']);
		this._callback = func;
		this.tlow = tempLow;
		this.thigh = tempHigh;
		this._active = false;
		
		emitter.on("temp", (temp) => {
			this.setTemp(temp);
		})
	}
	
	setTemp(value)
	{
		if ((this._active == false) && (value < this.tlow)) {
			this._callback(1);
			this._active = true;
		}
		if ((this._active == true) && (value > this.thigh)) {
			this._callback(1);
			this._active = false;				
		}		
	}
	
	setval(name, value)
	{
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

    setVal(action, sname, value)
	{
		this._actions.forEach(function(act) {
			if (act.name === action) {
				act.setval(sname, value)
			}
		});				
	}


	onTimer(self)
	{
		var c = clock2(new Date());
		//console.log("<timer2>");
		self.tick(c);
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