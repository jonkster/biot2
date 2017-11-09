import { Injectable } from '@angular/core';
import * as THREE from 'three';

@Injectable()
export class LimbAssemblyService {

  private limbData: any = {};  

  constructor() { }

  newLimb(name: string) {
      return {
          name: name,
          limbModel: 'default',
          parentLimbName: 'none',
          position: {
              x: 0,
              y: 0,
              z: 0,
              q: new THREE.Quaternion(0, 0, 0, 1)
          }
      }
  }

  getLimbs(addresses: string[]) {
      let activeLimbs: any = {};
      for (let i = 0; i < addresses.length; i++) {
          let addr = addresses[i];
          if (this.limbData[addr] === undefined) {
              this.limbData[addr] = this.newLimb('limb-' + i);
              activeLimbs[addr] = this.limbData[addr];
          }
      }
      return activeLimbs;
  }

}
