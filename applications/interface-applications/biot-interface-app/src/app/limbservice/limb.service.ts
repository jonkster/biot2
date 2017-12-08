import { Injectable } from '@angular/core';
import { HttpModule, Http, Response, URLSearchParams } from '@angular/http';
import {ThreedService} from '../threed/threed.service';
import { Observable } from 'rxjs/Observable';

import * as THREE from 'three';

@Injectable()
export class LimbService {

    private knownModels: string[] = [];

    constructor(private http: Http, private threedService: ThreedService) {
        this.lookupKnownModelNames();
    }

    attachLimbToParent(limb: THREE.Object3D, parentLimb: THREE.Object3D): THREE.Object3D {
        let p = parentLimb.position;
        let l = parentLimb.userData.limbLength;

        limb.userData.parentLimbName = parentLimb.userData.displayName;
        parentLimb.add(limb);
        limb.position.set(l, 0, 0);
        return limb;
    }

    attachModelToLimb(limb: THREE.Object3D, modelName: string) {
        let model = this.makeLimbFromModel(modelName, 1);
        model.userData.type = 'model';

        let existing = undefined;
        limb.traverse(function(parts) {
            if (parts.userData.type === 'model') {
                existing = parts;
            }
        });
        if (existing !== undefined) {
            limb.remove(existing);
        }
        limb.add(model);
    }

    getChildLimb(limb: THREE.Object3D): THREE.Object3D {
        let childLimb = undefined;
        for (let i = 0; i < limb.children.length; i++) {
            let child = limb.children[i];
            if ((child.type === 'Group') && (child.userData.parentLimbName !== undefined)) {
                childLimb = child;
            }
        }
        return childLimb;
    }

    getKnownModelNames(): string[] {
        return this.knownModels;
    }

    lookupKnownModelNames() {
        const url = "assets/models/modelnames.json";
        this.http.get(url)
            .map((response) => response.json())
            .subscribe(
                data => {
                    this.knownModels = data;
                },
                error => { console.log('error getting models', error); }
            );
    }

    makeLimb(parentLimb: THREE.Object3D,
        name: string,
        displayName: string,
        x: number,
        y: number,
        z: number,
        colour: string,
        limbLength: number): THREE.Object3D {

            /* make 'limb' */
            let limb = new THREE.Group();
            limb.position.x = x;
            limb.position.y = y;
            limb.position.z = z;


            /* make joint */
            let jointMaterial = new THREE.MeshPhongMaterial({
                'transparent': true,
                'color': 0xff7f7f,
                'specular': 0xffffff,
                'shininess': 10 
            });

            // make a joint object for the limb
            let geometry = new THREE.BoxGeometry(2, limbLength/2, 2);
            let joint = new THREE.Mesh(geometry, jointMaterial);
            limb.add(joint);


            /* Make an ENVELOPE for the Limb */
            let limbRadius = limbLength/10;
            let envelopeGeometry = new THREE.CylinderGeometry( limbRadius, limbRadius, limbLength, 50 );
            let matrix = new THREE.Matrix4();
            // shift so hinge point is at end of limb not middle
            matrix  = new THREE.Matrix4().makeTranslation(0, -limbLength/2, 0 );
            envelopeGeometry.applyMatrix( matrix );

            let envelopeMaterial = this.makeLimbMaterial(colour);

            let limbEnvelope = new THREE.Mesh( envelopeGeometry, envelopeMaterial );
            // align limbs long axis along X
            limbEnvelope.rotateZ(Math.PI/2);
            limbEnvelope.position.z = 0;
            limbEnvelope.castShadow = true;
            limbEnvelope.receiveShadow = true;
            limbEnvelope.name = 'envelope-' + name;
            limbEnvelope.userData['type'] = 'envelope';
            limb.add(limbEnvelope);


            limb.name = name;
            let parentName = "";
            if (parentLimb !== null) {
                parentName = parentLimb.name;
            }
            limb.castShadow = true;
            limb.receiveShadow = true;
            limb.userData = {
                'parentLimbName': parentName,
                'address': name,
                'colour': colour,
                'displayName': displayName,
                'limbLength': limbLength,
                'limbRadius': limbRadius,
                'limbRotationZ': 0,
                'limbRotationY': 0,
                'limbRotationX': 0,
                'limbModelName': '',
                'defaultX' : x,
                'defaultY' : y,
                'defaultZ' : z
            };

            /* make an axis display */
            let localAxis = this.threedService.makeAxis(0, 0, 0, limbLength*1.2, 2, 0.35);
            localAxis.castShadow = true;
            limb.add(localAxis);

            if (parentLimb !== null) {
                parentLimb.add(limb);
                limb.position.x = parentLimb.userData.limbLength;
            }
            return limb;
        }

