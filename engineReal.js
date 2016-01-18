var telldus    = require('./telldus.js'),
    log        = require('./log.js'),
    measure    = require('./measure.js');

var gTimer,
    tcloud,
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
        /*item.print(gMeasures);               
        myDweet.send(item);

        if (gMeasures.length > 300)
            gMeasures.shift();*/
    }, (reason) => {
        log.error(reason);
    });      
}

//-------------------------------------------------------------------------------
function init()
{
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
                item.print(gMeasures);               
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


//-----------------------------------------------------------------------------
module.exports = {
    init:  init,
	start: start 
};
