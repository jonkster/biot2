import { Injectable } from '@angular/core';
import { Subject, Observable } from "rxjs/Rx";
import {BiotBrokerService} from '../biotbrokerservice/biot-broker.service';
import {LoggingService} from '../logging.service';
import {PeriodicService} from '../periodic.service';
import * as THREE from 'three';

export interface  biotNodeConfigurationType {
    'name': string,
    'type': string,
    'calibration': string,
    'interval': string,
    'auto': string,
    'dof': string,
    'led': string,
    'colour': string,
    'model': THREE.Object3D
};


export interface biotNodeType {
    'address': string,
    'configuration': biotNodeConfigurationType,
    'position': [ number, number, number ],
    'quaternion': THREE.Quaternion,
    'timeStamp': number,
    'lasttime': number,
    'lastHeardSame': number
};

@Injectable()
export class NodeService {

    private counter: number = 0;
    private knownNodes: { [addr: string]: biotNodeType } = {};
    private lostNodes: Subject<string> = new Subject();
    private lastChange: { [addr: string]: { lastHeard: number, timesLastHeardSame: number } } = {};

    constructor(private biotBrokerService: BiotBrokerService, private loggingService: LoggingService, private periodicService: PeriodicService) {
        this.periodicService.registerTask('node update', this, this.updateLoop);
    }

    addNodes(data: any) {
        let addresses = Object.keys(data);
        for (let i = 0; i < addresses.length; i++) {
            let addr = addresses[i];
            if (this.knownNodes[addr] === undefined) {
                this.knownNodes[addr] = {
                    'address': addr,
                    'configuration': undefined,
                    'position': [0, 0, 0],
                    'quaternion': undefined,
                    'timeStamp': undefined,
                    'lasttime': undefined,
                    'lastHeardSame': undefined
                };
            }
            let node = this.knownNodes[addr];
            let nodeRaw = data[addr];
            // kludge - need to ensure correct form of data always passed to this method - fix callers
            if (nodeRaw['dc'] !== undefined) {
                let nodeCalibration = nodeRaw['dc'];
                this.setNodeProperty(addr, 'calibration', nodeCalibration);
                let nodeStatus = nodeRaw['ds'].split(/:/);;
                this.setNodeProperty(addr, 'dof', nodeStatus[0]);
                this.setNodeProperty(addr, 'auto', nodeStatus[2]);
            }
            if (nodeRaw['do'] !== undefined) {
                nodeRaw = nodeRaw['do'];
            }
            let bits = nodeRaw.split(/:/);
            node.lasttime = node.timeStamp;
            node.timeStamp = bits[0];
            node.quaternion = new THREE.Quaternion(bits[2], bits[3], bits[4], bits[1]);
            if (this.lastChange[addr] !== undefined) {
                let lastHeard = this.lastChange[addr].lastHeard;
                this.lastChange[addr].timesLastHeardSame++;
                if (node.lasttime != lastHeard) {
                    this.lastChange[addr].timesLastHeardSame = 0; this.lastChange[addr].lastHeard = node.lasttime;
                }
            } else {
                this.lastChange[addr] = { lastHeard: node.lasttime, timesLastHeardSame: 0 };
            }
            node.lastHeardSame = this.lastChange[addr].timesLastHeardSame;
        }
    }

    dropNode(addr): boolean {
        if (this.knownNodes[addr] !== undefined) {
            delete this.knownNodes[addr];
            return true;
        }
        return false;
    }

    getAllNodesRotationData(): { [addr: string]: THREE.Quaternion } {
        this.biotBrokerService.getAllNodesOrientation().subscribe(
            rawData => {
                this.addNodes(rawData);
            },
            error =>{}
        );
        let rotations: { [addr: string]: THREE.Quaternion } = {};
        let addresses = this.getNodeAddresses();
        for (let i = 0; i < addresses.length; i++) {
            let addr = addresses[i];
            if (this.knownNodes[addr] !== undefined) {
                rotations[addr] = this.knownNodes.quaternion;
            }
        }
        return rotations;
    }

    getNode(addr: string) : biotNodeType {
        return this.knownNodes[addr];
    }

    getNodes() : { [addr: string]: biotNodeType } {
        return this.knownNodes;
    }

    getNodeAddresses(): string[] {
        return Object.keys(this.knownNodes);
    }

    getAllNodesData() : { [addr: string]: biotNodeType } {
        this.biotBrokerService.getAllNodesData().subscribe(
            rawData => {
                this.addNodes(rawData);
            },
            error =>{}
        );
        return this.getNodes();
    }

    identifyNode(addr: string): boolean  {
        if (this.knownNodes[addr] !== undefined) {
            this.biotBrokerService.identify(addr);
            return true;
        }
        return false;
    }

    isNodeActive(addr: string): boolean {
        if (this.knownNodes[addr] !== undefined) {
            if (this.knownNodes[addr].lastHeardSame < 20) {
                return true;
            }
        }
        return false;
    }

    lostNodeSubscription(): Observable<string> {
        return this.lostNodes.asObservable();
    }

    setNodeProperty(addr: string, property: string, value: string): boolean {
        if (this.knownNodes[addr] === undefined) {
            return false;
        }
        if (this.knownNodes[addr].configuration === undefined) {
            this.knownNodes[addr].configuration = {
                'name': null,
                'type': null,
                'calibration': null,
                'interval': null,
                'auto': null,
                'dof': null,
                'led': null,
                'colour': null,
                'model': null
            };
        }
        this.knownNodes[addr].configuration[property] = value;
        return true;

    }


    setNodeProperties(addr: string, values: biotNodeConfigurationType): boolean {
        if (this.knownNodes[addr] === undefined) {
            return false;
        }
        let properties = Object.keys(values);
        for (let i = 0; i < properties.length; i++) {
            let property = properties[i];
            if (property !== undefined) {
                this.knownNodes[addr].configuration[property] = values[property];
            }
        }
        return true;
    }

    setPosition(addr: string, x: number, y: number, z: number): boolean {
        if (this.knownNodes[addr] === undefined) {
            return false;
        }
        this.knownNodes[addr].position = [x, y, z];
        return true;
    }

    setRotation(addr: string, q: THREE.Quaternion): boolean {
        if (this.knownNodes[addr] === undefined) {
            return false;
        }
        let node = this.knownNodes[addr];
        node[addr].quaternion = q;
        return true;
    }

    private updateLoop(self: NodeService) {
        if ((self.counter++ % 100) === 0) {
            self.getAllNodesData();
            self.counter = 1;
        } else {
            self.getAllNodesRotationData();
        }
    }
}
