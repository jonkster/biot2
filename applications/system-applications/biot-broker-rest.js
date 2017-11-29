#!/usr/bin/node

// this application acts as in interface between HTTP requests for data/control
// and a Biotz router (that communicates via UDP)
//
var VERSION = "0.0.0";

var BIOTZ_UDP_PORT = 8888;
var ip = require('ip');
var UDP_LOCAL_HOST = ip.address();
var BIOTZ_ROUTER_HOST = undefined;

var ip = require('ip');
var BROKER_HTTP_PORT = 8889; 
var BROKER_HOST = ip.address(); 

var dgram = require('dgram');
var dataPath = './data';

allNodes = {};

var nodeStatus = {};
var systemStatus = {
    'udpip': 'unknown',
    'edgerouter': 'unknown',
    'dodag': 'unknown'
};

var edgeRouterTime = {};

var dummyNodes = {};
var recording = {};
var recordingExists = {};
var recordedData = {};

var dirty = true;
var cached = {};

var lastAliveTime = 0;
var interval = setInterval(function() {
      testSystem();
}, 10000);

// Listen for and act on Broker HTTP Requests
var restify = require('restify');
var brokerListener = restify.createServer();
brokerListener.use(restify.bodyParser());
brokerListener.server.setTimeout(100)

var timer = 0;

brokerListener.pre(function(req, res, next) {
    timer = new Date().getTime();
    updateFromDB();
    res.header("Access-Control-Allow-Origin", "*"); 
    next();
});

brokerListener.on('after', function(req, res, next) {
    updateFromDB();
    /*var now = new Date().getTime();
    var delta = now - timer;
    if (delta > 3)
        console.log('long response', delta, req.url);*/
});

brokerListener.get('/', getRoot);

brokerListener.get('/biotz', getAllBiotData);
brokerListener.get('/biotz/count', getBiotCount);
brokerListener.get('/biotz/status', getBiotzStatus);
brokerListener.get('/biotz/synchronise', biotSync);
brokerListener.get('/biotz/addresses', getBiotz);
brokerListener.get('/biotz/edgerouter', getEdgeRouterStatus);
brokerListener.put('/biotz/edgerouter', putEdgeRouterStatus);
brokerListener.get('/biotz/all/data', getAllBiotzData);
brokerListener.get('/biotz/all/nodes', getAllBiotzNodes);

//brokerListener.put('/biotz/addnode/:address', addDummyNode);
//brokerListener.put('/biotz/dropnodes', dropDummyNodes);

brokerListener.get('/biotz/addresses/recordings', getBiotRecordings);
brokerListener.get('/biotz/addresses/:address', getBiotFull);
brokerListener.del('/biotz/addresses/:address', deleteBiotNode);
brokerListener.get('/biotz/addresses/:address/data', getBiotData);
brokerListener.get('/biotz/addresses/:address/calibration', getBiotCalibration);
brokerListener.put('/biotz/addresses/:address/calibration', putBiotCalibration);
brokerListener.get('/biotz/addresses/:address/status', getBiotStatus);
brokerListener.get('/biotz/addresses/:address/interval', getBiotInterval);
brokerListener.put('/biotz/addresses/:address/interval', putBiotInterval);
brokerListener.get('/biotz/addresses/:address/auto', getBiotAuto);
brokerListener.put('/biotz/addresses/:address/auto', putBiotAuto);
brokerListener.get('/biotz/addresses/:address/dof', getBiotDof);
brokerListener.put('/biotz/addresses/:address/dof', putBiotDof);
brokerListener.get('/biotz/addresses/:address/led', getBiotLed);
brokerListener.put('/biotz/addresses/:address/led', putBiotLed);
brokerListener.get('/biotz/addresses/:address/alive', getBiotAlive);
brokerListener.get('/biotz/addresses/:address/alive/ts', getBiotAliveTs);
brokerListener.get('/biotz/addresses/:address/alive/status', getBiotAliveStatus);
brokerListener.get('/biotz/addresses/:address/record', getBiotRecord);
brokerListener.put('/biotz/addresses/:address/record', putBiotRecord);
brokerListener.get('/biotz/addresses/:address/record/status', getBiotRecordStatus);


