import { Injectable } from '@angular/core';
import { NodemodelService } from './nodemodel.service';
import { HttpModule, Http, Response, URLSearchParams } from '@angular/http';

import * as THREE from 'three';

@Injectable()
export class LimbmakerService {

    constructor(private nodemodel: NodemodelService, private http: Http) {
        this.lookupKnownModels();
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
        var factor = 10;  
        var material = new THREE.MeshStandardMaterial( { color: '#7f7f7f'} );
        var box = new THREE.Group();
        var loader = new THREE.ObjectLoader();
        loader.load('./assets/models/' + limbModelName,
            function(obj) {
                if (obj.type === "Scene") {
                    obj = obj.children[0];
                }
                obj.geometry.computeBoundingSphere();
                obj.userData['defaultBoundingSphereRadiusCm'] = obj.geometry.boundingSphere.radius * obj.scale.x * factor;
                obj.userData['defaultBoundingSphereRadiusThree'] = obj.geometry.boundingSphere.radius;
                obj.name = limbModelName.replace(/.json$/, '');
                obj.geometry.center();
                obj.position.set(0, 0, 0);
                // make hinge at end
                let matrix  = new THREE.Matrix4().makeTranslation(0, -obj.geometry.boundingSphere.radius, 0 );
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

        var limb = new THREE.Group();
        limb.position.x = x;
        limb.position.y = y;
        limb.position.z = z;

        var limbRadius = limbLength/10;
        var limbGeometry = new THREE.CylinderGeometry( limbRadius, limbRadius, limbLength, 50 );
        var matrix = new THREE.Matrix4();
        // shift so hinge point is at end of limb not middle
        matrix  = new THREE.Matrix4().makeTranslation(0, -limbLength/2, 0 );
        limbGeometry.applyMatrix( matrix );

        /* Make an ENVELOPE for the Limb */
        var limbMaterial = this.makeLimbMaterial(colour);

        var limbEnvelope = new THREE.Mesh( limbGeometry, limbMaterial );
        limbEnvelope.rotateZ(Math.PI/2);
        limbEnvelope.position.z = 0;
        limbEnvelope.castShadow = true;
        limbEnvelope.receiveShadow = true;
        limbEnvelope.name = 'envelope-' + name;
        limbEnvelope.userData['type'] = 'envelope';
        limb.add(limbEnvelope);

        limb.name = name;
        limb.castShadow = true;
        limb.receiveShadow = true;
        limb.userData = {
            'parent': null,
            'address': name,
            'displayName': displayName,
            'limbLength': limbLength,
            'limbRadius': limbRadius,
            'defaultX' : x,
            'defaultY' : y,
            'defaultZ' : z
        };

        var localAxis = this.makeAxis(0, 0, 0, 40, 2, 0.35);
        localAxis.castShadow = true;
        limb.add(localAxis);

        if (parentLimb !== null) {
            parentLimb.add(limb);
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
