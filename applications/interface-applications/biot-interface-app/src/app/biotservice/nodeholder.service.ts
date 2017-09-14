import { Injectable } from '@angular/core';
import {BiotService} from '../biotservice/biot.service';
import * as THREE from 'three';

@Injectable()
export class NodeholderService {

    private biotService: BiotService;
    private nodeList: any = {};
    private lastError = '';
    private updating = false;
    private counter = 0;

  constructor(biotService: BiotService) {
        this.biotService = biotService;
  }

  addNode(addr: string, type: string, name: string, x: number, y: number, z: number, q: any, colour: string): boolean {
      if (this.nodeKnown(addr)) {
          return false;
      } else {
        let quaternion = new THREE.Quaternion(q.x, q.y, q.z, q.w);
        this.nodeList[addr] = {
            'address': addr,
            'type': type,
            'name': name,
            'position': [ x, y, z ],
            'quaternion': quaternion,
            'timeStamp': -1,
            'calibration': '',
            'interval': '',
            'auto': '',
            'dof': '',
            'led': '',
            'lasttime': '',
            'colour': colour,
            'model': undefined
        };
        return true;
      }
  }

  add3DModel(addr: string, node: THREE.Object3D): boolean {
      if (! this.updating) {
        this.updating = true;
        this.startUpdateLoop();
      }
      if (this.nodeList[addr] === undefined) {
          this.lastError = 'node address: ' + addr + ' not known!';
          return false;
      } else {
          this.nodeList[addr].model = node;
          return true;
      }
  }

  setLedMode(addr: string, mode: number) {
      var node = this.getNode(addr);
      if (node.model !== undefined) {
          let nodeModel = node.model;
          nodeModel.userData.ledMode = mode;
          if (mode === 3) {
              nodeModel.userData.alertState = 20;
          }
          this.flashNode(addr);
      }
  }

  flashNode(addr: string) {
      var node = this.getNode(addr);
      if (node.model !== undefined) {
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

  getNodeAddresses() {
      return Object.keys(this.nodeList);
  }

  getAllNodeData() {
      const knownNodes = this.getNodeAddresses();
      for (let i = 0; i < knownNodes.length; i++) {

          const addr = knownNodes[i];
          const node = this.nodeList[addr];

          if (node.type.match(/DUMMY/)) {
              var q3js = new THREE.Quaternion();
              q3js.setFromAxisAngle( new THREE.Vector3( 0.78, 0.78, 0 ), Math.random()*Math.PI / 180 );

              let cq = node.quaternion;
              cq.multiplyQuaternions(q3js, cq);
              cq.normalize();
              this.setRotation(node, cq);

          } else {
            this.biotService.getANodesData(addr).subscribe(
                rawData => {
                    node.calibration = rawData.calibration;
                    node.interval = rawData.interval;
                    node.auto = rawData.auto;
                    node.dof = rawData.dof;
                    node.led = rawData.led;
                    let posData = rawData["data"];
                    let parts = posData.split(/:/);
                    node.lasttime = node.timeStamp;
                    node.timeStamp = Number(parts[0]);
                    var q3js = new THREE.Quaternion(Number(parts[2]), Number(parts[3]), Number(parts[4]), Number(parts[1]));
                    node.quaternion = q3js;
                    this.setRotation(node, q3js);
                },
                error => {
                    console.log('error getting data:', error);
                }
            );

          }
      }
  }

  getError(): string {
      let error = this.lastError;
      this.lastError = '';
      return error;
  }

  getNode(addr: string) {
      return this.nodeList[addr];
  }

  getNodes() {
      return this.nodeList;
  }


  nodeKnown(addr) : boolean {
      return this.nodeList[addr] !== undefined;
  }

  nodeKnownAndVisible(addr) : boolean {
      if (this.nodeKnown(addr)) {
          return  true;
      }
      return false;
  }


  rename(addr: string, name: string) {
      let node = this.getNode(addr);
      if (node !== undefined) {
          node.name = name;
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
          this.lastError = 'attempt to set rotation of non displayed node';
          console.log(node, this.getError());
      }
  }

  startUpdateLoop() {
      this.biotService.detectNodes();
      if (this.updating) {
          requestAnimationFrame(() => {
              this.getAllNodeData();
              this.counter++;
                setTimeout(e => {
                    this.startUpdateLoop();
                }, 1);
          });
      }
  }

}
