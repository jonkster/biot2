#!/usr/bin/node

// this application saves data from biot nodes
//
var VERSION = "0.0.0";

var BIOTZ_UDP_PORT = 8888;
var ip = require('ip');
var UDP_LOCAL_HOST = ip.address();

var BIOTZ_ROUTER_HOST = undefined;

var nodeCache = {};

var dataCache = [];

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;

var heartBeatInterval = 5000;


var biotDataSchema = new Schema({
  address:  String,
  do: String,
  dc: String,
  ds: String,
  updated_at: { type: Date, default: Date.now }
});

var recordedOrientationSchema = new Schema({
  name:  String,
  active: { type: Boolean, default: false },
  start: Number,
  stop: Number,
  data: [String],
  updated_at: { type: Date, default: Date.now }
});

var edgeRouterSchema = new Schema({
  name: String,
  updated_at: { type: Date, default: Date.now }
});

let recordingOverlong = {};

mongoose.connect('mongodb://localhost:27017/mydb', { useMongoClient: true, promiseLibrary: global.Promise });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
		console.log("connected to data store"); 
		var nodeData = mongoose.model('BiotData', biotDataSchema);
		var edgeRouter = mongoose.model('EdgeRouter', edgeRouterSchema);
		var recordedData = mongoose.model('RecordedData', recordedOrientationSchema);

		edgeRouter.remove({}, function(data) { console.log('initialise edge router...')} );
		nodeData.remove({}, function(data) { console.log('initialise node data...')} );

		var startTime = 0;
		// Listen to Biotz Router device
		var dgram = require('dgram');
		var brokerUdpListener = dgram.createSocket({type: 'udp4', reuseAddr: true});
		brokerUdpListener.bind({port: BIOTZ_UDP_PORT, address: '0.0.0.0'});


                brokerUdpListener.on('listening', function () {
                    brokerUdpListener.setBroadcast(true);
                    var address = brokerUdpListener.address();
                    console.log('UDP Server listening on ' + address.address + ":" + address.port);
                    startTime = new Date();

                });

                let recordingCache = [];
                let recordingActive = {};

                setInterval(function() {
                    heartBeat(recordedData, recordingActive, recordingCache);
                }, heartBeatInterval);

                var lastT = {}; // = new Date().getTime();
		// received an update message - store info
                var avDelay = 0;
                var delays = {};
		brokerUdpListener.on('message', function (message, remote) {
			if (remote.size > 0)
			{
				var dirty = false;
				var msgSt = message.toString();
				var bits = msgSt.split('#');
				var address = bits[2];
				var node = nodeCache[address];
				if (node === undefined) {
					node = {
						address: address,
						do: null,
						dc: null,
						ds: null,
					};
				}
				if (bits[0] == 'do') {
					if (true || bits[1].match(/[0-9]+:[\-0-9\.]+:[\-0-9\.]+:[\-0-9\.]+:[\-0-9\.]+/)) {
						dirty = true;
						node['do'] = bits[1];
                                                var now = new Date().getTime();
                                                if (lastT[address] === undefined) {
                                                        lastT[address] = now;
                                                }
                                                var del = now - lastT[address];
                                                avDelay = (del + avDelay) / 2;
                                                if (delays[address] === undefined) {
                                                    delays[address] = 0;
                                                }
                                                if (del > 40) {
                                                    console.log('slow', address, del);
                                                    let addresses = Object.keys(lastT);
                                                    for (let i = 0; i < addresses.length; i++) {
                                                        if (addresses[i] !== address) {
                                                            delays[addresses[i]]++;
                                                        }
                                                    }
                                                    if (delays[address] > 1) {
                                                        delays[address] = 0;
                                                        //sendInhibit(address, 0);
                                                    }
                                                } else if (del < 30) {
                                                    if (delays[address] > 0) {
                                                        //sendInhibit(address, delays[address]);
                                                    }
                                                }
                                                lastT[address] = now;
					} else {
					    console.log('scrambled do', message);
					}
				} else if (bits[0] == 'dc'){
					if (bits[1].match(/[\-0-9]+:[\-0-9]+:[\-0-9]+:[\-0-9]+:[\-0-9]+:[\-0-9]+/)) {
						dirty = true;
						node['dc'] = bits[1];
					} else {
					    console.log('scrambled dc', message);
					}
				} else if (bits[0] == 'ds'){
					if (bits[1].match(/[0-9]+:[0-9]+:[0-9]+/)) {
						dirty = true;
						node['ds'] = bits[1];
					} else {
					    console.log('scrambled ds', message);
					}
				} else if (bits[0] == 'da'){
					if (BIOTZ_ROUTER_HOST !== undefined) {
						var name = BIOTZ_ROUTER_HOST;
						if (bits[1].match(/(.+)/)) {
							name = bits[1];
						}
						edgeRouter.findOneAndUpdate({name: name}, {name: name}, {upsert:true}, function(err, data) {
								if (err) { return console.error('ERR', err); }
								});
					}
                                } else {
                                    let er = "";
                                    if (er = msgSt.match(/biot er on port (\d+)/)){
					BIOTZ_ROUTER_HOST = remote.address;
					edgeRouter.findOneAndUpdate({name: remote.address}, {name: remote.address}, {upsert:true}, function(err, data) {
							if (err) { return console.error('ERR', err); }
							});
                                        sendBroadcastResponse(remote, er[1]);
                                    } else {
                                        console.log("wah?", message.toString());
                                    }
                                }
				if (dirty) {
                                        if (BIOTZ_ROUTER_HOST  === undefined) {
                                            BIOTZ_ROUTER_HOST = remote.address;
                                            edgeRouter.findOneAndUpdate({name: remote.address}, {name: remote.address}, {upsert:true}, function(err, data) {
                                                            if (err) { return console.error('ERR', err); }
                                                            });
                                            sendBroadcastResponse(remote, remote.port);
                                        }
					nodeCache[address] = node;
					nodeData.findOneAndUpdate({address: address}, node, {upsert:true}, function(err, data) {
						if (err) { return console.error('ERR', err); }
					});
                                        if (recordingActive[address]) {
                                            if (bits[0] === 'do' ) {
                                                recordingCache[address].push(node['do']);
                                            }
                                        } else {
                                            recordingCache[address] = [];
                                        }
				}
			} else {
				console.log("empty message?", remote);
			}
		});
});

