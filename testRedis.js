const redis = require('./redis');
//import * as redis from './redis';

async function test1()
{
    var keys = await redis.keys();

    var values = await redis.value("pc.sda2");

    keys.forEach(async (i) => {
        var length = await redis.length(i);
        console.log(i + " " + length);  
    });

    console.log(keys);
    console.log(values);
}

test1();

