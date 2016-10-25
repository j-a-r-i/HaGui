var mqtt = require('mqtt');
var config = require('../config.json');

var client  = mqtt.connect(config.mqttServer);
var gTimer;
var gCounter = 0;
var simFast = true;

//--------------------------------------------------------------------------------
var gItems = [
    { name: 'sensor/t1',
      value: 2.0,
      min: -5.0,
      max: 5.0},
    { name: 'sensor/t2',
      value: 10.0,
      min: 5.0,
      max: 10.0},
    { name: 'sensor/t3',
      value: 22.0,
      min: 18.0,
      max: 23.0},
    { name: 'sensor/h1',
      value: 40,
      min: 30,
      max: 60}
];

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
function onTimer()
{
    //gTime.setMinutes(gTime.getMinutes() + 10);
    
    //item.tm = new Date(gTime);
    gItems.forEach((i) => {
        simOffset(i);
        client.publish(i.name, i.value.toString());
        //client.publish(i.name, "test");
    });
    
    //gEmitter.emit("measure", item);
    gCounter++;
    if (gCounter > 300) {
        if (simFast) {
            log.normal("slow mode updating simulated data");
            simFast = false;
            clearInterval(gTimer);
            gTimer = setInterval(timer1simulated, 2000);
        }    
    } 
    //gEmitter.emit("tick", gTime);
}

//--------------------------------------------------------------------------------
client.on('connect', () => {
  console.log('connected');
  client.subscribe('sensor/#');
  client.subscribe('action');

  gTimer = setInterval(onTimer, 100);  // 0.1 sec
});
 
client.on('message', (topic, msg) => { 
  console.log(topic + " - " + msg.toString());
  //client.end()
});