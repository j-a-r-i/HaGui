//var cmd = require('./commands.js');

//var wsUri = "ws://192.168.100.40:8080/";
var wsUri = "ws://localhost:8080/";
//var output;
var stat = null;
var callbacks = {};
var websocket = null;

const CMD_DATA1 ="cmd1";
const CMD_DATA2 ="cmd2";
const CMD_DATA3 ="cmd3";
const CMD_WEATHER = "cmd4";
const CMD_STATUS = "stat";
const CMD_SETVAL = "sval";
const CMD_GETVAL = "gval";
const CMD_SCHEDULERS = "sche1";
const CMD_PING = "ping";


google.load("visualization", "1", {packages:["corechart","table"]});

function init()
{
    //output = document.getElementById("output");

    websocket = new WebSocket(wsUri);
    websocket.onopen = onOpen;
    websocket.onclose = onClose;
    websocket.onmessage = onMessage;
    websocket.onerror = onError;
}

function updateWeather()
{
    send(CMD_WEATHER, {})
    .then(function(msg) {
        var arr = [["Time", "Temp"]];
        var data = msg.data;
        data.forEach(function(i) {
           if (i != null) {
               arr.push([new Date(i.date), parseFloat(i.temp)]);
           } 
        });
        drawLine("chart4", "Forecast", arr, false);
    });
}


function updateCharts()
{
    send(CMD_DATA1, {})
    .then(function (msg) {
        console.log(msg);
        drawLine("chart1", "Temperature", msg.data, true);
        return send(CMD_DATA2, {});
    })
    .then(function (msg) {
        console.log(msg);
        drawLine("chart2", "Humidity", msg.data, true);
        return send(CMD_DATA3, {});
    })
    .then(function (msg) {
        drawTable("chart3", "None", msg.data, true);
        console.log(data);               
    })
}

function onOpen(evt)
{
    updateCharts();
}

function onClose(evt)
{
}

function drawPie(ctrl, name, msg)
{
    var resp = JSON.parse(msg);
    var data = google.visualization.arrayToDataTable(resp);
    var options = { title: name,
		    legend: 'none'};
    var chart = new google.visualization.PieChart(document.getElementById(ctrl));
    chart.draw(data, options);
}

function drawLine(ctrl, name, msg, parse)
{
    var resp2;
    
    if (parse === true) {
        resp2 = msg.map(function(line) {
            if (line[0] === "time")
                return line;
            line[0] = new Date(line[0]);
            return line;
        });
    }
    else {
        resp2 = msg;
    }
    var data = google.visualization.arrayToDataTable(resp2);
    var options = { title: name,
                    curveType: 'none',
                    hAxis: { format: 'HH:mm' },
                    legend: { position: 'bottom' }
                  };

    var formatter = new google.visualization.DateFormat({pattern: 'HH:mm'});
    formatter.format(data, 1);

    var chart = new google.visualization.LineChart(document.getElementById(ctrl));
    chart.draw(data, options);
}

function drawTable(ctrl, name, msg)
{
    var data = google.visualization.arrayToDataTable(msg);
    var options = { showRowNumber: true,
		            legend: 'none'};
    var table = new google.visualization.Table(document.getElementById(ctrl));
    table.draw(data, options);
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
  $scope.commands = [CMD_DATA1,
                     CMD_DATA2,
                     CMD_DATA3];
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