brokerListener.get('/data', getData);
brokerListener.get('/data/:category', getDataCategories);
brokerListener.get('/data/:category/:name', getDataValue);
brokerListener.put('/data/:category/:name', putDataValue);
brokerListener.del('/data/:category/:name', deleteDataValue);



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

var recordedOrientationSchema = new Schema({
  name:  String,
  active: { type: Boolean, default: false },
  start: Number,
  stop: Number,
  data: [String],
  updated_at: { type: Date, default: Date.now }
});


var edgeRouterSchema = new Schema({
  name:  String,
  updated_at: { type: Date, default: Date.now }
});


var nodeData = {};
var edgeRouter = {};
var recordedData = {};
mongoose.connect('mongodb://localhost:27017/mydb', { useMongoClient: true, promiseLibrary: global.Promise });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
		console.log("connected to data store"); 
		nodeData = mongoose.model('BiotData', biotDataSchema);
		edgeRouter = mongoose.model('EdgeRouter', edgeRouterSchema);
		recordedData = mongoose.model('RecordedData', recordedOrientationSchema);
		heartbeat();
		});

brokerListener.listen(BROKER_HTTP_PORT, BROKER_HOST, function() {
	console.log('Broker %s listening for HTTP requests at port:%s', brokerListener.name, brokerListener.url);
	console.log('eg: %s/biotz', brokerListener.url);
	console.log("Ready...");
});


function addDummyNode(req, res, next) {
    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
    var address = req.params['address'];
    nodeStatus[address] = {
        'status': 'dummy',
        'ts': 0
    }
    dummyNodes[address] = true;
    console.log("adding dummy node:", address);
    res.send('OK');
    next();
}



function biotIdentify(req, res, next) {
	if (invalidRequest(req)) {
		res.send(400, 'bad request syntax - missing argument perhaps?');
		next();
		return;
	}
	if (BIOTZ_ROUTER_HOST !== undefined) {
		var address = req.params['address'];
		var message = new Buffer('cled#3#' + address);
		var client = dgram.createSocket('udp4');

		console.log('identify', address);
		client.send(message, 0, message.length, BIOTZ_UDP_PORT, BIOTZ_ROUTER_HOST, function(err, bytes) {
				if (err) { console.log('Error:', err); }
				client.close();
				});
		res.send('OK');
	} else {
		res.send(202, 'awaiting connection to biotz router');
	}
	next();
}

function biotSync(req, res, next) {
	if (BIOTZ_ROUTER_HOST !== undefined) {
		var message = new Buffer('csyn##');
		var client = dgram.createSocket('udp4');

		console.log('sync', address);
		client.send(message, 0, message.length, BIOTZ_UDP_PORT, BIOTZ_ROUTER_HOST, function(err, bytes) {
			if (err) {
				console.log('Sync Error:', err);
			}
			client.close();
		});
		res.send(200, 'OK');
	} else {
		res.send(202, 'awaiting connection to biotz router');
	}
	next();
}

function dropDummyNodes(req, res, next) {
    next();
}


function getRoot(req, res, next) {
    /*
     * method: '/'
     */
    var now = new Date();
    res.send({
        "title": "Biotz Broker REST API",
        "description": "interface to a network of Biot Orientation Sensors",
        "version": VERSION,
        "UDP-IP-status": systemStatus.udpip,
        "Edge-Router-status": systemStatus.edgerouter,
	"Edge-Router-address": BIOTZ_ROUTER_HOST,
        "DODAG-status": systemStatus.dodag,
        "time": now,
        "links": [
            "http://" + BROKER_HOST + ":" + BROKER_HTTP_PORT + "/",
            "http://" + BROKER_HOST + ":" + BROKER_HTTP_PORT + "/biotz",
            "http://" + BROKER_HOST + ":" + BROKER_HTTP_PORT + "/data"

        ]
    });
    next();
}

