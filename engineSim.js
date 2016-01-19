var measure = require('./measure.js'),
    log     = require('./log.js');

var simFast = true,
    gCounter = 0,
    gEmitter,
    gTimer1,
    gTime = new Date(),
    item = new measure.MeasureData();

///@TODO: this is duplicate remote it.
const SENSORS_NAMES = ["ulko.temp",
                       "varasto.temp",
                       "varasto.humidity"];

var simData = [ { name: SENSORS_NAMES[0],
                  value: 2.0,
                  min: -5.0,
                  max: 5.0},
                { name: SENSORS_NAMES[1],
                  value: 10.0,
                  min: 5.0,
                  max: 15.0},
                { name: SENSORS_NAMES[2],
                  value: 40.0,
                  min: 30.0,
                  max: 60.0}];

//--------------------------------------------------------------------------------
function random (low, high)
{
    return Math.random() * (high - low) + low;
}

//--------------------------------------------------------------------------------
function simOffset(value, min, max)
{
    var offset = random(-0.5, 0.5);

    if (value < min)
	   offset = Math.abs(offset);
    if (value > max)
	   offset = -Math.abs(offset);
    return offset;
}

//--------------------------------------------------------------------------------
function timer1simulated()
{
    //console.log("timer1simulated");
    
    gTime.setMinutes(gTime.getMinutes() + 10);
    
    item.time = new Date(gTime);
    simData.forEach(function(data) {
        data.value += simOffset(data.value, data.min, data.max);
        item.setItem(data.name, data.value);       
    });
    
    gEmitter.emit("measure", item);
    gCounter++;
    if (gCounter > 300) {
        if (simFast) {
            log.normal("slow mode updating simulated data");
            simFast = false;
            clearInterval(gTimer1);
            gTimer1 = setInterval(timer1simulated, 2000);
        }    
    }
    
    gEmitter.emit("tick", gTime);
}

//-------------------------------------------------------------------------------
function init(emitter)
{
    gEmitter = emitter;
}

//--------------------------------------------------------------------------------
function start()
{
  gTimer1 = setInterval(timer1simulated, 100);  // 1 sec
  /*fmi.fmiRead(simulated, function(err,arr) {
      if (err) {
          log.error(err);
      }
      else {
        gWeather = arr;
      }
  });*/
}

//--------------------------------------------------------------------------------
function action(name, state)
{
    var stateNames = ['off', 'on'];

    log.normal(name + ' ' + stateNames[state]);
    
    switch (name) {
    case measure.ACTION_CAR1:
        break;
    case measure.ACTION_CAR2:
        break;
    case measure.ACTION_LIGHT:
        break;
    case measure.ACTION_LIGHT2:
        break;
    case measure.ACTION_ROOM:
        break;
    case measure.ACTION_WEAT:
        break; 
    }
}

//--------------------------------------------------------------------------------
function time()
{
    return gTime;
}

//-----------------------------------------------------------------------------
module.exports = {
    init:  init,
   	start: start,
    action: action,
    time: time,
    isSimulated: true
};
