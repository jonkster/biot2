#!/usr/bin/node

// this application saves data from biot nodes
//
var VERSION = "0.0.0";

var BIOTZ_UDP_PORT = 8888;
var UDP_LOCAL_HOST = 'affe::1';
var BIOTZ_ROUTER_HOST = 'affe::3';

var nodeCache = {};

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;

var biotDataSchema = new Schema({
  address:  String,
  do: String,
  dc: String,
  ds: String,
  updated_at: { type: Date, default: Date.now }
});

var edgeRouterSchema = new Schema({
  name:  String,
  updated_at: { type: Date, default: Date.now }
});

mongoose.connect('mongodb://localhost:27017/mydb', { useMongoClient: true, promiseLibrary: global.Promise });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
		console.log("connected to data store"); 
		var nodeData = mongoose.model('BiotData', biotDataSchema);
		var edgeRouter = mongoose.model('EdgeRouter', edgeRouterSchema);

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

		// received an update message - store info
		brokerUdpListener.on('message', function (message, remote) {
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
				}
			} else {
				console.log("empty message?", remote);
			}
		});
});


