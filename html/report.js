//var cmd = require('./commands.js');

//var wsUri = "ws://192.168.100.40:8080/";
var wsUri = "ws://localhost:8080/";
//var output;
var stat = null;
var callbacks = {};
var websocket = null;

const CMD_MEASURES = "meas";
const CMD_STOCK    = "stoc";
const CMD_TV       = "tv";
const CMD_LATEST   = "last";
const CMD_WEATHER  = "weat";
const CMD_STATUS   = "stat";
const CMD_SETVAL   = "sval";
const CMD_GETVAL   = "gval";
const CMD_SCHEDULERS = "sche";
const CMD_PING = "ping";


google.charts.load("current", {packages:["corechart","table"]});

//------------------------------------------------------------------------------
function init()
{
    //output = document.getElementById("output");

    websocket = new WebSocket(wsUri);
    websocket.onopen = onOpen;
    websocket.onclose = onClose;
    websocket.onmessage = onMessage;
    websocket.onerror = onError;
}

//------------------------------------------------------------------------------
function updateCharts()
{
    send(CMD_MEASURES, {})
        .then(function (msg) {
            drawTemperature(msg.data);
            return send(CMD_WEATHER, {});
        })
        .then(function (msg) {
            drawWeather(msg.data);
        })
        .fail(function (err) {
            alert(err);
        })
}

//------------------------------------------------------------------------------
function updateStock()
{
    send(CMD_STOCK, {})
        .then(function (msg) {
            var arr = [];
            
            msg.data.forEach(function(i) {
                arr.push([new Date(i[0]), i[1], i[3], i[5], i[6], i[7], i[8] ]);
            });
            drawLine("stock1", "Group1", arr);

            var arr2 = [];
            msg.data.forEach(function(i) {
                arr2.push([new Date(i[0]), i[2], i[4], i[9]]);
            });
            drawLine("stock2", "Group2", arr2);
            
        })
        .fail(function (err) {
            alert(err);
        });
}

//------------------------------------------------------------------------------
function onOpen(evt)
{
    //updateCharts();
}

//------------------------------------------------------------------------------
function onClose(evt)
{
}

//------------------------------------------------------------------------------
function drawPie(ctrl, name, msg)
{
    var resp = JSON.parse(msg);
    var data = google.visualization.arrayToDataTable(resp);
    var options = { title: name,
		    legend: 'none'};
    var chart = new google.visualization.PieChart(document.getElementById(ctrl));
    chart.draw(data, options);
}

function drawLine(ctrl, name, arr)
{
    var data = google.visualization.arrayToDataTable(arr);
    var options = { title: name,
                    curveType: 'none',
                    hAxis: { format: 'HH:mm',
                             textStyle: {color: 'khaki'}},
                    vAxis: { textStyle: {color: 'khaki'}},
                    //colors: ['lightblue', 'lightred', 'lightgreen'],
                    titleTextStyle: { color: 'khaki'},
                    legendTextStyle: { color: 'khaki' },
                    backgroundColor: '#3F3F3F',
		            chartArea: {width: '85%',
				                height: '75%'},
                    legend: { position: 'bottom' }
                  };

    var formatter = new google.visualization.DateFormat({pattern: 'HH:mm'});
    formatter.format(data, 1);

    var chart = new google.visualization.LineChart(document.getElementById(ctrl));
    chart.draw(data, options);
}

function drawTemperature(msg)
{
    var arr = [];
    
    msg.forEach(function(i) {
        arr.push([new Date(i[0]), i[1], i[2]]);
    });
    drawLine("chart1", "Temperature", arr);

    var arr2 = []; //[["time", "h1"]];
    msg.forEach(function(i) {
        arr2.push([new Date(i[0]), i[4]]);
    });
    drawLine("chart2", "Humidity", arr2);    
}

function drawWeather(msg)
{
    var arr = [];
    msg.forEach(function(i) {
        arr.push([new Date(i[0]), i[1], i[2], i[3]]);
    });
    drawLine("chart4", "Forecast", arr);
    
/*    var ctrl = "chart4";
    var data = google.visualization.arrayToDataTable(msg);
    var options = { showRowNumber: true,
		            legend: 'none'};
    var table = new google.visualization.Table(document.getElementById(ctrl));
    table.draw(data, options);*/
}

function onMessage(evt)
{
    //writeToScreen('<span style="color: blue;">'+cmd+': ' + JSON.stringify(resp)+'</span>');
    var msg = JSON.parse(evt.data);
    
    if (callbacks.hasOwnProperty(msg.cmd)) {
        callbacks[msg.cmd].defer.resolve(msg);
        delete callbacks[msg.cmd];
    }
}

