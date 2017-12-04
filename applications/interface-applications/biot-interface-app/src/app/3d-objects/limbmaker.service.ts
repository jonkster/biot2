import { Injectable } from '@angular/core';
import { NodemodelService } from './nodemodel.service';
import { HttpModule, Http, Response, URLSearchParams } from '@angular/http';

import * as THREE from 'three';

@Injectable()
export class LimbmakerService {

    constructor(private nodemodel: NodemodelService, private http: Http) {
        this.lookupKnownModels();
    }

    attachLimbToParent(limb: THREE.Object3D, parentLimb: THREE.Object3D) {
        let p = parentLimb.position;
        let l = parentLimb.userData.limbLength;

        limb.userData.parentLimbName = parentLimb.userData.displayName;
        parentLimb.add(limb);
        console.log(limb);
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

    setLimbSize(limb: THREE.Object3D, l: number) {
        let ratio = l / limb.userData.limbLength;
        limb.scale.multiplyScalar(ratio);
        let child = this.getChildLimb(limb);
        if (child !== undefined) {
            child.scale.divideScalar(ratio);
        }
    }

    getChildLimb(limb: THREE.Object3D) {
        let childLimb = undefined;
        for (let i = 0; i < limb.children.length; i++) {
            let child = limb.children[i];
            if ((child.type === 'Group') && (child.userData.parentLimbName !== undefined)) {
                childLimb = child;
            }
        }
        return childLimb;
    }

    lookupKnownModels() {
        const url = "assets/models/modelnames.json";
        return this.http.get(url)
            .map((response) => response.json());
    }

    makeAxis(x: number, y: number, z: number, length: number, width: number, brightness: number) {
        var group = new THREE.Object3D();

        var r = new THREE.Color(0.5, 0.1, 0.1).offsetHSL(0, 0, brightness);
        var g = new THREE.Color(0.1, 0.5, 0.1).offsetHSL(0, 0, brightness);
        var b = new THREE.Color(0.1, 0.1, 0.5).offsetHSL(0, 0, brightness);

        let tickSpacing = 10;
        let tickWidth = 1;

        // red X
        var lmaterial = new THREE.LineBasicMaterial( {color: r.getHex(), linewidth: width});
        var lgeometry = new THREE.Geometry();
        lgeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        lgeometry.vertices.push(new THREE.Vector3(length, 0, 0));
        var line = new THREE.Line(lgeometry, lmaterial);
        line.castShadow = true;
        line.receiveShadow = true;
        group.add(line);
        for (let i = 0; i < length; i += tickSpacing) {
            var lgeometry = new THREE.Geometry();
            lgeometry.vertices.push(new THREE.Vector3(i, -tickWidth, 0));
            lgeometry.vertices.push(new THREE.Vector3(i, tickWidth, 0));
            line = new THREE.Line(lgeometry, lmaterial);
            line.castShadow = true;
            line.receiveShadow = true;
            group.add(line);
        }
        group.name = 'axis:' + x + '-' + y + '-' + z + ':' + length + 'x' + width;

        // green Y
        lmaterial = new THREE.LineBasicMaterial( {color: g.getHex(), linewidth: width} );
        lgeometry = new THREE.Geometry();
        lgeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        lgeometry.vertices.push(new THREE.Vector3(0, length, 0));
        line = new THREE.Line(lgeometry, lmaterial);
        line.castShadow = true;
        line.receiveShadow = true;
        group.add(line);
        for (let i = 0; i < length; i += tickSpacing) {
            var lgeometry = new THREE.Geometry();
            lgeometry.vertices.push(new THREE.Vector3(0, i, -tickWidth));
            lgeometry.vertices.push(new THREE.Vector3(0, i, tickWidth));
            line = new THREE.Line(lgeometry, lmaterial);
            line.castShadow = true;
            line.receiveShadow = true;
            group.add(line);
        }

        // blue Z
        lmaterial = new THREE.LineBasicMaterial( {color: b.getHex(), linewidth: width} );
        lgeometry = new THREE.Geometry();
        lgeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        lgeometry.vertices.push(new THREE.Vector3(0, 0, length));
        line = new THREE.Line(lgeometry, lmaterial);
        line.castShadow = true;
        line.receiveShadow = true;
        group.add(line);
        for (let i = 0; i < length; i += tickSpacing) {
            var lgeometry = new THREE.Geometry();
            lgeometry.vertices.push(new THREE.Vector3(0, -tickWidth, i));
            lgeometry.vertices.push(new THREE.Vector3(0, tickWidth, i));
            line = new THREE.Line(lgeometry, lmaterial);
            line.castShadow = true;
            line.receiveShadow = true;
            group.add(line);
        }

        group.position.x = x;
        group.position.y = y;
        group.position.z = z;

        return group;
    }


    makeLimbFromModel(limbModelName, scale) {
        var factor = 8;  
        var material = new THREE.MeshStandardMaterial( { color: '#7f7f7f'} );
        var box = new THREE.Group();
        var loader = new THREE.ObjectLoader();
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

    makeLimbWithNode() {
        let limb = this.makeLimbFromModel('prosthetic-foot.json', 70);
        var node = this.makeNodeModel('test-node', 'DUMMY-IMU', 'TEST NODE', 0, -155, -35, '#ff2222');
        node.rotateZ(Math.PI);
        limb.add(node);
        return limb;
    }

    makeLimb(parentLimb: THREE.Object3D,
        name: string,
        displayName: string,
        x: number,
        y: number,
        z: number,
        colour: string,
        limbLength: number) {

        /* make 'limb' */
        var limb = new THREE.Group();
        limb.position.x = x;
        limb.position.y = y;
        limb.position.z = z;


        /* make joint */
        var jointMaterial = new THREE.MeshPhongMaterial({
            'transparent': true,
            'color': 0xff7f7f,
            'specular': 0xffffff,
            'shininess': 10 
        });

        // make a joint object for the limb
        var geometry = new THREE.BoxGeometry(2, limbLength/2, 2);
        var joint = new THREE.Mesh(geometry, jointMaterial);
        limb.add(joint);


        /* Make an ENVELOPE for the Limb */
        var limbRadius = limbLength/10;
        var envelopeGeometry = new THREE.CylinderGeometry( limbRadius, limbRadius, limbLength, 50 );
        var matrix = new THREE.Matrix4();
        // shift so hinge point is at end of limb not middle
        matrix  = new THREE.Matrix4().makeTranslation(0, -limbLength/2, 0 );
        envelopeGeometry.applyMatrix( matrix );

        var envelopeMaterial = this.makeLimbMaterial(colour);

        var limbEnvelope = new THREE.Mesh( envelopeGeometry, envelopeMaterial );
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
        var localAxis = this.makeAxis(0, 0, 0, limbLength*1.2, 2, 0.35);
        localAxis.castShadow = true;
        limb.add(localAxis);

        if (parentLimb !== null) {
            parentLimb.add(limb);
            limb.position.x = parentLimb.userData.limbLength;
        }
        return limb;
    }

    makeLimbMaterial(colour: string) {

        var limbMaterial = new THREE.MeshPhongMaterial({
            'transparent': true,
            'opacity': 0.3,
            'color': colour,
            'specular': 0xffffff,
            'shininess': 10
        });
        return limbMaterial;
    }

    makeNodeModel(name: string, type: string, displayName: string, x: number, y: number, z: number, colour: string) {
        let node = this.nodemodel.makeNodeModel(name, type, displayName, x, y, z, colour);
        var localAxis = this.makeAxis(0, 0, 0, 30, 0.1, 0.35);
        node.add(localAxis);
        return node;
    }

}
