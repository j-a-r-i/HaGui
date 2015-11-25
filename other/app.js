var express = require('express');
var app = express(),
    info = require('./info.js');

function tag(t, value)
{
   return `<${t}>${value}</${t}>`;
}

function link(url, name)
{
  return `<a href="${url}">${name}</a>`;
}

function getList()
{
  var ret = [];
  var mem = info.meminfo();
  var load = info.loadavg();
  var uptime = info.uptime();

  ret.push(`Memory free: ${Math.ceil(mem.MemFree / 1024)} / ${Math.ceil(mem.MemTotal / 1024)}`);
  //ret.push(JSON.stringify(mem));
  ret.push(`Uptime ${uptime[0]}  idle ${uptime[1]}`);
  ret.push(JSON.stringify(load ));

  return ret;
}

function getLinks()
{
  var list = [ link("http://www.finnair.com/fi/fi/bookings", "Finnair"),
               link("http://www.finnmatkat.fi/", "Finnmatkat"),
               link("http://www.lumipallo.fi/hiihtokeskukset/ruotsi-ja-norja/geilo/", "Gailo"),
               link("http://www.matkailijat.net/lueBlogi/268-unohdettu-norja---talven-ja-kesan-parhaat-laskettelukeskukset-norjassa/", "norja"),
               link("http://www.booking.com/hotel/no/dr-holms.fi.html?aid=311095;label=dr-holms-_IIGe9nmHBNUFzSL4PlGvwS5754794349%3Apl%3Ata%3Ap1%3Ap2%3Aac%3Aap1t1%3Aneg%3Afi%3Atikwd-4263447681%3Alp1005576%3Ali%3Adec%3Adm;sid=3f8774be36002da5e8c898ce8a71dfc7;dcid=1;checkin=2016-01-09;checkout=2016-01-13;dist=0;room1=A%2CA;sb_price_type=total;srfid=7a1804b7a809bc4826acf2e9ffa69d3b40355f12X1;type=total;ucfs=1&", "DrHolms")
		]

  return list.map((x) => { return tag('li', x) });
}

app.get('/', function (req, res)
{
  var data = getList().map((x) => { return tag('li', x) });

  var str = tag('ul', data.join('\n'));
  
  str += tag('b', 'Links');
  str += tag('ul', getLinks().join('\n'));
 
  console.log('fetch homepage');
  res.send(str);
});

var server = app.listen(80, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