function getAllBiotData(req, res, next) {
    /*
     * method: '/biotz'
     */
    var addresses = Object.keys(allNodes);
    var value = {
        "count": addresses.length,
        "addresses": addresses
    }
    res.send(value);
    next();
}

function getBiotData(req, res, next) {
    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
    var address = req.params['address'];
    var value = allNodes[address];
    if (value === undefined) {
        res.send(404, value);
    } else {
	    res.send(200, value.do);
    }
    next();
}

function getBiotCalibration(req, res, next) {

    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
    var address = req.params['address'];

    var value = allNodes[address];
    if (value === undefined) {
        res.send(404, value);
    } else {
        res.send(200, value.dc);
    }
    next();
}

function getBiotCount(req, res, next) {

    var addresses = Object.keys(allNodes);
    res.send(200, addresses.length);
    next();
}

function getAllBiotzData(req, res, next) {
	var value = {};
	if (dirty) {
		var addresses = Object.keys(allNodes);
		for (var i = 0; i < addresses.length; i++) {
			var address = addresses[i];
			value[address] = allNodes[address].do;
		}
	} else {
		//console.log('cached');
		value = cached;
	}
	res.send(200, value);
	cached = value;
	next();
}

function getAllBiotzNodes(req, res, next) {
	var value = {};
	var addresses = Object.keys(allNodes);
	for (var i = 0; i < addresses.length; i++) {
		var address = addresses[i];
		value[address] = allNodes[address];
	}
	res.send(200, value);
	cached = value;
	next();
}


function getBiotFull(req, res, next) {

    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
    var address = req.params['address'];
    if (! address) {
	// url entered with trailing slash
	getBiotz(req, res, next);
	return;
    }

    if (allNodes[address] !== undefined) {
	    var data = allNodes[address];
	    var bits = data.ds.split(":");
	    var value = {
		'data': data.do,
		'calibration': data.dc,
		"status": data.ds,
		"interval": bits[1],
		"auto": bits[2],
		"dof": bits[0],
		"led": "?"
	    }
	    res.send(200, value);
	} else {
	    res.send(404, 'unknown address ' + address);
	}
    next();
}

function getBiotAuto(req, res, next) {

    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
    var address = req.params['address'];
    if (! address) {
        // url entered with trailing slash
        getBiotz(req, res, next);
        return;
    }
    var bits = allNodes[address].ds.split(":");
    var value = bits[2];
    res.send(200, value);
    next();
}

function getBiotDof(req, res, next) {

    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
    var address = req.params['address'];
    if (! address) {
        // url entered with trailing slash
        getBiotz(req, res, next);
        return;
    }
    var bits = allNodes[address].ds.split(":");

    var value = bits[0];

    res.send(200, value);
    next();
}

function getBiotLed(req, res, next) {

    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
    var address = req.params['address'];
    if (! address) {
        // url entered with trailing slash
        getBiotz(req, res, next);
        return;
    }
    var bits = allNodes[address].ds.split(":");
    // missing this info

    var value = "?";

    res.send(200, value);
    next();
}

function getBiotInterval(req, res, next) {

    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
    var address = req.params['address'];
    if (! address) {
        // url entered with trailing slash
        getBiotz(req, res, next);
        return;
    }
    var bits = allNodes[address].ds.split(":");

    var value = bits[1];

    res.send(200, value);
    next();
}

function getBiotStatus(req, res, next) {

    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
    var address = req.params['address'];
    if (! address) {
        // url entered with trailing slash
        getBiotz(req, res, next);
        return;
    }

    var value = allNodes[address].ds;

    res.send(200, value);
    next();
}

function getBiotz(req, res, next) {

    res.send(Object.keys(allNodes));
    next();
}