        makeLimbFromModel(limbModelName, scale) {
            let factor = 8;  
            let material = new THREE.MeshStandardMaterial( { color: '#7f7f7f'} );
            let box = new THREE.Group();
            let loader = new THREE.ObjectLoader();
            loader.load('./assets/models/' + limbModelName,
                function(obj) {
                    if (obj.type === "Scene") {
                        obj = obj.children[0];
                    }
                    if ((obj.geometry === undefined) && (obj.children[0].geometry !== undefined)) {
                        obj = obj.children[0];
                    }
                    obj.geometry.computeBoundingSphere();
                    obj.userData['defaultBoundingSphereRadiusCm'] = obj.geometry.boundingSphere.radius * obj.scale.x * factor;
                    obj.userData['defaultBoundingSphereRadiusThree'] = obj.geometry.boundingSphere.radius;
                    obj.name = limbModelName.replace(/.json$/, '');
                    obj.geometry.center();
                    obj.position.set(0, 0, 0);
                    // make hinge at end
                    let matrix  = new THREE.Matrix4().makeTranslation(-obj.geometry.boundingSphere.radius, 0, 0 );
                    obj.geometry.applyMatrix( matrix );
                    // size adjust
                    obj.geometry.scale(scale, scale, scale);
                    obj.geometry.scale(factor, factor, factor);
                    obj.geometry.computeBoundingSphere();
                    obj.userData['defaultBoundingSphereRadiusThree'] = obj.geometry.boundingSphere.radius;
                    box.add(obj); 
                }
            );
            return box;
        }

        makeLimbMaterial(colour: string): THREE.Material {
            let limbMaterial = new THREE.MeshPhongMaterial({
                'transparent': true,
                'opacity': 0.3,
                'color': colour,
                'specular': 0xffffff,
                'shininess': 10
            });
            return limbMaterial;
        }

        setLimbSize(limb: THREE.Object3D, l: number) {
            let ratio = l / limb.userData.limbLength;
            limb.scale.multiplyScalar(ratio);
            let child = this.getChildLimb(limb);
            if (child !== undefined) {
                child.scale.divideScalar(ratio);
            }
        }

        makeLed(): THREE.Object3D {
            let ledOnMaterial = new THREE.MeshPhongMaterial({
                /*'transparent': true,
                 'opacity': 0.8,*/
                 'color': 0xff0000,
                 'specular': 0xffff00,
                 //'ambient': 0x000000,
                 'emissive': 0xd0d0d0,
                 'shininess': 30
            });
            let ledOffMaterial = new THREE.MeshPhongMaterial({
                'transparent': true,
                'opacity': 0.7,
                'color': 0xaa7f7f,
                'specular': 0xffff00,
                //'ambient': 0x000000,
                'emissive': 0x000033,
                'shininess': 0
            });
            let ledGeometry = new THREE.SphereGeometry( 0.3, 0.3, 0.3 );
            let ledOn = new THREE.Mesh( ledGeometry, ledOnMaterial );
            let ledOff = new THREE.Mesh( ledGeometry, ledOffMaterial );
            ledOn.name = 'led-on';
            ledOff.name = 'led-off';
            ledOff.visible = true;
            ledOn.visible = false;
            let ledHolder = new THREE.Group();
            ledHolder.name = 'led-holder';
            ledHolder.add(ledOn);
            ledHolder.add(ledOff);
            ledHolder.position.set(0, 0, -0.3);
            return ledHolder;
        }

        makeNodeModel(name: string, addr: string, colour: string, showAxis: boolean): THREE.Object3D {
            let mOpts = { 'color': colour };
            let box = new THREE.Group();
            box.name = 'g_' + name;
            box.userData = {
                'colour': colour,
                'displayName': name,
                'ledMode': 2,
                'alertState': 0
            }
            box.add(this.makeLed());
            if (showAxis) {
                let localAxis = this.threedService.makeAxis(0, 0, 0, 25, 2, 0.35);
                box.add(localAxis);
            }

            let siht = this;
            let loader = new THREE.ObjectLoader();
            loader.load('./assets/nodemodel.json',
                function(obj) {
                    if (obj.type === "Scene") {
                        obj = obj.children[0];
                    }
                    obj.geometry.center();
                    let material = new THREE.MeshPhongMaterial( mOpts );
                    obj.material = material;
                    obj.name = 'nodemodel-' + name;
                    obj.geometry.scale(20, 20, 20);
            //        obj.position.set(position[0], position[1], position[2]);
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                    box.add(obj);
                }
            );
            return box;
        }

}
