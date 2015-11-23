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
class RangeAction {
	constructor(astart, astop, func)
	{
		this._start = astart;
		this._stop = astop;
		this._active = false;
		this._callback = func;
	}
	
	setval(name, value)
	{
	}
	
	set start(v)
	{
		this._start = v;	
	}

	set stop(v)
	{
		this._stop = v;	
	}
	
	tick(clock)
	{
		if (clock < this._start) {
			// do nothing
		}
		else if (clock < this._stop) {
			if (!this._active) {
				//console.log("start");
				this._callback(1);
				this._active = true;
			}	
		}
		else {
			if (this._active) {
				//console.log("stop");
				this._callback(0);
				this._active = false;
			}
		}
	}
	
	print()
	{
		console.log("action " + this._start + " - " + this._stop);
	}
}

//-----------------------------------------------------------------------------
class IntervalAction {
	constructor(interval, initialClock, func)
	{
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
class CarHeaterAction {
	constructor(leaveTime, func)
	{
		this._leaveTime = leaveTime;
		this._callback = func;
		this._temp = 0;
		this._active = false;
	}
	
	set leave(leaveTime)
	{
		this._leaveTime = leaveTime;
	}
	
	setval(name, value)
	{
		if (name == "TEMP") {
			this._temp = value;
		}	
	}
	
	set temperature(temp)
	{
		this._temp = temp;	
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
			if (clock > this._leaveTime) {
				this._callback(0);
				this._active = false;
			}
		}
		else {
			var start = this.calcStarting();
			
			if (start === 0)  // no need to heat car
				return;
			if (clock > this._leaveTime)
				return;
				
			var sClock = this._leaveTime - start;
			
			if (clock >= sClock) {
				this._callback(1);
				this._active = true;			
			}			
		}
	}
}

//-----------------------------------------------------------------------------
class RoomHeaterAction {
	constructor(tempLow, tempHigh, func)
	{
		this._callback = func;
		this._tlow = tempLow;
		this._thigh = tempHigh;
		this._active = false;
	}
	
	set tlow(temp)
	{
		this._tlow = temp;
	}
	
	set thigh(temp)
	{
		this._thigh = temp;
	}
	
	setval(name, value)
	{
		if (name == "TEMP") {
			if ((this._active == false) && (value < this._tlow)) {
				this._callback(1);
				this._active = true;
			}
			if ((this._active == true) && (value > this._thigh)) {
				this._callback(1);
				this._active = false;				
			}
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

	setval(name, value)
	{
		this._actions.forEach(function(act) {
			act.setval(name, value);
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