function getBiotAlive(req, res, next) {

    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
	var address = req.params['address'];

	// poke biot to force activity
	sendPoke(address);

	if (allNodes[address] !== undefined) {
		var ts = new Date(allNodes[address].updated_at).getTime();
		var now = new Date().getTime();

		nodeStatus = {
			'status': 'unknown',
			'ts': ts
		}

		if (now - ts < 200) {
			nodeStatus.status = 'alive';
		} else if (now - ts < 1000) {
			nodeStatus.status = 'inactive';
		} else {
			nodeStatus.status = 'lost';
		}
		res.send(200, nodeStatus);
	} else {
		res.send(404, 'node:' + address + ' does not exist');
	}
	next();
}

function getBiotAliveStatus(req, res, next) {
    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
	var address = req.params['address'];

	// poke biot to force activity
	sendPoke(address);

	var ts = new Date(allNodes[address].updated_at).getTime();
	var now = new Date().getTime();

	nodeStatus = {
		'status': 'unknown',
		'ts': ts
	}

	if (allNodes[address] !== undefined) {
		if (now - ts < 200) {
			nodeStatus.status = 'alive';
		} else if (now - ts < 1000) {
			nodeStatus.status = 'inactive';
		} else {
			nodeStatus.status = 'lost';
		}
		res.send(200, nodeStatus.status);
	} else {
		res.send(404, 'node:' + address + ' does not exist');
	}
	next();
}

function getBiotAliveTs(req, res, next) {
    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
	var address = req.params['address'];

	// poke biot to force activity
	sendPoke(address);

	var ts = new Date(allNodes[address].updated_at).getTime();
	var now = new Date().getTime();

	nodeStatus = {
		'status': 'unknown',
		'ts': ts
	}

	if (allNodes[address] !== undefined) {
		if (now - ts < 200) {
			nodeStatus.status = 'alive';
		} else if (now - ts < 1000) {
			nodeStatus.status = 'inactive';
		} else {
			nodeStatus.status = 'lost';
		}
		res.send(200, nodeStatus.ts);
	} else {
		res.send(404, 'node:' + address + ' does not exist');
	}
	next();
}

function getBiotzStatus(req, res, next) {
    var nodeStatus = {};
    var addresses = Object.keys(allNodes);
    for (var i = 0; i < addresses.length; i++) {
	    var address = addresses[i];

	    // poke biot to force activity
	    sendPoke(address);

	    var ts = new Date(allNodes[address].updated_at).getTime();
	    var now = new Date().getTime();

	    nodeStatus[address] = {
		    'status': 'unknown',
		    'ts': ts
	    }

	    if (allNodes[address] !== undefined) {
		    if (now - ts < 200) {
			    nodeStatus[address].status = 'alive';
		    } else if (now - ts < 1000) {
			    nodeStatus[address].status = 'inactive';
		    } else {
			    nodeStatus[address].status = 'lost';
		    }
	    }
    }
    res.send(200, nodeStatus);
    next();
}

function getDataCategories(req, res, next) {

    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
    var category = req.params['category'];
    var path = dataPath + '/' + category + '/';

    var fs = require('fs');
    fs.readdir(path, function(err, files) {
        if (err) {
            res.send(500, 'fail');
        } else {
            res.send(200, files);
        }
        next();
    });
}

function getData(req, res, next) {

    var path = dataPath + '/';

    var fs = require('fs');
    fs.readdir(path, function(err, files) {
        if (err) {
            res.send(500, 'fail');
        } else {
            res.send(200, files);
        }
        next();
    });
}

function getEdgeRouterStatus(req, res, next) {
    let ip = BIOTZ_ROUTER_HOST;
    if (ip === undefined) {
        ip = "?";
    }
    res.send(200, {
        'status': systemStatus.edgerouter,
        'ip': ip,
        'port': BIOTZ_UDP_PORT,
        'time': edgeRouterTime[BIOTZ_ROUTER_HOST]
        });
    next();
}

