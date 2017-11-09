import { Component, OnInit, AfterContentChecked, ViewChild, ElementRef } from '@angular/core';
import {DialogComponent} from '../dialog/dialog.component';
import {BiotService} from '../biotservice/biot.service';
import {NodeholderService} from '../biotservice/nodeholder.service';
import {PeriodicService} from '../periodic.service';
import {ThreedService} from '../threed/threed.service';
import {LimbmakerService} from '../3d-objects/limbmaker.service';
import {Router} from '@angular/router';
import * as THREE from 'three';

@Component({
  selector: 'app-assemblies',
  templateUrl: './assemblies.component.html',
  styleUrls: ['./assemblies.component.css']
})
export class AssembliesComponent implements OnInit {

    @ViewChild('debugHolder') debugHolder: ElementRef;

    private knownModels: string[];
    private worldSpace: THREE.Object3D = undefined;

    constructor(private biotService: BiotService,
        private threedService: ThreedService,
        private limbMakerService: LimbmakerService,
        private nodeHolderService: NodeholderService,
        private router: Router,
        private periodicService: PeriodicService) {
    }

  ngOnInit() {
  }

  ngAfterViewInit() {
        this.threedService.addLighting(0, 0, 0);

        this.threedService.setBackgroundColour('#e0ffff');
        const texture = THREE.ImageUtils.loadTexture('./assets/mocap.png');
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        const material = new THREE.MeshLambertMaterial({map: texture, opacity: 0.4, transparent: true});
        material.side = THREE.DoubleSide;
        const geometry = new THREE.PlaneGeometry(2000, 2000, 0);
        geometry.translate(0, 0, -165);
        let floor = new THREE.Mesh(geometry, material);
        floor.receiveShadow = true;

        // line up so can read logo
        floor.rotateZ(Math.PI/2);

        this.worldSpace = new THREE.Group();
        this.worldSpace.add(floor);

        let axis = this.limbMakerService.makeAxis(0, 0, 0, 420, 1, 0.1);
        this.worldSpace.add(axis);

        // tilt slightly
        this.worldSpace.rotateY(0.2);


        this.threedService.add(this.worldSpace);

        this.limbMakerService.lookupKnownModels().subscribe(
            rawData => {
                this.knownModels = rawData;
                console.log(this.knownModels);
                let l = this.limbMakerService.makeLimbFromModel(this.knownModels[2]);
                this.worldSpace.add(l);
            }
        );

    }

}
