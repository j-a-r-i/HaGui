var telldus = require('./telldus.js');
var mqtt    = require('mqtt');

var gTimer,
    gEmitter,
    tcloud,
    gLights,
    gCar1,
    gCar2;

var client  = mqtt.connect('mqtt://192.168.100.38')

//--------------------------------------------------------------------------------
// A periodic timer for reading data from Telldus server.
//
function onTimer()
{
    console.log("onTimer");
    
    Promise.all([tcloud.sensor(0), tcloud.sensor(1)]).then((values) => {
        values.forEach((i) => {
            i.forEach((k) => {
                client.publish('sensor/'+k[0], k[1]);
            });
        });
    }, (reason) => {
        //log.error(reason);
        console.log(reason);
    });      
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
client.on('connect', () => {
  console.log('connected');
  client.subscribe('action');

  onTimer();
  gTimer = setInterval(onTimer, 600000);  // 10 min
});

client.on('message', (topic, msg) => { 
  console.log(topic + " - " + msg.toString())
  //client.end()
});

//--------------------------------------------------------------------------------
tcloud = new telldus.Telldus();

tcloud.init((err) => {
    if (!!err) {
        log.error(err);
    }
    else {
        gLights = tcloud.getDevice("valot1");
        gCar1   = tcloud.getDevice("auto1");
        gCar2   = tcloud.getDevice("auto2");
    }
});
