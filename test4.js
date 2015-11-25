var strict = true,
    options = {},
    fs = require('fs'),
    saxStream = require("sax").createStream(strict, options);
    
var fInsideList = false,
    fInsidePos = false;   
 
saxStream.on("error", function (e) {
  // unhandled errors will throw, since this is a proper node
  // event emitter.
  console.error("error!", e)
  // clear the error
  this._parser.error = null
  this._parser.resume()
})
saxStream.on("opentag", function (node) {
  switch (node.name) {
    case "gml:doubleOrNilReasonTupleList":
       fInsideList = true;
       break;
    case "gmlcov:positions":
       fInsidePos = true;
       break;
  }
})
saxStream.on("closetag", function (name) {
  switch (name) {
    case "gml:doubleOrNilReasonTupleList":
       fInsideList = false;
       break;
    case "gmlcov:positions":
       fInsidePos = false;
       break;
  }
})
saxStream.on("text", function (data) {
  //console.log(data);
  if (fInsideList) {
    var arr = data.trim().split("\n");
    console.log(arr);
  }
  if (fInsidePos) {
    var arr = data.trim().split("\n");
    console.log(arr);
  }
});


//-----------------------------------------------------------------------------
fs.createReadStream("wfs.xml")
  .pipe(saxStream)
  .pipe(fs.createWriteStream("foo.xml"));