function onError(evt)
{
    //writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
    alert('ERROR: ' + JSON.stringify(evt));
}

function send(command, request)
{
    var deferred = Q.defer();
    
    callbacks[command] = {
        defer: deferred
    };
    
    request.cmd = command;

    websocket.send(JSON.stringify(request));
    return deferred.promise;
}


function writeToScreen(message)
{
    var pre = document.createElement("p");
    pre.style.wordWrap = "break-word";
    pre.innerHTML = message;
    output.appendChild(pre);
}

window.addEventListener("load", init, false);

//------------------------------------------------------------------------------

var app = angular.module('haApp', ['ngRoute']);

app.config(function($routeProvider) {
    $routeProvider
        .when('/', {
	        controller: 'HomeCtrl',
	        templateUrl: 'partials/home.html'
        })
        .when('/home', {
	        controller: 'HomeCtrl',
	        templateUrl: 'partials/home.html'
        })
        .when('/stock', {
	        controller: 'StockCtrl',
	        templateUrl: 'partials/stock.html'
        })
        .when('/tv', {
	        controller: 'TvCtrl',
	        templateUrl: 'partials/tv.html'
        })
        .when('/config', {
	        controller: 'ConfigCtrl',
	        templateUrl: 'partials/config.html'
        })
        .when('/status', {
	        controller: 'StatusCtrl',
	        templateUrl: 'partials/status.html'
        })
        .when('/schedulers', {
	        controller: 'ScheCtrl',
	        templateUrl: 'partials/schedulers.html'
        })
        .otherwise({ redirecTo: '/' });
});

app.controller('HomeCtrl', ['$scope', function ($scope) {
  console.log("HomeCtrl");
  $scope.commands = [CMD_MEASURES,
                     CMD_LATEST];
    
  
  send(CMD_LATEST, {})
  .then(function(msg) {
    $scope.temp1 = msg.values.t1;
    $scope.temp2 = msg.values.t2;
    $scope.temp3 = msg.values.t3;

    $scope.$apply();
    
    return send(CMD_MEASURES, {});
  })
  .then(function(msg) {
    drawTemperature(msg.data);
    
    return send(CMD_WEATHER, {});  
  })
  .then(function(msg) {
    drawWeather(msg.data);  
  })
  .fail(function(err) {
      alert(err);
  });
}]);

app.controller('StockCtrl', ['$scope', function ($scope) {
    $scope.values = [];
    updateStock();
}]);

app.controller('TvCtrl', ['$scope', function ($scope) {
    $scope.values = [];
}]);

function createDate(hour, min)
{
    var ret = new Date();
    
    ret.setHours(hour);
    ret.setMinutes(min);
    ret.setSeconds(0);
    ret.setMilliseconds(0);
    
    return ret;
}

app.controller('ConfigCtrl', ['$scope', function ($scope) {
    send(CMD_GETVAL, {action:'car1'})
    .then(function(msg) {
        $scope.car1 = msg.values;
        $scope.$apply();
    });
    //$scope.car1={}
    //$scope.car1.leaveTime = createDate(7,35);
    $scope.car2={}
    $scope.car2.leaveTime = createDate(8,15);
    $scope.light={}
    $scope.light.startTime = createDate(16, 0);
    $scope.light.stopTime  = createDate(20, 30);
    $scope.weather={}
    $scope.weather.interval = 45;
    
    $scope.submit1 = function(name) {
        var date = new Date($scope.car1Leave);

        send(CMD_SETVAL, { action: name, 
                           values: { leaveTime: [date.getHours(), date.getMinutes()] }
                         });
        console.log("CAR1 :" + $scope.car1Leave);
    };
}]);

app.controller('StatusCtrl', ['$scope', function ($scope) {
    send(CMD_STATUS, {})
    .then(function(msg) {
        $scope.ver = msg.ver;
        $scope.data = msg.errors;
        $scope.history = msg.history;
        $scope.$apply();
    });
    
    $scope.update = function() {
        stat = $scope;
        send(CMD_STATUS, {});  
    };
}]);

app.controller('ScheCtrl', ['$scope', function($scope) {
    send(CMD_SCHEDULERS, {})
    .then(function(msg) {
        $scope.items = msg.items;
        $scope.$apply();
    });

    $scope.submit = function(name) {
        alert(name);
    }
    
    $scope.conv = function(name, val) {
        if (name.indexOf("Time") > 0) {
            var hours = Math.floor(val / 60);
            var mins  = val % 60;
            
            return "" + hours + ":" + mins;
        }
        return val;
    }
}]);
