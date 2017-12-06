import { Component, OnInit, AfterContentChecked, ViewChild, ElementRef } from '@angular/core';
import {DialogComponent} from '../dialog/dialog.component';
//import {BiotService} from '../biotservice/biot.service';
import {BiotBrokerService} from '../biotbrokerservice/biot-broker.service';
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
    @ViewChild('nodeLimbDialog') nodeLimbDialog: DialogComponent;
    @ViewChild('saveAssemblyDialog') saveAssemblyDialog: DialogComponent;
    @ViewChild('loadAssemblyDialog') loadAssemblyDialog: DialogComponent;

    private currentAssemblyName: string = '';
    private debugHistory: string[] = [];
    private knownAssemblies: string[] = [];
    private knownLimbs: { [key: string]: any} = {};
    private knownNodeAddresses: string[] = [];
    private knownModels: string[] = [];
    private envelopesVisible: boolean = true;
    private figureVisible: boolean = false;
    private figure: any = undefined;
    private selectedLimbAddress: string = '';
    private selectedLimb: any = {
        address: '',
        name: '',
        parentLimbName: '',
        limbModelName: '',
        limbLength: '',
        limbRotationX: 0,
        limbRotationY: 0,
        limbRotationZ: 0,
        potentialParentLimbs: []
    };
    private worldSpace: THREE.Object3D = undefined;

    constructor(//private biotService: BiotService,
        private threedService: ThreedService,
        private limbMakerService: LimbmakerService,
        private nodeHolderService: NodeholderService,
        private biotBrokerService: BiotBrokerService,
        private router: Router,
        private periodicService: PeriodicService) {
    }

    ngOnInit() {
        this.addActiveNodes();
        this.limbMakerService.lookupKnownModels().subscribe(
            rawData => {
                this.knownModels = rawData;
            }
        );
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
    }

    
  addActiveNodes() {
      setTimeout(e => {
          //var addresses = this.biotService.getDetectedAddresses();
          var addresses = this.biotBrokerService.getDetectedAddresses();
          for (let i = 0; i < addresses.length; i++) {
              let addr = addresses[i];
              if (this.knownLimbs[addr] === undefined) {
                  this.knownLimbs[addr] = this.limbMakerService.makeLimb(null,
                      addr,
                      'limb-' + i,
                      0, i * 40, 0,
                      this.pickAColour(i),
                      30);
                  this.threedService.add(this.knownLimbs[addr]);
                  this.nodeHolderService.registerLimb(this.knownLimbs[addr]);
              }
          }
          if (addresses.length > 0) {
              this.getKnownAssemblies();
          }
          this.knownNodeAddresses = Object.keys(this.knownLimbs);
          this.addActiveNodes();
      }, 5000);
  }

  adjustLimbLength(addr, value) {
      let limb = this.knownLimbs[addr];
      limb.userData.limbLength = value;
      this.limbMakerService.setLimbSize(limb, value);
      if (this.selectedLimbAddress === addr) {
        this.selectedLimb.limbLength = value;
      }
      this.knownLimbs[addr] = limb;
  }

  adjustLimbRotationX(addr, value) {
      let limb = this.knownLimbs[addr];
      limb.userData['limbRotationX'] = Math.PI * value / 180;
      this.selectedLimb.limbRotationX = limb.userData['limbRotationX'];
  }

  adjustLimbRotationY(addr, value) {
      let limb = this.knownLimbs[addr];
      limb.userData['limbRotationY'] = Math.PI * value / 180;
      this.selectedLimb.limbRotationY = limb.userData['limbRotationY'];
  }

  adjustLimbRotationZ(addr, value) {
      let limb = this.knownLimbs[addr];
      limb.userData['limbRotationZ'] = Math.PI * value / 180;
      this.selectedLimb.limbRotationZ = limb.userData['limbRotationZ'];
  }

  debug(txt: string) {
      if (this.debugHistory.length > 100) {
          this.debugHistory.shift();
          this.debugHistory[0] = 'earlier entries deleted...';
      }
      this.debugHistory.push(txt);
  }

  attachLimbToParent(limb, parentLimbName) {
      let parentLimb = this.getLimbByName(parentLimbName);
      if (parentLimb !== null) {
        let newLimb = this.limbMakerService.attachLimbToParent(limb, parentLimb);
      }
  }

  getLimbByName(name: string): any {
      for (let i = 0; i < this.knownNodeAddresses.length; i++) {
          let addr = this.knownNodeAddresses[i];
          let limb = this.knownLimbs[addr];
          if (limb.userData.displayName === name) {
              return limb;
          }
      }
      return null;
  }

  getAssembly(): string {
      let assembly = {};
      let addresses = Object.keys(this.knownLimbs);
      for (let i = 0; i < addresses.length; i++) {
          let address = addresses[i];
          let limb = this.knownLimbs[address];
          assembly[address] = limb.userData;
      }
      return JSON.stringify(assembly);
  }

  getKnownAssemblies() {
      this.biotBrokerService.getCachedAssemblies().subscribe(
      //this.biotService.getCachedAssemblies().subscribe(
          rawData => {
              this.debug("got assemblies:" + rawData);
              console.log('d', rawData);
              this.knownAssemblies = rawData;
          },
          error => { this.debug("error when getting assembly names:" + error); }
      );
  }

  getPotentialParents(addr: string): string[] {
      let parentNames: string[] = [];
      for (let i = 0; i < this.knownNodeAddresses.length; i++) {
          let paddr = this.knownNodeAddresses[i];
          if (paddr !== addr) {
              let pp = this.knownLimbs[paddr];
              parentNames.push(pp.userData.displayName);
          }
      }
      return parentNames;
  }

  loadAssembly(name: string) {
      if (name === '') {
          this.debug("Cannot Load! - blank name!");
          return;
      }
      this.biotBrokerService.getCachedAssembly(name).subscribe(
      //this.biotService.getCachedAssembly(name).subscribe(
          rawData => { this.debug("got assembly data:" + rawData);
              let data = JSON.parse(rawData);
              let addresses = Object.keys(data);
              for (let i = 0; i < addresses.length; i++) {
                  let address = addresses[i];
                  let limbData = data[address];
                  this.selectedLimb.name = limbData.displayName;
                  this.selectedLimb.colour = limbData.colour;
                  this.selectedLimb.limbLength = limbData.limbLength;
                  this.selectedLimb.limbModelName = limbData.limbModelName;
                  this.selectedLimb.parentLimbName = limbData.parentLimbName;
                  this.selectedLimb.limbRotationX = limbData.limbRotationX;
                  this.selectedLimb.limbRotationY = limbData.limbRotationY;
                  this.selectedLimb.limbRotationZ = limbData.limbRotationZ;
                  this.updateLimb(address);
              }
          },
          error => { this.debug("error when getting assembly:" + error); }
      );
  }

  openLimbControl(addr: string) {
      this.selectedLimbAddress = addr;
      let limb = this.knownLimbs[addr];
      if (limb !== undefined) {
          let potentialParentLimbs: string[] = this.getPotentialParents(addr);
          this.selectedLimb = {
              address: addr,
              colour: limb.userData.colour, 
              name: this.knownLimbs[addr].userData.displayName,
              parentLimbName: limb.userData.parentLimbName,
              limbModelName: limb.userData.limbModelName, 
              limbLength: limb.userData.limbLength,
              potentialParentLimbs: potentialParentLimbs,
              limbRotationX: limb.userData.limbRotationX,
              limbRotationY: limb.userData.limbRotationY,
              limbRotationZ: limb.userData.limbRotationZ
          }
          this.nodeLimbDialog.show({});
      }
  }


  pickAColour(idx: number) {
      var colours = [
          '#FF0000',
          '#4385FF',
          '#AA6E28',
          '#808000',
          '#FFFAC8',
          '#BEFF00',
          '#FFD8B1',
          '#00BE00',
          '#FFEA00',
          '#AAFFC3',
          '#008080',
          '#64FFFF',
          '#FFC9DE',
          '#000080',
          '#820096',
          '#E6BEFF',
          '#FF00FF',
          '#800000',
          '#FF9900',
          '#808080',
          '#330000',
          '#438533',
          '#336E28',
          '#303000',
          '#533500',
          '#448822',
          '#404040'];
      return colours[idx % colours.length];
  }

  saveAssembly(name: string)  {
      if (name === '') {
          this.debug("Not Saved! - blank name!");
          return;
      }
      let siht = this;
      let assembly = this.getAssembly();
      this.biotBrokerService.postAssemblyToCache(name, assembly).subscribe(
      //this.biotService.postAssemblyToCache(name, assembly).subscribe(
          rawData => { this.debug("saved assembly as: " + name); },
          error => { this.debug("error when saving assembly:" + name + " : " + error); }
      );
  }

  toggleEnvelopes() {
      if (this.envelopesVisible) {
          this.envelopesVisible = false;
          this.nodeHolderService.setEnvelopeVisibility(false);
      } else {
          this.envelopesVisible = true;
          this.nodeHolderService.setEnvelopeVisibility(true);
      }
  }


  toggleFigure() {
      if (this.figureVisible) {
          this.figureVisible = false;
          this.threedService.remove(this.figure);
      } else {
          if (this.figure === undefined) {
              this.figure = this.limbMakerService.makeLimbFromModel('skeleton.json', 10); 
              //this.figure = this.limbMakerService.makeLimbFromModel('skeleton-whole-2.json', 10); 
          }
          this.figureVisible = true;
          this.threedService.add(this.figure);
      }
  }

  updateLimb(addr: string) {
      let limb = this.knownLimbs[addr];
      if (limb !== undefined) {
          limb.userData.displayName = this.selectedLimb.name;
          limb.userData.colour = this.selectedLimb.colour;
          limb.userData.limbLength = this.selectedLimb.limbLength;
          limb.userData.parentLimbName = this.selectedLimb.parentLimbName;
          limb.userData.limbModelName = this.selectedLimb.limbModelName;
          limb.userData.limbRotationX = this.selectedLimb.limbRotationX;
          limb.userData.limbRotationY = this.selectedLimb.limbRotationY;
          limb.userData.limbRotationZ = this.selectedLimb.limbRotationZ;
          console.log(limb.userData);
          if (this.selectedLimb.limbModelName !== "") {
              this.limbMakerService.attachModelToLimb(limb, this.selectedLimb.limbModelName);
          }
          if ((this.selectedLimb.parentLimbName !== "") && (this.selectedLimb.parentLimbName !== "none")) {
              this.attachLimbToParent(limb, this.selectedLimb.parentLimbName);
          }
          this.knownLimbs[addr] = limb;
      }
  }

}
