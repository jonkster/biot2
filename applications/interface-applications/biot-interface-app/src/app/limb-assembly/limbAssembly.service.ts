import { Injectable } from '@angular/core';
import {NodeholderService} from '../biotservice/nodeholder.service';
import * as THREE from 'three';

@Injectable()
export class LimbAssemblyService {

    private limbData: any = {};  

    constructor(private nodeHolderService: NodeholderService) { }

    addLimbAsChildOf(node, parentLimbName) {
        console.log(node, parentLimbName);
        let parentNode = this.getNodeWithLimbName(parentLimbName);
        if (parentNode !== undefined) {
            node.model.position.set(parentNode.model.position.x, parentNode.model.position.y, parentNode.model.position.z);
            parentNode.model.add(node.model);
        }
    }

    getNodeWithLimbName(limbName) {
        let nodeData = this.nodeHolderService.getNodes();
        let addresses = Object.keys(nodeData);
        for (let i = 0; i < addresses.length; i++) {
            let address = addresses[i];
            let model = nodeData[address].limb.limbModel;
            if (model === limbName) {
                return nodeData[address];
            }
        }
        return undefined;
    }


    newLimb(name: string) {
        return {
            name: name,
            limbModel: 'default',
            parentLimbName: 'none',
            limbLength: 30,
            position: {
                x: 0,
                y: 0,
                z: 0,
                q: new THREE.Quaternion(0, 0, 0, 1)
            }
        }
    }

    getLimbNames() {
        let nodeData = this.nodeHolderService.getNodes();
        let addresses = Object.keys(nodeData);
        let names = [];
        for (let i = 0; i < addresses.length; i++) {
            let address = addresses[i];
            let model = nodeData[address].limb.limbModel;
            if (model !== 'default') {
                names.push(model);
            }
        }
        return names;
    }

    getSize(obj: THREE.Object3D) {
        obj.geometry.computeBoundingSphere();
        return obj.geometry.boundingSphere.radius;
    }

    sizeLimb(name: string, size: number, container: THREE.Object3D) {
        let limbModel = container.model.getObjectByName(name);
        if (limbModel !== undefined) {
            if (limbModel.children.length > 0) {
                let l = limbModel.children[0];
                let s = this.getSize(l);
                let oSize  = l.userData.defaultBoundingSphereRadiusThree;
                let defaultSize  = 2 * l.userData.defaultBoundingSphereRadiusCm;
                if (defaultSize !== undefined) {
                    let factor =  (size / defaultSize) * (oSize / s);
                    console.log(factor, size, s);
                    if (factor > 0)
                    {
                        l.geometry.scale(factor, factor, factor);
                    }
                }
            }
        }
    }

}