function getCachedAssembly(req, res, next) {
    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
    var name = req.params['name'];
    var path = dataPath + '/assembly/' + name;

    var fs = require('fs');
    fs.readFile(path, function(err, data) {
        data = JSON.parse(data);
        if (err) {
            console.log(err, 'reading file:', path);
            res.send(404, data);
        } else {
            res.send(200, data);
        }
        next();
    });
}

function getDataValue(req, res, next) {
    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
    var category = req.params['category'];
    var name = req.params['name'];
    var path = dataPath + '/' + category + '/' + name;

    var fs = require('fs');
    fs.readFile(path, function(err, data) {
        if (err) {
            res.send(404, err);
        } else {
            data = JSON.parse(data);
            res.send(200, data);
        }
        next();
    });
}

function deleteBiotNode(req, res, next) {
    if (invalidRequest(req)) {
        res.send(400, 'bad request syntax - missing argument perhaps?');
        next();
        return;
    }
	var address = req.params['address'];
	if (allNodes[address] !== undefined) {
		delete allNodes[address];
		res.send('OK');
		res.send(404, address);
	} else {
	}
	next();
}

function deleteDataValue(req, res, next) {
    var category = req.context['category'];
    var name = req.context['name'];
    var path = dataPath + '/' + category + '/' + name;

    var fs = require('fs');
    fs.unlink(path, function(err) {
        if (err) {
            console.log(err, 'deleting file:', path);
            res.send(500, err);
        } else {
            console.log('deleted file:', path);
            res.send(200, "OK");
        }
        next();
    });
}

function getBiotRecord(req, res, next) {
    var address = req.context['address'];
    if (recordingExists[address] !== undefined) {
        recordedData.findOne({name: address}, function(err, data) {
            if (err) {
                console.error("error finding recording", err);
                res.send(500, 'error finding recording:' + address);
            } else {
                let samples =  data.data.length;
                let time =  (data.stop - data.start) / 1000;
                let sr =  samples / time;
                console.log('sending recording:', data);
                res.send(200, {
                    'address': address,
                    'sampleRate': sr,
                    'interval': time,
                    'count': samples,
                    'data': data.data
                });
            }
        });

    } else {
        res.send(404, 'recorded data for address:' + address + ' does not exist');
    }
    next();
}

function getBiotRecordings(req, res, next) {
    let addresses = Object.keys(recordingExists);
    res.send(200, addresses);
    next();
}

function getBiotRecordStatus(req, res, next) {
    var address = req.context['address'];
    var recStatus = false;

    let haveARecording = false;
    let isRecording = false;
    recordedData.findOne({name: address}, function(err, data) {
        if (err) {
            console.error("error finding recorded data", err);
            res.send(500, err);
        } else {
            if (data !== null) {
                 haveARecording = true;
                 isRecording = data.active;
            }
            res.send(200, {
                recordingActive: isRecording,
                recordingExists: haveARecording
            });
        }
        next();
    });
}

function heartbeat() {
	setTimeout(function() {
			updateFromDB();
			edgeRouter.find(function(err, data) {
					if (err) { console.error("error finding edge routers", err); return; }
					if (data.length === 0) {
						console.log("No edge router set??");
					}
					for (var i = 0; i < data.length; i++) {
						var er = data[i];
						if ((BIOTZ_ROUTER_HOST === undefined) || (BIOTZ_ROUTER_HOST !== er.name)) {
							console.log("Setting router host to", er.name);
							BIOTZ_ROUTER_HOST = er.name;
						}
						var ts = new Date(er.updated_at).getTime();
						edgeRouterTime[er.name] = ts;
					}
			});
                        recordingExists = {};
                        recordedData.find(function(err, data) {
                            if (err) { console.error("error finding recorded data", err); return; }
                            for (let i = 0; i < data.length; i++) {
                                recordingExists[data[i].name] = true;
                            }
                        });
			heartbeat();
	}, 4000);
}

