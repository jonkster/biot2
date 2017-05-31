import { Component, OnInit, AfterContentChecked, ViewChild, ElementRef } from '@angular/core';
import {DialogComponent} from '../dialog/dialog.component';
import {BiotService} from '../biotservice/biot.service';
import {NodeholderService} from '../biotservice/nodeholder.service';
import {ThreedService} from '../threed/threed.service';
import {LimbmakerService} from '../3d-objects/limbmaker.service';
import * as THREE from 'three';

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.css']
})
export class NodesComponent implements OnInit, AfterContentChecked {

    private biotService: BiotService;
    private threedService: ThreedService;
    private limbMakerService: LimbmakerService;
    private worldSpace: THREE.Object3D = undefined;
    private nodeHolderService: NodeholderService = undefined;
    private nodeData: any = {};
    private nodeAddresses: string[] = [];
    private selectedNodeAddress: string = '';
    private selectedNodeCalMode = 0;
    private selectedNodeColour = '';

    @ViewChild('nodeDialog') nodeDialog: DialogComponent;

    constructor(biotService: BiotService, threedService: ThreedService, limbMakerService: LimbmakerService, nodeHolderService: NodeholderService) {
        this.biotService = biotService;
        this.threedService = threedService;
        this.limbMakerService = limbMakerService;
        this.nodeHolderService = nodeHolderService;
    }

    ngDoCheck() {
    }

    ngOnInit() {
        this.addDetectedNodes();
    }

    ngAfterContentChecked() {
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

        this.nodeHolderService.startUpdateLoop();

    }

    addDetectedNodes() {
        setTimeout(e => {
            var addresses = this.biotService.getDetectedAddresses();
            for (let i = 0; i < addresses.length; i++) {
                let addr = addresses[i];
                if (! this.nodeHolderService.nodeKnown(addr)) {
                    var q = { 'w': 0, 'x': 0, 'y': 1, 'z': 0 };
                    this.addNode(addr, 'detected-biot-node', 'biot-'+addr, 0, 0, 0, q, this.pickAColour(i));
                }
            }
            this.adjustNodePositions();
            this.addDetectedNodes();
            this.getAllNodeData();
        }, 1000);
    }


    addNode(addr: string, type: string, name: string, x: number, y: number, z: number, q: any, colour: string) {
        if (this.nodeHolderService.addNode(addr, type, name, x, y, z, q, colour)) {
            let node = this.makeNode(addr, type, name, x, y, z, q, colour);
            this.nodeHolderService.add3DModel(addr, node);
            this.worldSpace.add(node);
        }
        else {
            alert(this.nodeHolderService.getError());
        }
    }

    addTestNode() {
        var colour = this.pickAColour(0);
        var addr = "aaaa-1234-5678-aaaa";
        var name = "TEST NODE";
        var type = "DUMMY-IMU";
        var q = { 'w': 0, 'x': 0.887, 'y': 0, 'z': -0.887 };
        var time = 0;

        var i = 0;
        while (this.nodeHolderService.nodeKnown(addr)) {
            addr = '-' + i++;
            colour = this.pickAColour(i);
        }
        this.addNode(addr, type, name, 0, 0, 0, q, colour);
    }

    adjustNodePositions() {
        let addresses = this.nodeHolderService.getNodeAddresses();
        let count = addresses.length;
        let offset = count - 1;
        let width = 250;
        let x = -(width * offset)/2
        for (let i = 0; i < count; i++) {
            let addr = addresses[i];
            let node = this.nodeHolderService.getNode(addr);
            this.nodeHolderService.setPosition(node, 0, x, 0);
            x += width;
        }
        // zoom out to show all nodes
        if (count !== 0) {
            this.threedService.setZoom(4/count);
        }
    }

    alertNode(addr) {
        this.biotService.identify(addr).subscribe(
            rawData => { console.log('ok', rawData)},
            error => { console.log('error', error)},
        );
    }

    confirm1() {
        alert('I don\'t know how :(');
    }

    confirm2() {
        alert('I don\'t know how :(');
    }

    getCommunicationStatus() {
        return this.biotService.getCommunicationStatus();
    }



    makeNode(name: string, type: string, displayName: string, x: number, y: number, z: number, quat: any, colour: string) {
        let node = this.limbMakerService.makeNodeModel(name, type, displayName, x, y, z, colour);
        var q3js = new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w);
        node.setRotationFromQuaternion(q3js);
        return node;
    }

    openNodeDialog(addr: string) {
        let node = this.nodeHolderService.getNode(addr);
        this.selectedNodeAddress = addr;
        this.selectedNodeCalMode = this.nodeCalibrationMode(addr);
        this.selectedNodeColour = node.colour;
        this.nodeDialog.show({ address: addr});
    }

    nodeCalibrationMode(addr: string): number {
        if (this.nodeData[addr] !== undefined) {
            return this.nodeData[addr].auto;
        }
        return 0;
    }

    setCalibrateMode(addr, mode) {
        this.biotService.putAutoCal(addr, mode).subscribe(
            rawData => { console.log('ok', rawData)},
            error => { console.log('error', error)},
        );
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


    resetService() {
        this.biotService.resetService();
    }

    getAllNodeData() {
        this.nodeAddresses = this.nodeHolderService.getNodeAddresses();
        this.nodeData = this.nodeHolderService.getNodes();
    }

}
