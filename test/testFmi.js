/*
 * Copyright (C) 2016 Jari Ojanen
 */
var fmi = require("../fmi.js");

fmi.fmiRead(false, function(err,arr) {
    if (err) {
    }
    else {
        console.log(arr);
    }
});
