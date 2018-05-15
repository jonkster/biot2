#!/usr/bin/node

// this application simulates data from edge router
//

//var brokerAddress = '192.168.0.30';
var brokerAddress = '10.1.1.61';
//var brokerAddress = '0.0.0.0';
//var brokerAddress = '192.168.0.193';
var brokerPort = 8888;

var random = false;

var nodes = [
        'affe:dead:beef::122',
        'affe:dead:beef::123',
        'affe:dead:beef::124',
        'affe:dead:beef::125',
        'affe:dead:beef::126',
        'affe:dead:beef::127'
]

var quats = [];

var glq = require('gl-quat');

var dgram = require('dgram');
sendAdvert();

//process.exit();

var c = 0;
setInterval(function() {
        calcQuats();
        for (var i = 0; i < nodes.length; i++) {
            sendOrientation(nodes[i], c);
            if (c % 100 === 0) {
                sendAdvert();
            }
            if (c % 100 === 0) {
                sendStatus(nodes[i]);
            }
            if (c % 50 === 0) {
                sendCalibration(nodes[i]);
            }
        }
        c++;
}, 150);

var count = 0;
function calcQuats() {
	count += 0.2;
	for (var i = 0; i < nodes.length; i++) {
		let addr = nodes[i];
		let qIndex = nodes[i + 1];
		if (qIndex === undefined) {
			qIndex = nodes[0];
		}
		let prevQ = quats[qIndex];
		if (prevQ === undefined) {
			prevQ = glq.create();
		} else {
			if (random) {
				var dx = (0.4 - Math.random()) / 500;
				var dy = (0.4 - Math.random()) / 300;
				var dz = (0.4 - Math.random()) / 10;
				var dw = (0.4 - Math.random()) / 40;
				prevQ[0] += dx + 0.2;
				prevQ[1] += dy + 0.2;
				prevQ[2] += dz;
				prevQ[3] += dw;
			} else {
				prevQ[0] += 0.2 * Math.sin(count/Math.PI);
				prevQ[2] += 0.1 * Math.cos(count/Math.PI);
			}
		}
		glq.normalize(prevQ, prevQ);
		quats[addr] = prevQ
	}
}

function sendOrientation(addr, time) {
        let q = quats[addr];
        sendToBroker('do#' + time + ':' +
                q[0] + ':' +
                q[1] + ':' +
                q[2] + ':' +
                q[3] + ':' +
                '#' + addr);
}

function sendStatus(addr) {
        sendToBroker('ds#1:1:1#' + addr);
}

function sendCalibration(addr) {
        sendToBroker('dc#-100:-100:-100:100:100:100:0#' + addr);
}

function sendAdvert() {
    sendToBroker('biot er on port ' + brokerPort)
}


function sendToBroker(msg) {
        var client = dgram.createSocket('udp4')
        var message = new Buffer(msg);
        client.send(message, 0, message.length, brokerPort, brokerAddress, function(err, bytes) {
                if (err) throw err;
                client.close();
        });
}
