/*
 * Copyright (C) 2015-6 Jari Ojanen
 */
var measure = require('./measure.js'),
    log     = require('./log.js');

var simFast = true,
    gCounter = 0,
    gEmitter,
    gTimer1,
    gTime = new Date(),
    item = new measure.MeasureData();


const INDEX_T1 = 0;
const INDEX_T2 = 1;
const INDEX_T3 = 2;
const INDEX_H1 = 3;

item.items[INDEX_T1].value = 2.0;
item.items[INDEX_T1].min = -5.0;
item.items[INDEX_T1].max = 5.0;

item.items[INDEX_T2].value = 10.0;
item.items[INDEX_T2].min = 5.0;
item.items[INDEX_T2].max = 10.0;

item.items[INDEX_T3].value = 22.0;
item.items[INDEX_T3].min = 18.0;
item.items[INDEX_T3].max = 23.0;

item.items[INDEX_H1].value = 40.0;
item.items[INDEX_H1].min = 30.0;
item.items[INDEX_H1].max = 60.0;


//--------------------------------------------------------------------------------
function random (low, high)
{
    return Math.random() * (high - low) + low;
}

//--------------------------------------------------------------------------------
function simOffset(item)
{
    var offset = random(-0.5, 0.5);

    if (item.value < item.min)
	   offset = Math.abs(offset);
    if (item.value > item.max)
	   offset = -Math.abs(offset);
    item.value += offset;
}

//--------------------------------------------------------------------------------
function timer1simulated()
{
    //console.log("timer1simulated");
    
    gTime.setMinutes(gTime.getMinutes() + 10);
    
    item.tm = new Date(gTime);
    item.items.forEach((i) => {
        simOffset(i);
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
