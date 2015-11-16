"use strict";

//-----------------------------------------------------------------------------
function clock(hour,min)
{
	return hour*60 + min;
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
	constructor(astart, astop)
	{
		this._start = astart;
		this._stop = astop;
		this._active = false;
	}
	
	tick(clock)
	{
		if (clock < this._start) {
			// do nothing
		}
		else if (clock < this._stop) {
			if (!this._active) {
				console.log("start");
				this._active = true;
			}	
		}
		else {
			if (this._active) {
				console.log("stop");
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
	constructor(interval, func)
	{
		this._interval = interval;
		this._callback = func;
		this._started = 0 + this._interval;
	}
	
	tick(clock)
	{
		if (clock >= this._started) {
			this._callback();
			this._started = clock + this._interval;			
		}
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

	onTimer(self)
	{
		var d = new Date();
		var c = clock(d.getHours(), d.getMinutes());
		//console.log("<timer2>");
		self.tick(c);
	}
	
}

//-----------------------------------------------------------------------------
module.exports = {
	toClock: clock,
	toStr: toStr,
	RangeAction: RangeAction,
	IntervalAction: IntervalAction,
	Scheduler: Scheduler
};