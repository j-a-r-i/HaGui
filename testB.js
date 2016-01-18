var nasdaq = require('./nasdaq.js'),
    rss    = require('./rss.js'),
    strava = require('./strava.js');
    
    
var readers = [ //new nasdaq.Nasdaq(),
                //new rss.RSS(),
                new strava.Strava()
              ];
                

readers[0].download().then((res) => {
    console.log(res);
});
                
/*
readers.forEach((obj) => {
    obj.download();
    console.log("--------------------------------------------" + obj.name);
    console.log(obj.result);
})*/ 