function sendBroadcastResponse(remote, port) {
    console.log(remote, port);
    let pout = parseInt(port) + 2;
    var dgram = require('dgram');
    var message = Buffer.from(UDP_LOCAL_HOST + ":" + BIOTZ_UDP_PORT);
    var client = dgram.createSocket('udp4');
    client.send(message, 0, message.length, pout, remote.address, function(err, bytes) {
        if (err) {
            console.log('Error:', err);
        } else {
            console.log('sent broadcast response to remote at', remote.address, 'port', pout, 'resp=', message.toString());
        }
        client.close();
    });
}

function sendInhibit(address, count) {
	if (BIOTZ_ROUTER_HOST !== undefined) {
		var dgram = require('dgram');
		var message = Buffer.from('cinh#' + count + '#' + address);
		var client = dgram.createSocket('udp4');
		client.send(message, 0, message.length, BIOTZ_UDP_PORT, BIOTZ_ROUTER_HOST, function(err, bytes) {
				if (err) {
				console.log('Error:', err);
				} else {
				console.log('set inhibit', address, message.toString());
				}
				client.close();
				});
	}
}

function heartBeat(recordedData, recordingActive, recordingCache) {
    recordedData.find({active: true}, function(err, recData) {
        var now = new Date().getTime();
        for (let i = 0; i < recData.length; i++) {
            let rec = recData[i];
            console.log(rec.name);
            if (recordingCache[rec.name] === undefined) {
                recordingCache[rec.name] = [];
            }
            if (rec.stop <= now) {
                if (isPowerOfTwo(recordingCache[rec.name])) {
                    recordingActive[rec.name] = false;
                    saveRecording(recordedData, rec, recordingCache[rec.name], now);
                } else {
                    console.log(recordingCache[rec.name].length, 'extending recording to get power of 2');
                    if (recordingOverlong[rec.name]) {
                        recordingActive[rec.name] = false;
                        let samples = recordingCache[rec.name].length;
                        let freq = samples / (now - rec.start);
                        recordingCache[rec.name] = truncateToPowerOfTwo(recordingCache[rec.name]);
                        let truncatedSamples = recordingCache[rec.name].length;
                        let newStop = rec.start + (truncatedSamples / freq);

                        saveRecording(recordedData, rec, recordingCache[rec.name], newStop);
                        recordingOverlong[rec.name] = false;
                    }
                    recordingOverlong[rec.name] = true;
                    
                }
            } else {
                recordingActive[rec.name] = true;
                if (recordingCache[rec.name] === undefined) {
                    recordingCache[rec.name] = [];
                }
            }
        }
    });
}

function isPowerOfTwo(n) {
        let k = Math.floor(Math.log(n) / Math.LN2)
        return (Math.pow(2, k) === n);
}

function saveRecording(recordedData, rec, cachedData, timeStop) {
    recordedData.findOneAndUpdate({name: rec.name}, {active: false, stop: timeStop, data: cachedData}, {upsert:true}, function(err, data) {
        if (err) { return console.error('ERR saving recording', err); }
        console.log('saved recording', rec.name, 'points',  cachedData.length, 'interval: ', (timeStop - rec.start)/1000);
    });
}

function truncateToPowerOfTwo(arr) {
    let l = arr.length;
    while ((l > 0) && (! isPowerOfTwo(l))) {
        l--;
    }
    return arr.slice(0, l);
}