function invalidRequest(req) {
    if (req.params.length === 0) {
        return true;
    }
    if (req.params.address !== undefined) {
        if (! req.params.address.match(/:/)) {
            return true;
        }
    }
    return false;
}

function isPowerOfTwo(n) {
        let k = Math.floor(Math.log(n) / Math.LN2)
        return (Math.pow(2, k) === n);
}

function putBiotAuto(req, res, next) {
	if (BIOTZ_ROUTER_HOST !== undefined) {
		var address = req.context['address'];
		var data = req.body;
		var message = new Buffer('cmcm#' + data + '#' + address);
		var client = dgram.createSocket('udp4');

		console.log('auto', address);
		client.send(message, 0, message.length, BIOTZ_UDP_PORT, BIOTZ_ROUTER_HOST, function(err, bytes) {
				if (err) {
					 console.log('Error:', err); res.send(500, err); 
				} else { 
					res.send(200, 'OK');
				 }
				client.close();
				next();
		});
	} else {
		res.send(202, 'awaiting connection to biotz router');
		next();
	}
}


function putBiotCalibration(req, res, next) {
	if (BIOTZ_ROUTER_HOST !== undefined) {
		var address = req.context['address'];
		var data = req.body;

		var message = new Buffer('ccav#' + data + '#' + address);
		var client = dgram.createSocket('udp4');

		console.log('cal', address);
		client.send(message, 0, message.length, BIOTZ_UDP_PORT, BIOTZ_ROUTER_HOST, function(err, bytes) {
			if (err) {
				console.log('Error:', err);
				res.send(500, err);
			} else {
				res.send(200, 'OK');
			}
			client.close();
			next();
		});
	} else {
		res.send(202, 'awaiting connection to biotz router');
		next();
	}
}

function putBiotInterval(req, res, next) {
	if (BIOTZ_ROUTER_HOST !== undefined) {
		var address = req.context['address'];
		var data = req.body;

		var message = Buffer.from('cdup#' + data + '#' + address);

		var client = dgram.createSocket('udp4');
		client.send(message, 0, message.length, BIOTZ_UDP_PORT, BIOTZ_ROUTER_HOST, function(err, bytes) {
				if (err) {
					console.log('Error:', err);
					res.send(500, err);
				} else {
					console.log('set cdup', address, message.toString());
					res.send(200, 'OK');
				}
				client.close();
				next();
			});
	} else {
		res.send(202, 'awaiting connection to biotz router');
		next();
	}
}

function putBiotDof(req, res, next) {

	if (BIOTZ_ROUTER_HOST !== undefined) {
		var address = req.context['address'];
		var data = req.body;

		var message = new Buffer('cdof#' + data + '#' + address);
		var client = dgram.createSocket('udp4');

		console.log('dof', address);
		client.send(message, 0, message.length, BIOTZ_UDP_PORT, BIOTZ_ROUTER_HOST, function(err, bytes) {
				if (err) {
					console.log('Error:', err);
					res.send(500, err);
				} else {
					res.send(200, 'OK');
				}
				client.close();
				next();
				});
	} else {
		res.send(202, 'awaiting connection to biotz router');
		next();
	}
}

function putBiotLed(req, res, next) {

	if (BIOTZ_ROUTER_HOST !== undefined) {
		var address = req.context['address'];
		var data = req.body;

		var message = new Buffer('cled#' + data + '#' + address);
		var client = dgram.createSocket('udp4');

		console.log('led', address);
		client.send(message, 0, message.length, BIOTZ_UDP_PORT, BIOTZ_ROUTER_HOST, function(err, bytes) {
			if (err) {
				console.log('Error:', err);
				res.send(500, err);
			} else {
				res.send(200, 'OK');
			}
			client.close();
			next();
		});
	} else {
		res.send(202, 'awaiting connection to biotz router');
		next();
	}
}

