"use strict";

var events = require('events');
var eventEmitter = new events.EventEmitter();

class One {
	constructor(ev)
	{
		this.a = 10;
		this.b = 20;
		
		ev.on("temp", (temp) => {
			console.log(temp);
		});
	}
}

class Two {
	constructor(ev)
	{
		this.aa = 11;
		this.bb = 22;
	}
}



var c1 = new One(eventEmitter);
var c2 = new Two(eventEmitter);



eventEmitter.emit("temp", 12.2);

console.log(c1);

c1.a = 321;

console.log(c1);

