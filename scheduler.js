"use strict";

function clock(hour,min)
{
	return hour*60 + min;
}

class SimpleAction {
	constructor(astart, astop)
	{
		this._start = astart;
		this._stop = astop;
		this._active = false;
	}
	
	tick(clock)
	{
		if (!this._active && clock >= this._start) {
			console.log("start");
			this._active = true;
		}
		if (this._active && clock > this._stop) {
			console.log("stop");
			this._active = false;
		}
	}
	
	print()
	{
		console.log("action " + this._start + " - " + this._stop);
	}
}

class Scheduler {
	constructor()
	{
		this._actions = [];
	}
	
	add(action)
	{
		this._actions.push(action);
	}
	
	tick()
	{
		var c = clock(10,20);
		this._actions.forEach(function(act) {
			act.tick(c);
		});
	}
}

module.exports = {
	clock: clock,
	SimpleAction: SimpleAction,
	Scheduler: Scheduler
};