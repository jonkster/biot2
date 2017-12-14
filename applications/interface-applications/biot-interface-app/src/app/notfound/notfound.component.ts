import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import {ThreedService} from '../threed/threed.service';
import {LimbService} from '../limbservice/limb.service';
import {ObjectDrawingService} from '../objectdrawing/object-drawing.service';
import * as THREE from 'three';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.css']
})
export class NotfoundComponent implements AfterViewInit {

  public currentPage: string;

  private image: THREE.Object3D;
  private model: THREE.Object3D;

  constructor(router: Router, private threedService: ThreedService, private limbService: LimbService, private objectDrawingService: ObjectDrawingService) {
      this.currentPage = router.url;
  }

  ngAfterViewInit() {

            // set up some test objects
            

            this.objectDrawingService.setStandardBackground();
            this.model = this.limbService.makeLimbFromModel('skeleton.json', 10); 
            this.objectDrawingService.addStaticObject('not-found-model', this.model);
            this.threedService.setBackgroundColour('#7fffff');

            this.wobble();
            this.threedService.zoom(1.5);
  }


  wobble() {
        requestAnimationFrame(() => {
            this.model.rotateZ(-0.0013);
            this.model.rotateY(-0.0023);
            this.model.rotateX(-0.00011);

            this.wobble();
        });
  }

}