function putBiotRecord(req, res, next) {
    var address = req.context['address'];
    if (true || ! recording[address]) {
        var seconds = req.body;
        if (seconds > 15) {
            console.log('changing recording time from', seconds, ' to ', 15);
            seconds = 15;
        }
        console.log('start recording', address);
        recordedData.remove({name: address}, function(err) {
            if (err) { console.error("error deleting recording", err); return; }
            console.log("saving recording entry");
            var now = new Date().getTime(); 
            var rec = new recordedData({
                name: address,
                active: true,
                start: now, 
                stop: now + (seconds * 1000), 
                data: [] });
            rec.save(function(err, data) {
                if (err) { console.error("error saving new recording", err); return; }
                recording[address] = true;
                console.log(recording);
            });
        });
    } else {
        console.log('already recording', address);
    }
    res.send(200, 'OK');
    next();
}


function putDataValue(req, res, next) {
    var category = req.context['category'];
    var name = req.context['name'];
    var data = req.body;
    var path = dataPath + '/' + category + '/';

    var fs = require('fs');

    if (! fs.existsSync(path)) {
        var mkdirp = require('mkdirp');
        var dir = mkdirp.sync(path);
        if (! dir) {
            res.send(500, 'failed to create resource');
            next();
            return;
        }
    }
    path += '/' + name;
    fs.writeFile(path, JSON.stringify(data), function(err) {
        if (err) {
            res.send(500, 'OK');
            console.log(fErr, 'writing file:', path);
        } else {
            res.send('OK');
        }
        next();
    });

}

function putEdgeRouterStatus(req, res, next) {
    var ipport = req.body.split(":");
    console.log(ipport[0], ipport[1]);
    res.send(200, 'OK');
    next();
}


function sendPoke(address) {

	if (BIOTZ_ROUTER_HOST !== undefined) {
		var message = new Buffer('cpok##' + address);
		var client = dgram.createSocket('udp4');

		client.send(message, 0, message.length, BIOTZ_UDP_PORT, BIOTZ_ROUTER_HOST, function(err, bytes) {
			if (err) {
				console.log('Error:', err);
				client.close();
			}
		});
	} else {
		res.send(202, 'awaiting connection to biotz router');
	}
}

function testSystem() {
	var now = new Date().getTime();
	if (BIOTZ_ROUTER_HOST === undefined) {
		console.log("cannot find Edge Router host...");
		systemStatus.edgerouter = 'unknown';
		return;
	}
	if (edgeRouterTime[BIOTZ_ROUTER_HOST] !== undefined) {
		var secsAlive = (now - edgeRouterTime[BIOTZ_ROUTER_HOST]) / 1000;
		if (secsAlive > 12) {
			systemStatus.edgerouter = 'fault';
		} else {
			systemStatus.edgerouter = 'OK';
		}
	} else {
		systemStatus.edgerouter = 'unknown';
	}

	let fault = true;
	let os = require('os');
	let interfaces = os.networkInterfaces();
	let ifs = Object.keys(interfaces);
	for (var i = 0; i < ifs.length; i++) {
		var iface = interfaces[ifs[i]];
		for (var j = 0; j < iface.length; j++) {
			if (iface[j].address === UDP_LOCAL_HOST) {
				fault = false;
			}
		}
	}
	if (fault) {
		systemStatus.udpip = 'fault';
	} else {
		systemStatus.udpip = 'OK';
	}
}


function updateFromDB() {
	nodeData.find(function(err, data) {
		if (err) { console.error("error finding data", err); return; }
        	systemStatus.dodag = 'fault';
		dirty = false;
		for (var i = 0; i < data.length; i++) {
			var node = data[i];
			var address = node.address;
			var updateNode = false;
			if (allNodes[address] === undefined) {
				updateNode = true;
			} else if (node.updated_at !== allNodes[address].updated_at) {
				updateNode = true;
			}
			if (updateNode) {
				dirty = true;
                                if (address !== 'undefined') {
                                    systemStatus.dodag = 'OK';
                                    allNodes[address] = node;
                                }
			}
		}
	});
}

