import { Component, OnInit, ViewChildren  } from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {ThreeDirective} from '../three.directive';
import {BiotzService} from '../biotz.service';

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.css'],
  providers: [ BiotzService ]
})
export class NodesComponent implements OnInit {
    @ViewChildren(ThreeDirective) threeDirective;

    //private biotz:BiotzService;
    private biotzCalibration:any = {};
    private biotzData:any = {};
    private counter:number = 0;
    private initialCals: any = {};
    private biotzStatus:any = {};
    private detectedAddresses:any = {};
    private getting: boolean = false;
    private monitoring:boolean = true;
    private nodeColours:any = {};
    private nodes: any = {};
    private savedCalibrations:any = {};
    private showOnlyAddress: any = {};
    private systemMessageRate: number = 0;

    constructor(public biotz:BiotzService) { }

    ngOnInit() {
        this.updateData();
        if (! this.savedCalibrationsExist()) {
            this.readSavedCalibrations();
        }
    }

    canShow(addr) {
        if (Object.keys(this.showOnlyAddress).length === 0)
            return true;
        else
            return this.showOnlyAddress[addr];
    }

    dropNode(addr) {
        if (this.biotz !== undefined) {
            var nodes = this.biotzData.nodes;
            var activeNodes = [];
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if (node.address !== addr) {
                    activeNodes.push(node);
                }
            }
            this.biotzData = {
                'count' : activeNodes.length,
                'nodes': activeNodes
            }
            this.biotzStatus[addr] = undefined;
            this.detectedAddresses[addr] = undefined;
            this.nodes[addr] = undefined;
            this.threeDirective.removeNode(addr);
        }
    }

    getCount() {
        return this.counter;
    }

    getCommunicationStatus() {
        return this.biotz.getCommunicationStatus();
    }

    getData() {
        if (this.getCommunicationStatus()) {
            this.biotz.getData()
                .subscribe(rawData => {
                    this.getting = true;
                    this.biotzData = {
                        'count': 0,
                        'nodes': []
                    };
                    var nodesUpdated = [];
                    var addresses = Object.keys(rawData);
                    for (var i = 0; i < addresses.length; i++) {
                        var addr = addresses[i];
                        if (rawData[addr] !== undefined) {
                            this.detectedAddresses[addr] = true;
                            if (this.canShow(addr)) {
                                var dataSt = rawData[addr].split(/:/);
                                var q = {
                                    'w': dataSt[1],
                                    'x': dataSt[2],
                                    'y': dataSt[3],
                                    'z': dataSt[4]
                                };

                                var cal = this.savedCalibrations[addr];
                                if (cal === undefined)  {
                                    cal = '';
                                }

                                var nStat = this.biotzStatus[addr];
                                if (nStat === undefined) {
                                    nStat = 'unknown';
                                } else {
                                    nStat = nStat.status;
                                }

                                var colourSt = this.getNodeColour(addr);

                                this.biotzData.nodes.push({
                                    'address': addr,
                                    'colour': colourSt,
                                    'time': dataSt[0]/1000,
                                    'w': q.w,
                                    'x': q.x,
                                    'y': q.y,
                                    'z': q.z,
                                    'status': nStat,
                                    'calibration' : this.biotzCalibration[addr],
                                    'savedCals' : cal
                                });

                                if (this.nodes[addr] === undefined)
                                    {
                                        this.nodes[addr] = {};
                                        this.threeDirective.addNode(null, addr, i*200, 0, 0, parseInt(colourSt, 16), 'limb-' + addr, 100, true);
                                        var cal = this.savedCalibrations[addr];
                                        this.biotz.putCalibrationToNode(addr, cal)
                                    }
                                    this.nodes[addr] = q;
                                this.threeDirective.moveNode(addr, q);
                                nodesUpdated[addr] = true;
                            }
                        }
                    }
                    this.biotzData.count = this.biotzData.nodes.length;

                    // clean up expired nodes
                    var addressesKnown = Object.keys(this.nodes);
                    for (var i = 0; i < addressesKnown.length; i++) {
                        var name = addressesKnown[i];
                        if (! nodesUpdated[name]) 
                        {
                            delete this.detectedAddresses[name];
                            delete this.nodes[name];
                            this.threeDirective.removeNode(name);
                        }
                    }
                    this.getting = false;
                },
                error => {
                    console.error("Error updating data, has broker died?", error);
                });
        }
    }

    getMessageRate() {
        this.systemMessageRate = 0;
    }

    getNodeCalibration(addr) {
        if (this.getCommunicationStatus()) {
            this.biotz.getCalibration(addr)
                .subscribe(
                    rawData => {
                        //console.log(addr, this.initialCals);
                        this.initialCals[addr] = true;
                        this.biotzCalibration[addr] = rawData;
                    },
                    error => {
                        console.error("ERROR getting calibration!", error);
                    });
        }
    }

    getNodeColour(addr) {
        var colours = [
            0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0x00ffff, 0xffff00
        ];
        if (! addr || addr == 'none') 
            return '7f7f7f';
        if (this.nodeColours[addr] === undefined) {
            var idx = Object.keys(this.nodeColours).length;
            var colour = colours[idx % colours.length];
            var colourSt = colour.toString(16);
            while (colourSt.length < 6) {
                colourSt = '00' + colourSt;
            }
            this.nodeColours[addr] = colourSt;
        }
        return this.nodeColours[addr];
    }

    getNodeStatus(addr) {
        if (this.biotz !== undefined) {
            this.biotz.getStatus(addr)
                .subscribe(rawData => {
                    this.biotzStatus[addr] = rawData;
                },
                error => {
                    console.error("ERROR getting status!", error);
                    this.dropNode(addr);
                });
        }
    }

    // normally only needed on start up, reads data from cache on PC
    readSavedCalibration(address) {
        if (this.getCommunicationStatus()) {
            this.biotz.getCachedCalibration(address).subscribe( res => {
                this.savedCalibrations[address] = res;
            });
        }
    }

    // normally only needed on start up, reads data from cache on PC
    readSavedCalibrations() {
        if (this.getCommunicationStatus()) {
            var knownAddresses = [];
            this.biotz.getCachedCalibrationAddresses()
                .subscribe(addresses => {
                    knownAddresses = addresses;
                    for (var i = 0; i < knownAddresses.length; i++) {
                        var addr = knownAddresses[i];
                        (function(a, obj) {
                            obj.readSavedCalibration(a);
                        })(addr, this);
                    }
                });
        }
    }

    resetService() {
        this.biotz.resetService();
    }

    savedCalibrationsExist() {
        return (Object.keys(this.savedCalibrations).length > 0);
    }


    updateData() {
        if (this.biotz !== undefined) {
            if (! this.getting) {
                this.getData();
            }
            if (this.counter % 1000 == 0) {
                this.getMessageRate();
                for (var i = 0; i < this.biotzData.count; i++) {
                    var addr = this.biotzData.nodes[i].address;
                    this.getNodeCalibration(addr);
                    this.getNodeStatus(addr);
                }
            } else {
                for (var i = 0; i < this.biotzData.count; i++) {
                    var addr = this.biotzData.nodes[i].address;
                    if (! this.initialCals[addr]) {
                        this.getNodeCalibration(addr);
                        this.getNodeStatus(addr);
                    }
                }
            }
        }

        if (this.monitoring) {
            this.counter++;
            requestAnimationFrame(
                () => this.updateData()
            );
        }
    }

}
