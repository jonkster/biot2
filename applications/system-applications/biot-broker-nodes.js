#!/usr/bin/node

// this application saves data from biot nodes
//
var VERSION = "0.0.0";

var BIOTZ_UDP_PORT = 8888;
var UDP_LOCAL_HOST = 'affe::1';
var BIOTZ_ROUTER_HOST = 'affe::3';

var nodeCache = {};

var dataCache = [];

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;

var heartBeatInterval = 2000;


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
		var brokerUdpListener = dgram.createSocket('udp6');
		brokerUdpListener.bind(BIOTZ_UDP_PORT, UDP_LOCAL_HOST);
		brokerUdpListener.on('listening', function () {
				var address = brokerUdpListener.address();
				console.log('UDP Server listening on ' + address.address + ":" + address.port);
				startTime = new Date();
				
		});

                let recordingCache = [];
                let recordingActive = {};

                setInterval(function() {
                    heartBeat(recordedData, recordingActive, recordingCache);
                }, heartBeatInterval);

                var lastT = new Date().getTime();
		// received an update message - store info
		brokerUdpListener.on('message', function (message, remote) {
                        var now = new Date().getTime();
                        var del = now - lastT;
                        if (del > 50) {
                            console.log(del, message.toString());
                        }
                        lastT = now;
			if (message.length > 0)
			{
				var now = new Date().getTime();
				var dirty = false;
				var bits = message.toString().split('#');
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
					if (bits[1].match(/[0-9]+:[\-0-9\.]+:[\-0-9\.]+:[\-0-9\.]+:[\-0-9\.]+/)) {
						dirty = true;
						node['do'] = bits[1];
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
					var name = BIOTZ_ROUTER_HOST;
					if (bits[1].match(/(.+)/)) {
						name = bits[1];
					}
					edgeRouter.findOneAndUpdate({name: name}, {name: name}, {upsert:true}, function(err, data) {
						if (err) { return console.error('ERR', err); }
					});
				} else {
					console.log("wah?", message.toString());
				}
				if (dirty) {
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
