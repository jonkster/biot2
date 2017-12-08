import { Injectable } from '@angular/core';
import {ThreedService} from '../threed/threed.service';
import {NodeService} from '../nodeservice/node.service';
import * as THREE from 'three';

@Injectable()
export class ObjectDrawingService {

    private isUpdating: boolean= false;
    private knownNodeMonitoredObjects: { [addr: string]: THREE.Object3D } = {};
    private staticObjects: { [name: string]: THREE.Object3D } = {};
    private worldSpace: THREE.Object3D = undefined;

    constructor(
        private nodeService: NodeService,
        private threedService: ThreedService
    ) { } 

    addNodeMonitoredObject(addr: string, obj: THREE.Object3D): boolean {
        let node = this.nodeService.getNode(addr);
        if (node !== undefined) {
            this.knownNodeMonitoredObjects[addr] = obj;
            obj.position.set(node.position[0], node.position[1], node.position[2]);
            obj.setRotationFromQuaternion(node.quaternion.normalize());
            this.threedService.add(obj);
            return true;
        } else {
            return false;
        }
    }

    addStaticObject(name: string, obj: THREE.Object3D) {
        this.staticObjects[name] = obj;
        this.threedService.add(obj);
    }

    getNodeMonitoredObject(addr: string): THREE.Object3D {
        return this.knownNodeMonitoredObjects[addr];
    }

    getStaticObject(name: string): THREE.Object3D {
        return this.staticObjects[name];
    }

    removeStaticObject(name: string) {
        if (this.staticObjects[name] !== undefined) {
            this.threedService.remove(this.staticObjects[name]);
            delete this.staticObjects[name];
        }
    }

    setAllEnvelopeVisibility(visible: boolean) {
        let addresses = Object.keys(this.knownNodeMonitoredObjects);
        for (let i = 0; i < addresses.length; i++) {
            let addr = addresses[i];
            this.setEnvelopeVisibility(addr, visible);
        }
    }

    setEnvelopeVisibility(addr: string, visible: boolean) {
        let obj = this.getNodeMonitoredObject(addr);
        if (obj !== undefined) {
            obj.traverse(function(part) {
                if (part.name.match(/^envelope-/)) {
                    part.visible = visible;
                }
            });
        }
    }

    setStandardBackground() {
        this.threedService.addLighting(0, 0, 0);

        this.threedService.setBackgroundColour('#e0ffff');
        const texture = THREE.ImageUtils.loadTexture('./assets/mocap.png');
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        const material = new THREE.MeshLambertMaterial({map: texture, opacity: 0.4, transparent: true});
        material.side = THREE.DoubleSide;
        const geometry = new THREE.PlaneGeometry(2000, 2000, 0);
        geometry.translate(0, 0, -165);
        let floor = new THREE.Mesh(geometry, material);
        floor.receiveShadow = true;

        // line up so can read logo
        floor.rotateZ(Math.PI/2);

        this.worldSpace = new THREE.Group();
        this.worldSpace.add(floor);

        let axis = this.threedService.makeAxis(0, 0, 0, 420, 1, 0.1);
        this.worldSpace.add(axis);

        // tilt slightly
        this.worldSpace.rotateY(0.2);
        this.threedService.add(this.worldSpace);
        //this.objectDrawingService.startUpdating();
    }

    setStaticObjectVisibility(name: string, visible: boolean) {
        if (this.staticObjects[name] !== undefined) {
            this.staticObjects[name].visible = visible;
        }
    }

    startUpdating() {
        if (this.isUpdating) {
            return;
        }
        this.threedService.addAnimationTask('update-objects', this.updateObjects, this);
        this.isUpdating = true;
    }

    updateObjects(self) {
        if (self.knownNodeMonitoredObjects !==  {}) {
            let addresses = Object.keys(self.knownNodeMonitoredObjects);
            for (let i = 0; i < addresses.length; i++) {
                let addr = addresses[i];
                let obj = self.knownNodeMonitoredObjects[addr];
                if (obj !== undefined) {
                    let node = self.nodeService.getNode(addr);
                    if (node !== undefined) {
                        obj.setRotationFromQuaternion(node.quaternion.normalize());
                    }
                }
            }
        }
    }

}
