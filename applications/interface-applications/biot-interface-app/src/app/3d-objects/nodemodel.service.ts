import { Injectable } from '@angular/core';

import * as THREE from 'three';

@Injectable()
export class NodemodelService {

  constructor() { }

  makeLed() {
      let ledOnMaterial = new THREE.MeshPhongMaterial({
          /*'transparent': true,
          'opacity': 0.8,*/
          'color': 0xff0000,
          'specular': 0xffff00,
          'ambient': 0x000000,
          'emissive': 0xd0d0d0,
          'shininess': 30
      });
      let ledOffMaterial = new THREE.MeshPhongMaterial({
          'transparent': true,
          'opacity': 0.7,
          'color': 0xaa7f7f,
          'specular': 0xffff00,
          'ambient': 0x000000,
          'emissive': 0x000033,
          'shininess': 0
      });
      let ledGeometry = new THREE.SphereGeometry( 5, 5, 5 );
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
      ledHolder.position.set(0, 0, 5);
      return ledHolder;
  }

  makeNodeModel(
        name: string,
        type: string,
        displayName: string,
        x: number,
        y: number,
        z: number,
        colour: string) {

      let mOpts = { 'color': colour };
        if (type.match(/DUMMY/)) {
            mOpts['opacity'] = 0.3;
            mOpts['transparent'] = true;
        }
        let box = new THREE.Group();
        box.userData = {
            'displayName': displayName,
            'ledMode': 2,
            'alertState': 0,
            'type': type
        }
        box.add(this.makeLed());

        let siht = this;
        let loader = new THREE.JSONLoader();
        loader.load('./assets/nodemodel.json',
            function(geometry) {
                geometry.center();
                let material = new THREE.MeshPhongMaterial( mOpts );
                let obj = new THREE.Mesh(geometry, material);
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
