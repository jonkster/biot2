import { Injectable } from '@angular/core';

import * as THREE from 'three';

@Injectable()
export class NodemodelService {

  constructor() { }

  makeNodeModel(
        name: string,
        type: string,
        displayName: string,
        x: number,
        y: number,
        z: number,
        colour: string) {

      var mOpts = { 'color': colour };
        if (type.match(/DUMMY/)) {
            mOpts['opacity'] = 0.3;
            mOpts['transparent'] = true;
        }
        var box = new THREE.Group();
        box.userData = {
            'displayName': displayName,
            'type': type
        }

        var loader = new THREE.JSONLoader();
        loader.load('./assets/nodemodel.json',
            function(geometry) {
                geometry.center();
                var material = new THREE.MeshPhongMaterial( mOpts );
                var obj = new THREE.Mesh(geometry, material);
                obj.scale.set(40, 40, 40);
                obj.position.set(x, y, z);
                obj.castShadow = true;
                obj.receiveShadow = true;
                box.add(obj);
            }
        );
        return box;
  }

}
