/*
 * Copyright (C) 2016 Jari Ojanen
 */
var measure = require("./measure.js");

var m = new measure.MeasureData();


function prettyJson(obj)
{
    var dup = {};
    for (var key in obj) {
        if (key === "items") {
            var obj2 = obj[key];
            for (var key2 in obj2) {
                if (obj2[key2] instanceof measure.MeasureValue) {
                    dup[obj2[key2].shortName] = obj2[key2].value;
                }
            }
        }
        else {
            dup[key] = obj[key];
        }        
    }
    return dup;
}

var headers = ["a","b","c"];
var data = [1,2,3];

var obj = {}
for (var i in headers) {
    obj[headers[i]] = data[i];
};
console.log(obj);

prettyJson(m);

console.log(JSON.stringify(prettyJson(m)));

m.temp1 = 1;

console.log(JSON.stringify(prettyJson(m)));

m.temp2 = 1;

console.log(JSON.stringify(prettyJson(m)));

m.temp3 = 1;

console.log(JSON.stringify(prettyJson(m)));
