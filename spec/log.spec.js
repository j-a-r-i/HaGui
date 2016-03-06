"use strict";
/*
 * Copyright (C) 2015 Jari Ojanen
 */
var log = require('../log.js');

var d = new Date();

describe("log history", () => {
    it("should remember one item", () => {		
	log.history(d, "one");

	var h = log.getHistory();

	expect(h.length).toBe(1);
    });
});

describe("log errors", () => {
});

describe("log normal", () => {
});

describe("log verbose", () => {
});
