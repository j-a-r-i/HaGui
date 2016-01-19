var telldus    = require('./telldus.js'),
    log        = require('./log.js'),
    measure    = require('./measure.js');

var gTimer,
    gEmitter,
    tcloud,
    gLights,
    gCar1,
    gCar2,
    item = new measure.MeasureData();
    
//--------------------------------------------------------------------------------
// A periodic timer for reading data from Telldus server.
//
function timer1()
{
    console.log("timer1");
    
    Promise.all([tcloud.sensor(0), tcloud.sensor(1)]).then((values) => {
        item.time = new Date();              
        values.forEach((i) => {
            i.forEach((i2) => {
                item.setItem(i2[0], i2[1]);             
            });
        });
        
        gEmitter.emit("measure", item);
    }, (reason) => {
        log.error(reason);
    });      
}

//-------------------------------------------------------------------------------
function init(emitter)
{
    gEmitter = emitter;
    
    tcloud = new telldus.Telldus();
    
    tcloud.init((err) => {
        if (!!err) {
            log.error(err);
        }
        else {
            gLights = tcloud.getDevice("valot1");
            gCar1   = tcloud.getDevice("auto1");
            gCar2   = tcloud.getDevice("auto2");
            Promise.all([tcloud.sensor(0), tcloud.sensor(1)]).then((values) => {
                item.time = new Date();              
                values.forEach((i) => {
                    i.forEach((i2) => {
                        item.setItem(i2[0], i2[1]);             
                    });
                });
                gEmitter.emit("measure", item);
            }, (reason) => {
                log.error(reason);
            });
        }
    });}

//-------------------------------------------------------------------------------
function start()
{
    gTimer = setInterval(timer1, 600000);  // 10 min
}

//--------------------------------------------------------------------------------
function action(name, state)
{
    switch (name) {
    case measure.ACTION_CAR1:
        if (gCar1) 
            tcloud.power(gCar1, state).then();
        break;
    case measure.ACTION_CAR2:
        if (gCar2) 
            tcloud.power(gCar2, state).then();
        break;
    case measure.ACTION_LIGHT:
        if (gLights) 
            tcloud.power(gLights, state).then();
        break;
    case measure.ACTION_LIGHT2:
        if (gLights) 
            tcloud.power(gLights, state).then();
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
    return new Date();
}

//-----------------------------------------------------------------------------
module.exports = {
    init:  init,
	start: start,
    action: action,
    time: time,
    isSimulated: false
};
