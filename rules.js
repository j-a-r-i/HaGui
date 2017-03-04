
var v    = require('./var'),
    log  = require('./log'),
    cmd  = require('./commands'),
    fs   = require('fs');

var gRules = [];
var gVariables = {};
var gTimer;

var gState = {
    clkLast: new v.Time("clk.last", [0,0], false),
    clkCur:  new v.Time("clk.cur", [0,0], false),
    day: 0,
    tOut: -10.3,
    tVarasto: -9.0
};

const EV_TICK = "tick";
const EV_STARTUP = "start";
const EV_SIMULATED = "sim";

const TYPE_INT = 0;
const TYPE_DATE = 1;
const TYPE_REAL = 2;

const DAY_MONDAY = 0;
const DAY_TUESDAY = 1;
const DAY_WEDNESDAY = 2;
const DAY_THURSDAY = 3;
const DAY_FRIDAY = 4;
const DAY_SATURDAY = 5;
const DAY_SUNDAY = 6;

const WORKDAYS = [DAY_MONDAY, DAY_TUESDAY, DAY_WEDNESDAY, DAY_THURSDAY, DAY_FRIDAY];

const DAY_NAME = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * @param {String} name
 * @param {String} event
 * @param {function(Object)} cond
 * @param {function(function(String, String))} action
 */
function rule(name, event, cond, action=null)
{
    log.normal("RULE:" + name);
    gRules.push({name: name,
                 event: event,
                 cond: cond,
                 act: action});
}

function variable(name, initValue, type)
{
    log.normal("VAR:" + name);
    switch (type) {
        case TYPE_INT:
            gVariables[name] = new v.Integer(name, initValue, true);
            break;
        case TYPE_DATE:
            gVariables[name] = new v.Time(name, initValue, true);
            break;
        default:
            log.error("Invalid variable type " + type + " for " + name);
            break;
    }
}
function getVar(name)
{
    return gVariables[name];
}

function setVar(name, value)
{
    gVariables[name].setVal(value);
}

function between(value, min, max)
{
    return (value > min) && (value <= max);
}

function isTime(value, state)
{
    return value.gt(state.clkLast) && state.clkCur.gtEq(value);
}

function carHeatingDuration(temp)
{
    var duration = 60;
    
    if (temp < -20) {
        duration = 150;
    }
    else if (temp < -10) {
        duration = 120;
    }
    else if (temp < -5) {
        duration = 60;
    }
    else if (temp < 5) {
        duration = 30;
    }
    else {
        duration = 0;
    }
    return duration;
}

//-----------------------------------------------------------------------------
variable("light.1.on",  [7,15], TYPE_DATE);
variable("light.1.off", [8,30], TYPE_DATE);

rule("light.1.on",
    EV_TICK,
    (state) => {
        return isTime(getVar("light.1.on"), state); 
    },
    (act) => {
        act('light.on');
    });
rule("light.1.off",
    EV_TICK,
    (state) => {
        return isTime(getVar("light.1.off"), state);
    },
    (act) => {
        act('light.off');
    });

variable("light.2.on",  [10,15], TYPE_DATE);
variable("light.2.off", [11,30], TYPE_DATE);

rule("light.2.on",
    EV_TICK,
    (state) => {
        return isTime(getVar("light.2.on"), state);
    },
    (act) => {
        act('light.on');
    });
rule("light.2.off",
    EV_TICK,
    (state) => {
        return isTime(getVar("light.2.off"), state);
    },
    (act) => {
        act('light.off');
    });

//-----------------------------------------------------------------------------
variable("car.heater.1", [9,10], TYPE_DATE);

rule("car.heater.1.on",
    EV_TICK,
    (state) => {
        var stopTime = getVar("car.heater.1");
        var startTime = stopTime.decCreate( carHeatingDuration(state.tOut) );
        return WORKDAYS.includes(state.day) &&
                isTime(startTime, state);
    },
    (act) => {
        act('car1.on');
    });
rule("car.heater.1.off",
    EV_TICK,
    (state) => {
       var stopTime = getVar("car.heater.1");
       return WORKDAYS.includes(state.day) &&
               isTime(stopTime, state);
    },
    (act) => {
        act('car1.off');
    });

//-----------------------------------------------------------------------------
variable("car.heater.2", [7,15], TYPE_DATE);

rule("car.heater.2.on",
    EV_TICK,
    (state) => {
        var stopTime = getVar("car.heater.2");
        var startTime = stopTime.decCreate( carHeatingDuration(state.tOut) );
        return WORKDAYS.includes(state.day) &&
               isTime(startTime, state);
    },
    (act) => {
        act('car2.on');
    });
rule("car.heater.2.off",
    EV_TICK,
    (state) => {
       var stopTime = getVar("car.heater.2");
       return WORKDAYS.includes(state.day) &&
               isTime(stopTime, state);
    },
    (act) => {
        act('car2.off');
    });

