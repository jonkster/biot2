import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import {ThreedService} from '../threed/threed.service';
import {LimbmakerService} from '../3d-objects/limbmaker.service';
import * as THREE from 'three';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.css']
})
export class NotfoundComponent implements AfterViewInit {

  public currentPage: string;

  private threedService: ThreedService;
  private limbMakerService: LimbmakerService;
  private image: THREE.Object3D;
  private limb: THREE.Object3D;

  constructor(router: Router, threedService: ThreedService, limbMakerService: LimbmakerService) {
      this.currentPage = router.url;
      this.threedService = threedService;
      this.limbMakerService = limbMakerService;
  }

  ngAfterViewInit() {

            // set up some test objects
            
            this.threedService.setBackgroundColour('#ffffff');
            const texture = THREE.ImageUtils.loadTexture('./assets/mocap.png');
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 2, 2 );
            const material = new THREE.MeshBasicMaterial({map: texture, opacity: 0.2, transparent: true});
            material.side = THREE.DoubleSide;
            const geometry = new THREE.PlaneGeometry(800, 600, 0);
            this.image = new THREE.Mesh(geometry, material);
            this.image.rotateX(-Math.PI/2);

            let axis = this.limbMakerService.makeAxis(0, 0, 0, 420, 1, 0.1);

            this.limb = this.limbMakerService.makeLimbWithNode();
            this.limb.add(this.image);
            this.limb.add(axis);
            this.limb.rotateX(0.9);
            this.limb.rotateZ(0.9);
            this.threedService.add(this.limb);

            this.threedService.addLighting(0, 0, 0);

            this.wobble();

            this.threedService.zoom(1.5);
  }


  wobble() {
        requestAnimationFrame(() => {
            this.limb.rotateZ(-0.0013);
            this.limb.rotateY(-0.0023);
            this.limb.rotateX(-0.00011);

            this.wobble();
        });
  }

}
