"use strict";
/*
 * Copyright (C) 2015-6 Jari Ojanen
 */

var fs = require('fs');

//-----------------------------------------------------------------------------
function toClock(hour,min)
{
	return hour*60 + min;
}

//-----------------------------------------------------------------------------
function toClock2(date)
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
class VarBase {
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
class VarTime extends VarBase {
    constructor(aname, value, canModify) {
        super(aname, value, canModify);
    }

    setVal(obj) {
        var time = toClock(obj[0], obj[1]);
        this.value = time;
    }
    
    html(group) {
        return '<input type="time" name="'+this._name+'" ng-model="'+group+'.'+this._name+'" step="300.0">';
    }
}


//-----------------------------------------------------------------------------
class VarInteger extends VarBase {
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
class Action {
	constructor(aname, active) {
		this._name = aname;
        this._active = active;
		this._exports = [];
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
            this._exports.forEach((i) => {
                if (i.name === key) {
                    i.setVal(obj[key]);
                }
            });
        });
	}

	strings()
	{
		var ret = [];
		
		this._exports.forEach((i) => {
			//ret.push( (i + ":") + this[i] );
			ret.push( { name: i.name,
						value: i.value });
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
        super(aname, false);
        
        this._start = new VarTime('start', 0, true);
        this._stop  = new VarTime('stop', 0, true);
        this._exports = [this._start, this._stop];
        
		this._callback = func;
	}

	tick(clock)
	{
		if (clock < this._start.value) {
			// do nothing
		}
		else if (clock < this._stop.value) {
			if (!this._active) {
				this._callback(this.name, 1);
				this._active = true;
			}	
		}
		else {
			if (this._active) {
				this._callback(this.name, 0);
				this._active = false;
			}
		}
	}
}

//-----------------------------------------------------------------------------
class IntervalAction extends Action {
	constructor(aname, emitter, ainterval, initialClock, func)
	{
		super(aname, true);
        
        this._interval = new VarInteger("interval", ainterval, true);
        this._started  = new VarTime("started", initialClock, false);
        this._exports = [this._interval, this._started];
        
		this._callback = func;
	}

	tick(clock)
	{
		if (clock > 800 && this._started.value < 100)  // handle 24 -> 0 transition
			return;
	
		if (clock >= this._started.value) {
			this._callback();
			this._started.value = clock + this._interval.value;
			if (this._started.value > 24*60) {
				//console.log("too large clock value!");
				this._started.value -= 24*60;
			}		
		}
	}
}

//-----------------------------------------------------------------------------
/** action that is performed at a specific time of day. (e.g. 18:00)
 */
class ClockAction extends Action {
	constructor(aname, emitter, atime, func)
	{
		super(aname, true);
        
        this._time = new VarTime("time", atime, true);
        this._lastTime = 0;
        this._exports = [this._time];
        
		this._callback = func;
	}

	tick(clock)
	{
		if ((clock == this._time.value) ||
           ((this._lastTime < this._time.value) && (this._time.value < clock))) 
        {
			this._callback();
		}
        this._lastTime = clock;
	}
}

//-----------------------------------------------------------------------------
class CarHeaterAction extends Action {
	constructor(aname, emitter, func)
	{
		super(aname, false);
		this._leave = new VarTime("leave", 0, false);
        this._exports = [this._leave];
        
		this._callback = func;
		this._temp = 0;
			
		var self = this;
		emitter.on("temp", (temp) => {
			self._temp = temp;
		});
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
			if (clock > this._leave.value) {
				this._callback(this.name, 0);
				this._active = false;
			}
		}
		else {
			var start = this.calcStarting();
			
			if (start === 0)  // no need to heat car
				return;
			if (clock > this._leave.value)
				return;
				
			var sClock = this._leave.value - start;
			
			if (clock >= sClock) {
				this._callback(this.name, 1);
				this._active = true;			
			}			
		}
	}
}

//-----------------------------------------------------------------------------
class RoomHeaterAction extends Action {
	constructor(aname, emitter, func)
	{
		super(aname, false);
		this._low  = new VarInteger('low', 0, true);
	        this._high = new VarInteger('high', 0, true);
                this._exports = [this._low, this._high];
        
		this._callback = func;
		
		emitter.on("temp", (temp) => {
			this.setTemp(temp);
		});
		emitter.on("tVarasto", (temp) => {
		});
	}
	
	setTemp(value)
	{
		if ((this._active === false) && (value < this._low.value)) {
			this._callback(this.name, 1);
			this._active = true;
		}
		if ((this._active === true) && (value > this._high.value)) {
			this._callback(this.name, 0);
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

    get(action)
    {
		this._actions.forEach(function(act) {
			if (act.name === action) {
				return act.values();
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
        var fname = 'html/partials/config2.html';
		var fout = fs.createWriteStream(fname);
        fout.on('error', (err) => {
           console.log("Error in " + fname);
           console.log(err); 
        });
        fout.on('finish', () => {
           console.log('finnished');
           process.exit();
        });
		this._actions.forEach(function(act) {
			fout.write('<form ng-submit="submit1(\''+act.name+'\')" ng-controller="ConfigCtrl">\n');
			fout.write('  <fieldset>\n');
			fout.write('    <legend><b>'+act.name+'</b></legend>\n');
			act._exports.forEach((i) => {
				fout.write('    <label for="'+i.name+'">'+i.name+'</label>\n');
				fout.write('    ' + i.html(act.name) + '<br>\n');
			});
			fout.write('    <br>\n');
			fout.write('    <input type="submit" class="btn" value="Save">\n');
			fout.write('  </fieldset>\n');
			fout.write('</form>\n');
		});
		fout.end();
	}
}

//-----------------------------------------------------------------------------
module.exports = {
    toClock: toClock,
    toClock2: toClock2,
    toStr: toStr,
    RangeAction: RangeAction,
    IntervalAction: IntervalAction,
    ClockAction: ClockAction,
    CarHeaterAction: CarHeaterAction,
    RoomHeaterAction: RoomHeaterAction,
    Scheduler: Scheduler
};