//-----------------------------------------------------------------------------
variable("varasto.next.check", [0,0], TYPE_DATE);

rule("varasto.heater.on",
    EV_TICK,
    (state) => {
        if (getVar("varasto.next.check").gt(state.clkCur) ||    // no need for heating
            (state.tOut > 12.0))
            return false;

        if ((state.tVarasto - state.tOut) < 4.0) {
            getVar("varasto.next.check").inc(240);
            return true;
        }
        return false;
    },
    (act) => {

    });
rule("varasto.heater.off",
    EV_TICK,
    (state) => {
       return ((state.tVarasto - state.tOut) > 8.0);
    },
    (act) => {

    });

//-----------------------------------------------------------------------------
rule("naqdaq.check",
    EV_TICK,
    (state) => {
        if ((state.clkCur % 60) != 0)  // check hourly
            return false;
        
        if (between(Math.floor(state.clkCur/60), 9.9, 18))  // only working hours
            return true;

        return false;
    },
    (act) => {
        //nasdaq.read();
    });

rule("weather.check",
    EV_TICK,
    (state) => {
        if ((state.clkCur % 60) != 0)  // check hourly
            return false;
        
        return true;
    },
    (act) => {
        //fmi.fmiRead();
    });

rule("presence.check",
    EV_TICK,
    (state) => {
        return false;
        //return true;
    },
    (act) => {

    });

rule("startup",
     EV_STARTUP,
     (state) => { return true; },
     (act) => {
     });

rule("simulated",
     EV_SIMULATED,
     (state) => { return true; },
     (act) => {
         act(cmd.PLUG_FMI, "readSim");
         act(cmd.PLUG_NASDAQ, "readSim");
     });

//-----------------------------------------------------------------------------
// Test code
//
function test() 
{
    const increment = 1;

    for (let day = 0; day<7; day++) {
        console.log(DAY_NAME[day]);

        gState.day = day;
        gState.clkLast = new v.Time("clk.last", [0,0], false);
        gState.clkCur = new v.Time("clk.cur", [0,increment], false);

        for (let clk = 0; 
                clk < gState.clkCur.MAX_TIME;
                clk += increment) 
        {
            for (let rule of gRules) {
                if (rule.cond(gState)) {
                    console.log(gState.clkCur.toString(), rule.name);
                    rule.act();
                }
            }
            gState.clkCur.inc(increment);
            gState.clkLast.inc(increment);
        }
    }
    console.log(gRules.length);
}


function writeHtml()
{
    var fname = '../HaDash/partials/config2.html';
    var fout = fs.createWriteStream(fname);
    fout.on('error', (err) => {
        log.error("Error in " + fname + ": " + err);
    });
    fout.on('finish', () => {
        log.verbose(fname + " done.");
        //process.exit();
    });

    for (let key of Object.keys(gVariables)) {
        fout.write('<form ng-submit="submit1(\''+key+'\')" ng-controller="ConfigCtrl">\n');
        fout.write('    <label for="'+gVariables[key].value+'">'+key+'</label>\n');
        fout.write('    ' + gVariables[key].html(key) + '\n');
        fout.write('    <input type="submit" class="btn" value="Update">\n');
        fout.write('</form><br>\n');
    }
    fout.end();
}

function loadVars()
{
    var settings = require('./settings.json');
    
    Object.keys(settings).forEach((key) => {
        gVariables[key].setVal(settings[key]);
    });
}

function tick(time, action)
{
    //gState.day = day;
    gState.clkCur.setVal(v.toClock2(time));

    for (let rule of gRules) {
        if (rule.cond(gState)) {
            console.log(gState.clkCur.toString(), rule.name);
            if (rule.act == null)
                action(rule.name);
            else
                rule.act(action);
        }
    }
    gState.clkLast.setVal( gState.clkCur.value);
   
}

/**
 * @param {function(String,String,String)} evHandler
 * @param {String} event
 * @param {Date|String} arg
 */
function event(evHandler, event, arg)
{
    for (let rule of gRules) {
        if (event === rule.event) {
            if (rule.cond(gState)) {
                console.log(gState.clkCur.toString(), rule.name);
                rule.act(action);
            }
        }
    }
}

//test();
//writeHtml();
//loadVars();

gTimer = setInterval(() => {
    //log.normal("timer");
}, 60000);

//clearInterval(gTimer);

//-----------------------------------------------------------------------------
module.exports = {
    getVar: getVar,
    setVar: setVar,
    writeHtml: writeHtml,
    tick: tick,

    event: event,

    EV_TICK: EV_TICK,
    EV_STARTUP: EV_STARTUP,
    EV_SIMULATED: EV_SIMULATED
};
