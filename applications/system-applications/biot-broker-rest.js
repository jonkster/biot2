#!/usr/bin/node

// this application acts as in interface between HTTP requests for data/control
// and a Biotz router (that communicates via UDP)
//
var VERSION = "0.0.0";

var BIOTZ_UDP_PORT = 8888;
var UDP_LOCAL_HOST = 'affe::1';
var BIOTZ_ROUTER_HOST = 'affe::3';

var BROKER_HTTP_PORT = 8889; 
var BROKER_HOST = '10.1.1.9'; 
//var BROKER_HOST = 'localhost'; 

var dgram = require('dgram');
var dataPath = './data';

var startTime = 0;

allNodes = {};

var nodeStatus = {};
var systemStatus = {
    'udpip': 'unknown',
    'edgerouter': 'unknown',
    'dodag': 'unknown'
};

var realNodes = {};
var dummyNodes = {};
var dummyTime = 0;
var recording = {};
var recordingExists = {};
var recordingTime = {};
var recordedData = {};
var recordingStart = {};
var recordingStop = {};

var dirty = false;
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

brokerListener.pre(function(req, res, next) {
    console.log("REQ:", req.url);
    res.header("Access-Control-Allow-Origin", "*"); 
    next();
});

brokerListener.on('after', function(req, res, next) {
    updateFromDB();
});

brokerListener.get('/', getRoot);

brokerListener.get('/biotz', getAllBiotData);
brokerListener.get('/biotz/count', getBiotCount);
brokerListener.get('/biotz/status', getBiotzStatus);
brokerListener.get('/biotz/synchronise', biotSync);
brokerListener.get('/biotz/addresses', getBiotz);
brokerListener.get('/biotz/all/data', getAllBiotz);

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

var nodeData = {};
mongoose.connect('mongodb://localhost:27017/mydb', { useMongoClient: true, promiseLibrary: global.Promise });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
		console.log("connected to data store"); 
		nodeData = mongoose.model('BiotData', biotDataSchema);
		updateFromDB();
		});

brokerListener.listen(BROKER_HTTP_PORT, BROKER_HOST, function() {
	console.log('Broker %s listening for HTTP requests at port:%s', brokerListener.name, brokerListener.url);
	console.log('eg: %s/biotz', brokerListener.url);
	console.log("Ready...");
});


function addDummyNode(req, res, next) {
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
    var address = req.params['address'];
    var message = new Buffer('cled#3#' + address);
    var client = dgram.createSocket('udp6');

console.log('identify', address);
    client.send(message, 0, message.length, BIOTZ_UDP_PORT, BIOTZ_ROUTER_HOST, function(err, bytes) {
        if (err)
        {
            console.log('Error:', err);
        }
        client.close();
    });
    res.send('OK');
    next();
}

function biotSync(req, res, next) {
    var message = new Buffer('csyn##');
    var client = dgram.createSocket('udp6');

console.log('sync', address);
    client.send(message, 0, message.length, BIOTZ_UDP_PORT, BIOTZ_ROUTER_HOST, function(err, bytes) {
        if (err)
        {
            console.log('Sync Error:', err);
        }
        client.close();
    });
    res.send(200, 'OK');
    next();
}

function dropDummyNodes(req, res, next) {
    next();
}


function getRoot(req, res, next) {
    /*
     * method: '/'
     */
    console.log("X");
    var now = new Date();
    res.send({
        "title": "Biotz Broker REST API",
        "description": "interface to a network of Biot Orientation Sensors",
        "version": VERSION,
        "UDP-IP-status": systemStatus.udpip,
        "Edge-Router-status": systemStatus.edgerouter,
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

function getAllBiotz(req, res, next) {
	var value = {};
	if (dirty) {
		var addresses = Object.keys(allNodes);
		for (var i = 0; i < addresses.length; i++) {
			var address = addresses[i];
			value[address] = allNodes[address].do;
		}
	} else {
		console.log('cached');
		value = cached;
	}
	res.send(200, value);
	cached = value;
	next();
}


function getBiotFull(req, res, next) {

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
    let addresses = Object.keys(recordedData);
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

function getCachedAssembly(req, res, next) {
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
    if (recordedData[address] !== undefined) {
        let samples =  recordedData[address].length;
        let time =  (recordingStop[address] - recordingStart[address]) / 1000;
        let sr =  samples / time;
        res.send(200, {
            'address': address,
            'sampleRate': sr,
            'interval': time,
            'count': samples,
            'data': recordedData[address]
        });
    } else {
        res.send(404, 'recorded data for address:' + address + ' does not exist');
    }
    next();
}

function getBiotRecordings(req, res, next) {
    let addresses = Object.keys(recordedData);
    res.send(200, addresses);
    next();
}

function getBiotRecordStatus(req, res, next) {
    var address = req.context['address'];
    var recStatus = false;
    if (recordingTime[address] !== undefined ) {
        var now = new Date().getTime();
        if (recordingTime[address] >= now) {
            recStatus = true;
        }
    }

    res.send(200, {
        recordingActive: recording[address],
        recordingExists: recordingExists[address]
    });
    next();
}

function isPowerOfTwo(n) {
        let k = Math.floor(Math.log(n) / Math.LN2)
        return (Math.pow(2, k) === n);
}

function putBiotAuto(req, res, next) {

    var address = req.context['address'];
    var data = req.body;

    var message = new Buffer('cmcm#' + data + '#' + address);
    var client = dgram.createSocket('udp6');

console.log('auto', address);
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
}

function putBiotCalibration(req, res, next) {

    var address = req.context['address'];
    var data = req.body;

    var message = new Buffer('ccav#' + data + '#' + address);
    var client = dgram.createSocket('udp6');

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
}

function putBiotInterval(req, res, next) {

    var address = req.context['address'];
    var data = req.body;

    var message = new Buffer('cdup#' + data + '#' + address);
    var client = dgram.createSocket('udp6');

console.log('interval', address);
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
}

function putBiotDof(req, res, next) {

    var address = req.context['address'];
    var data = req.body;

    var message = new Buffer('cdof#' + data + '#' + address);
    var client = dgram.createSocket('udp6');

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
}

function putBiotLed(req, res, next) {

    var address = req.context['address'];
    var data = req.body;

    var message = new Buffer('cled#' + data + '#' + address);
    var client = dgram.createSocket('udp6');

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
}

function putBiotRecord(req, res, next) {
    var address = req.context['address'];
    if (! recording[address]) {
        var seconds = req.body;
        if (seconds > 15) {
            console.log('changing recording time from', seconds, ' to ', 15);
            seconds = 15;
        }
        console.log('start recording', address);
        recordingTime[address] = (new Date().getTime()) + (seconds * 1000);
        recordingStart[address] = recordingTime[address];
        recordingStop[address] = recordingTime[address];
        recordingExists[address] = false;
        recordedData[address] = [];
        recording[address] = true;
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


function sendPoke(address) {

    var message = new Buffer('cpok##' + address);
    var client = dgram.createSocket('udp6');

console.log('poke', address);
    client.send(message, 0, message.length, BIOTZ_UDP_PORT, BIOTZ_ROUTER_HOST, function(err, bytes) {
        if (err) {
            console.log('Error:', err);
            client.close();
        }
    });
}

function testSystem() {
    var now = new Date();
    var secsAlive = (now - lastAliveTime) / 1000;
    if (secsAlive > 12) {
        systemStatus.edgerouter = 'fault';
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
	console.log('finding...');
	nodeData.find(function(err, data) {
		for (var i = 0; i < data.length; i++) {
			var node = data[i];
			var address = node.address;
			allNodes[address] = node;
		}
	});
}

