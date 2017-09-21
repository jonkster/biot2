import { Injectable } from '@angular/core';
import { NodemodelService } from './nodemodel.service';

import * as THREE from 'three';

@Injectable()
export class LimbmakerService {

    private nodemodel: NodemodelService = undefined;

    constructor(nodemodel: NodemodelService) {
        this.nodemodel = nodemodel;
    }

    makeAxis(x: number, y: number, z: number, length: number, width: number, brightness: number) {
        var group = new THREE.Object3D();

        var r = new THREE.Color(0.5, 0.1, 0.1).offsetHSL(0, 0, brightness);
        var g = new THREE.Color(0.1, 0.5, 0.1).offsetHSL(0, 0, brightness);
        var b = new THREE.Color(0.1, 0.1, 0.5).offsetHSL(0, 0, brightness);

        var lmaterial = new THREE.LineBasicMaterial( {color: r.getHex(), linewidth: width});
        var lgeometry = new THREE.Geometry();
        lgeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        lgeometry.vertices.push(new THREE.Vector3(length, 0, 0));
        var line = new THREE.Line(lgeometry, lmaterial);
        group.add(line);
        group.name = 'axis:' + x + '-' + y + '-' + z + ':' + length + 'x' + width;
        line.castShadow = true;
        line.receiveShadow = true;

        lmaterial = new THREE.LineBasicMaterial( {color: g.getHex(), linewidth: width} );
        lgeometry = new THREE.Geometry();
        lgeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        lgeometry.vertices.push(new THREE.Vector3(0, length, 0));
        line = new THREE.Line(lgeometry, lmaterial);
        group.add(line);
        line.castShadow = true;
        line.receiveShadow = true;

        lmaterial = new THREE.LineBasicMaterial( {color: b.getHex(), linewidth: width} );
        lgeometry = new THREE.Geometry();
        lgeometry.vertices.push(new THREE.Vector3(0, 0, 0));
        lgeometry.vertices.push(new THREE.Vector3(0, 0, length));
        line = new THREE.Line(lgeometry, lmaterial);
        group.add(line);
        line.castShadow = true;
        line.receiveShadow = true;

        group.position.x = x;
        group.position.y = y;
        group.position.z = z;

        return group;
    }

    makeGenericLimb() {
        var material = new THREE.MeshStandardMaterial( { color: '#7f7f7f'} );
        var box = new THREE.Group();
        var loader = new THREE.JSONLoader();
        loader.load('./assets/prosthetic-foot.json',
            function(geometry) {
                var obj = new THREE.Mesh(geometry, material);
                geometry.center();
                obj.rotateX(Math.PI/2);
                obj.scale.set(70, 70, 70);
                obj.position.set(0, 160, 0);
                box.add(obj);
            }
        );
        return box;
    }

    makeLimbWithNode() {
        let limb = this.makeGenericLimb();
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
        var localAxis = this.makeAxis(0, 0, 0, 140, 2, 0.35);
        node.add(localAxis);
        return node;
    }
}
