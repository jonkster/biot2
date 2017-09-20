import { Injectable } from '@angular/core';
import {BiotService} from '../biotservice/biot.service';
import { Subject, Observable } from "rxjs/Rx";
import * as THREE from 'three';
import {PeriodicService} from '../periodic.service';

type biotNodeType = {
    'address': string,
    'type': string,
    'name': string,
    'position': [ number, number, number ],
    'quaternion': any,
    'timeStamp': number,
    'calibration': string,
    'interval': string,
    'auto': string,
    'dof': string,
    'led': string,
    'lasttime': number,
    'colour': string,
    'model': any
};

@Injectable()
export class NodeholderService {

    private lostNodes: Subject<string> = new Subject();
    private managedNodeList: { [addr: string]: biotNodeType } = {};
    private unmanagedNodeList: { [addr: string]: biotNodeType } = {};
    private lastChange: {
        [addr: string]: {
            lastHeard: number,
            timesLastHeardSame: number
        }
    } = {};
    private lastError = '';
    private counter: number = 0;


  constructor(private biotService: BiotService, private periodicService: PeriodicService) {
        this.biotService = biotService;
        this.periodicService.registerTask('node update', this, this.updateLoop);
  }

  addNode(addr: string, type: string, name: string, x: number, y: number, z: number, q: any, colour: string): boolean {
      if (this.isNodeManaged(addr)) {
          return false;
      } else {
        let quaternion = new THREE.Quaternion(q.x, q.y, q.z, q.w);
        this.managedNodeList[addr] = this.makeNewNode(
            addr, type, name, [x, y, z], quaternion, -1, undefined, undefined, undefined, undefined, undefined, -1, colour
        );
        return true;
      }
  }

  add3DModel(addr: string, node: THREE.Object3D): boolean {
      if (this.managedNodeList[addr] === undefined) {
          this.lastError = 'node address: ' + addr + ' not known!';
          return false;
      } else {
          this.managedNodeList[addr].model = node;
          return true;
      }
  }

  dropNode(addr) {
      if (this.managedNodeList[addr] !== undefined) {
          delete this.managedNodeList[addr];
      }
      this.biotService.dropNode(addr);
  }

  flashNode(addr: string) {
      var node = this.getManagedNode(addr);
      if ((node !== undefined) && (node.model !== undefined)) {
          let nodeModel = node.model;
          let ledMode = nodeModel.userData.ledMode;
          let ledOn = nodeModel.getObjectByName('led-on');
          let ledOff = nodeModel.getObjectByName('led-off');

          if (ledOn !== undefined) {
              let flashInterval = 1500;
              if (ledMode === 0) {
                  ledOn.visible = false;
                  ledOff.visible = true;
                  return;
              } else if (ledMode === 1) {
                  ledOn.visible = true;
                  ledOff.visible = false;
                  return;
              } else if (ledMode === 2) {
                  flashInterval = 1500;
              } else if (ledMode === 3) {
                  flashInterval = 300;
                  if (nodeModel.userData.alertState > 0) {
                      nodeModel.userData.alertState--;
                  } else {
                      nodeModel.userData.ledMode = 2;
                      return;
                  }
              }
              ledOn.visible = ! ledOn.visible;
              ledOff.visible = ! ledOff.visible;
              let siht = this;
              setTimeout(e => {
                  siht.flashNode(addr);
              }, flashInterval);
          }
      }
  }

  getNodeAddresses(): string[] {
      return Object.keys(this.managedNodeList);
  }

