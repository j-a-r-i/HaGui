"use strict";
/*
 * Copyright (C) 2015 Jari Ojanen
 */
var log = require('./log.js');
 
 
log.history({time: new Date(),
	     action: "one",
	     state: 1});

log.history({time: new Date(),
	     action: "two",
	     state: 2});

console.log(log.getHistory());
