import { Injectable } from '@angular/core';
import {ThreedService} from '../threed/threed.service';
import {LimbService} from '../limbservice/limb.service';
import {NodeService} from '../nodeservice/node.service';
import * as THREE from 'three';

@Injectable()
export class ObjectDrawingService {

    private isUpdating: boolean= false;
    private knownNodeMonitoredObjects: { [addr: string]: THREE.Object3D } = {};
    private staticObjects: { [name: string]: THREE.Object3D } = {};
    private worldSpace: THREE.Object3D = undefined;

    constructor(
        private limbService: LimbService,
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

    removeNodeMonitoredObject(addr: string) {
        if (this.knownNodeMonitoredObjects[addr] !== undefined) {
            this.threedService.remove(this.knownNodeMonitoredObjects[addr]);
            delete this.knownNodeMonitoredObjects[addr];
        }
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
        //this.startUpdating();
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


    // an attached limb will be rotated by its parent - remove the parent
    // rotation of a limb.
    unrotateByParent(obj: THREE.Object3D) {
        let parentL = this.limbService.getParentLimb(obj);
        if (parentL !== undefined) {
            let addr = parentL.userData.address;
            let node = this.nodeService.getNode(addr);
            if (node !== undefined) {
                obj.position.set(node.position[0], node.position[1], node.position[2]);
                if (obj.userData.limbRotationX !== undefined) {
                    obj.rotateX(obj.userData.limbRotationX);
                    obj.rotateY(obj.userData.limbRotationY);
                    obj.rotateZ(obj.userData.limbRotationZ);
                }
                let q = obj.quaternion.normalize();
                let pQ = node.quaternion.clone();
                q.multiply(pQ.conjugate());
                obj.setRotationFromQuaternion(q);
            }
        }
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
                        obj.position.set(node.position[0], node.position[1], node.position[2]);
                        obj.setRotationFromQuaternion(node.quaternion.normalize());
                        if (obj.userData.limbRotationX !== undefined) {
                            obj.rotateX(obj.userData.limbRotationX);
                            obj.rotateY(obj.userData.limbRotationY);
                            obj.rotateZ(obj.userData.limbRotationZ);
                        }
                        self.unrotateByParent(obj);
                    }
                }
            }
        }
    }

    updateStaticObject(name: string, position: number[], quat: THREE.Quaternion) {
        let model = this.getStaticObject(name);
        if (model != undefined) {
            model.position.set(position[0], position[1], position[2]);
            model.setRotationFromQuaternion(quat);
            if (model.userData.limbRotationX !== undefined) {
                model.rotateX(model.userData.limbRotationX);
                model.rotateY(model.userData.limbRotationY);
                model.rotateZ(model.userData.limbRotationZ);
            }
        } else {
            console.log('no such model?', name);
        }
    }

}