  getAllNodeData() {
      let allNodeAddresses = this.biotService.getDetectedAddresses();
      for (let i = 0; i < allNodeAddresses.length; i++) {

          const addr = allNodeAddresses[i];
          let managed = true;
          this.biotService.getANodesData(addr).subscribe(
              rawData => {
                  let node = this.getManagedNode(addr);
                  if (node === undefined) {
                      node = this.getUnmanagedNode(addr);
                      if (node === undefined) {
                            node = this.makeNewNode(addr);
                            this.unmanagedNodeList[addr] = node;
                      }
                      managed = false;
                  }
                  if (node !== undefined) {
                      node.calibration = rawData.calibration;
                      node.interval = rawData.interval;
                      node.auto = rawData.auto;
                      node.dof = rawData.dof;
                      node.led = rawData.led;
                      let posData = rawData["data"];
                      if (posData !== undefined) {
                          let parts = posData.split(/:/);
                          node.lasttime = node.timeStamp;
                          node.timeStamp = Number(parts[0]);
                          var q3js = new THREE.Quaternion(Number(parts[2]), Number(parts[3]), Number(parts[4]), Number(parts[1]));
                          node.quaternion = q3js;
                          this.setRotation(node, q3js);
                          if (this.lastChange[addr] !== undefined)
                          {
                              let lastHeard = this.lastChange[addr].lastHeard;
                              this.lastChange[addr].timesLastHeardSame++;
                              if (node.lasttime != lastHeard) {
                                  this.lastChange[addr].timesLastHeardSame = 0;
                                  this.lastChange[addr].lastHeard = node.lasttime;
                              }
                          } else {
                              this.lastChange[addr] = {
                                  lastHeard: node.lasttime,
                                  timesLastHeardSame: 0
                              }
                          }
                          if (managed && this.lastChange[addr].timesLastHeardSame > 200) {
                              this.warnLostNode(addr);
                          }
                      } else {
                          this.dropNode(addr);
                      }
                  };
              },
              error => {
                  console.log('error getting data:', error);
                  if (this.unmanagedNodeList[addr] !== undefined) {
                      delete this.unmanagedNodeList[addr];
                  }
              }
          );
      }
  }

  getError(): string {
      let error = this.lastError;
      this.lastError = '';
      return error;
  }

  getManagedNode(addr: string) {
      return this.managedNodeList[addr];
  }

  getNodes() {
      return this.managedNodeList;
  }

  getUnmanagedNode(addr: string): biotNodeType {
      return this.unmanagedNodeList[addr];
  }

  isActiveNode(addr: string): boolean {
      if (this.lastChange[addr] !== undefined) {
          if (this.lastChange[addr].timesLastHeardSame < 20) {
              return true;
          }
      }
      return false;
  }

  isNodeManaged(addr: string): boolean {
      return this.managedNodeList[addr] !== undefined;
  }


  lostNodeSubscription(): Observable<string> {
      return this.lostNodes.asObservable();
  }

  makeNewNode(
    address: string,
    type: string = undefined,
    name: string = undefined,
    position: [ number, number, number ] = [0, 0, 0],
    quaternion: any = undefined,
    timeStamp: number = undefined,
    calibration: string = undefined,
    interval: string = undefined,
    auto: string = undefined,
    dof: string = undefined,
    led: string = undefined,
    lasttime: number = undefined,
    colour: string = undefined,
    model: any = undefined): biotNodeType {
        let n = {
            address: address,
            type: type,
            name: name,
            position: position,
            quaternion: quaternion,
            timeStamp: timeStamp,
            calibration: calibration,
            interval: interval,
            auto: auto,
            dof: dof,
            led: led,
            lasttime: lasttime,
            colour: colour,
            model: model};
        return n;
  }


  rename(addr: string, name: string) {
      let node = this.getManagedNode(addr);
      if (node !== undefined) {
          node.name = name;
      }
  }

  setLedMode(addr: string, mode: number) {
      var node = this.getManagedNode(addr);
      if (node.model !== undefined) {
          let nodeModel = node.model;
          nodeModel.userData.ledMode = mode;
          if (mode === 3) {
              nodeModel.userData.alertState = 20;
          }
          this.flashNode(addr);
      }
  }


  setPosition(node: any, x: number, y: number, z: number) {
      if  (node.model !== undefined) {
          node.position = [x, y, z];
          node.model.position.set(x, y, z);
      } else {
          this.lastError = 'attempt to set position of non displayed node';
          console.log(node, this.getError());
      }
  }

  setRotation(node: THREE.Object3D, q: any) {
      if  (node.model !== undefined) {
          let quaternion = new THREE.Quaternion(q.x, q.y, q.z, q.w);
          node.quaternion = q;
          node.model.setRotationFromQuaternion(quaternion);
      } else {
          /*this.lastError = 'attempt to set rotation of non displayed node';
          console.log(node, this.getError());*/
      }
  }

  updateLoop(owner: any) {
      if ((owner.counter++ % 100) === 0) {
              owner.biotService.detectNodes();
      }
      owner.getAllNodeData();
  }

  warnLostNode(addr) {
        this.lostNodes.next(addr);
  }


}
