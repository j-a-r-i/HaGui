"use strict";
/*
 * Copyright (C) 2015-7 Jari Ojanen
 */
var mqtt   = require('mqtt'),
    log    = require('./log'),
    config = require('./config.json'),
    v      = require('./var'),
    cmd    = require('./commands');

var mqttClient = mqtt.connect(config.mqttServer),
    gTime;

var values = [
    new v.MValue("t1"),
    new v.MValue("t2"),
    new v.MValue("t3"),
    new v.MValue("h1")
];
 
 //--------------------------------------------------------------------------------
mqttClient.on('connect', () => {
    console.log('mqtt connected');
    mqttClient.subscribe('sensor/#');
});
 
mqttClient.on('message', (topic, msg) => { 
    console.log(topic + " - " + msg.toString());
    if (topic === "sensor/time") {
        gTime.setMinutes(gTime.getMinutes() + 10);
        gMeasure.time = gTime;
        rules.tick(gTime, action);
    }
    else {
        gMeasure.set(topic.substring(7), msg.toString());
        if (topic === "sensor/t2") {
            emitter.emit("temp", msg.toString());
        }
        if (topic === "sensor/h1") {
            //console.log(gMeasure.values());
            //console.log(gMeasure.RedisKey, gMeasure.RedisValue);
            //redisClient.set(gMeasure.RedisKey, gMeasure.RedisValue);
        }
    }
});

//-----------------------------------------------------------------------------
function initialize(cfg)
{
    return values;
}

//-----------------------------------------------------------------------------
module.exports = {
    name: cmd.PLUG_MQTT,
    initialize: initialize,
    action: {
        on: (arg)  => { mqttClient.publish('action/'+arg, "on"); },
        off: (arg) => { mqttClient.publish('action/'+arg, "off"); }
    }
};