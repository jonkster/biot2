import { Component, OnInit, AfterContentChecked, ViewChild, ElementRef } from '@angular/core';
import {DialogComponent} from '../dialog/dialog.component';
import {BiotService} from '../biotservice/biot.service';
import {NodeholderService} from '../biotservice/nodeholder.service';
import {NodeService} from '../nodeservice/node.service';
import {ObjectDrawingService} from '../objectdrawing/object-drawing.service';
import {PeriodicService} from '../periodic.service';
import {ThreedService} from '../threed/threed.service';
import {LimbService} from '../limbservice/limb.service';
import {LimbmakerService} from '../3d-objects/limbmaker.service';
import {LimbAssemblyService} from '../limb-assembly/limbAssembly.service';
import {Router} from '@angular/router';
import * as THREE from 'three';

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.css']
})
export class NodesComponent implements OnInit, AfterContentChecked {

    @ViewChild('debugHolder') debugHolder: ElementRef;

    private autoZoom: number = 1;
    private worldSpace: THREE.Object3D = undefined;
    private nodeData: any = {};
    private knownNodes: { [key: string]: any} = {};
    private knownModels: string[];
    private chosenModel: string = "humerus.json"
    private nodeView: string = "limb";
    private nodeAddresses: string[] = [];
    private recordingActive: any = {};
    private recordingExists: any = {};
    private selectedLimb: any = {
            name: '',
            address: '',
            limbModel: '',
            proposedLimbModel: '',
            potentialLimbs: [],
            limbLength: 30,
            proposedLimbLength: '',
            parentLimbName: '',
            position: {
                      x: 0,
                      y: 0,
                      z: 0,
                      q: new THREE.Quaternion(0, 0, 0, 1)
                  }
    };
    private selectedNode: any = undefined;
    private selectedNodeAddress: string = '';
    private selectedNodeName: string = '';
    private candidateNodeName: string = '';
    private recordSeconds = 5;
    private selectedNodeCalMode = 0;
    private selectedNodeColour = '';
    private debugHistory: string[] = [];

    @ViewChild('nodeRenameDialog') nodeRenameDialog: DialogComponent;
    @ViewChild('nodeRecordDialog') nodeRecordDialog: DialogComponent;
    @ViewChild('nodeLimbDialog') nodeLimbDialog: DialogComponent;

    constructor(
        private biotService: BiotService,
        private threedService: ThreedService,
        private limbService: LimbService,
        private limbMakerService: LimbmakerService,
        private limbAssemblyService: LimbAssemblyService,
        private objectDrawingService: ObjectDrawingService,
        private nodeHolderService: NodeholderService,
        private nodeService: NodeService,
        private router: Router,
        private periodicService: PeriodicService) {
        //this.dropNodes();
        this.nodeHolderService.lostNodeSubscription().subscribe(
            nodeAddr => {
                //this.dropNode(nodeAddr);
            }
        );
    }

    ngDoCheck() {
    }

    ngOnInit() {
        this.addActiveNodes();
    }

    ngAfterContentChecked() {
    }

    makeMaterialFromFile(name: string) {
        let material = new THREE.MeshLambertMaterial({opacity: 0.4, transparent: true});
	let loader = new THREE.TextureLoader().load(
	    name,
	    function (texture) {
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 4, 4 );
		material.map = texture;
        	material.side = THREE.DoubleSide;
	    },
	    function(xhr) { },
	    function(xhr) { console.log('error loading texture', xhr); }
	);
	return material;
    }

    ngAfterViewInit() {
        this.objectDrawingService.setStandardBackground();
        this.objectDrawingService.startUpdating();
    }

    addActiveNodes() {
        setTimeout(e => {
            let addresses = this.nodeService.getNodeAddresses();
            for (let i = 0; i < addresses.length; i++) {
                let addr = addresses[i];
              if (this.knownNodes[addr] === undefined) {
                  let node = this.nodeService.getNode(addr);
                  this.nodeService.setPosition(addr, 0, i * 40, 0);

                  this.knownNodes[addr] = this.limbService.makeNodeModel('node-' + i,
                      addr,
                      this.pickAColour(i),
                      true
                      );
                  this.objectDrawingService.addNodeMonitoredObject(addr, this.knownNodes[addr]);

                }
            }
            this.adjustNodePositions();
            this.getAllNodeData();
            this.addActiveNodes();
        }, 1000);
    }



    addTestNode() {
    }

    adjustLimbLength(addr: string, len: number) {
        this.selectedLimb['proposedLimbLength'] = len;
        let node = this.nodeHolderService.getManagedNode(addr);
        this.limbAssemblyService.sizeLimb('limbModel-' + this.selectedLimb.name, len, node);
    }

    adjustNodePositions() {
        let addresses = this.nodeHolderService.getNodeAddresses();
        let count = addresses.length;
        let offset = count - 1;
        let width = 25;
        let x = -(width * offset)/2
        for (let i = 0; i < count; i++) {
            let addr = addresses[i];
            let node = this.nodeHolderService.getManagedNode(addr);
            this.nodeHolderService.setPosition(node, 0, x, 0);
            x += width;
        }
        // zoom out to show all nodes
        if ((this.autoZoom === 1) && count !== 0) {
            this.threedService.setZoom(4/count);
        }
    }

    alertNode(addr) {
        this.biotService.identify(addr).subscribe(
            rawData => { this.flashNodeLed(addr, 3); },
            error => { this.debug("error when alerting node:" + addr + " : " + error); },
        );
    }

    debug(txt: string) {
        if (this.debugHistory.length > 100) {
            this.debugHistory.shift();
            this.debugHistory[0] = 'earlier entries deleted...';
        }
        this.debugHistory.push(txt);
    }

    dropNodes() {
            this.debug("drop all nodes");
            let addresses = this.nodeService.getNodeAddresses();
            for (let i = 0; i < addresses.length; i++) {
                this.dropNode(addresses[i]);
            }
    }

    dropNode(addr) {
        if (this.nodeAddresses[addr] !== undefined) {
            delete this.nodeAddresses[addr];
            this.nodeAddresses.splice(this.nodeAddresses.indexOf(addr), 1);
        }
        if (this.nodeData[addr] !== undefined) {
            delete this.nodeData[addr];
            this.nodeHolderService.dropNode(addr);
            this.threedService.dropNode(addr);
            this.biotService.dropNode(addr);
            this.debug("dropped node:" + addr);
        }
    }

    flashNodeLed(addr: string, mode: number) {
        this.debug("flashing node:" + addr);
        this.nodeHolderService.setLedMode(addr, mode);
    }

    getCommunicationStatus() {
        return this.biotService.getCommunicationStatus();
    }

    getRecordActive(addr: string) {
        if (this.recordingActive[addr] === undefined) {
            this.recordingActive[addr] = false;
        } else {
            this.biotService.getRecordStatus(addr)
                .subscribe(
                    rawData => {
                        this.recordingActive[addr] = rawData.recordingActive;
                        this.recordingExists[addr] = rawData.recordingExists;
                    },
                    error => { this.debug("error getting node status node:'" + addr + "' : " + error); },
                    
                );
        }
    }



    makeNode(name: string, type: string, displayName: string, x: number, y: number, z: number, quat: any, colour: string) {
        let node = this.limbMakerService.makeNodeModel(name, type, displayName, x, y, z, colour);
        var q3js = new THREE.Quaternion(quat.x, quat.y, quat.z, quat.w);
        node.setRotationFromQuaternion(q3js);
        return node;
    }

    openLimbControl(addr: string) {
        this.selectedLimb.potentialLimbs = this.limbAssemblyService.getLimbNames();
        this.autoZoom = 0;
        this.alertNode(addr);
        this.selectedNodeAddress = addr;
        this.selectedLimb = this.nodeData[addr].limb;
        this.selectedLimb['proposedLimbLength'] = this.selectedLimb.limbLength;
        this.selectedLimb['proposedLimbModel'] = this.selectedLimb.limbModel;
        this.limbMakerService.lookupKnownModels().subscribe(
            rawData => {
                this.knownModels = rawData;
            }
        );
        this.nodeLimbDialog.show({});
    }

    openNodeControl(addr: string) {
        this.alertNode(addr);
        let node = this.nodeHolderService.getManagedNode(addr);
        this.selectedNode = node;
        this.selectedNodeAddress = addr;
        this.selectedNodeCalMode = this.nodeCalibrationMode(addr);
        this.selectedNodeColour = node.colour;
        this.selectedNodeName = node.name;
        this.candidateNodeName = node.name;
    }

    nameNode(addr: string) {
        this.nodeRenameDialog.show({});
    }

    recordNode(addr: string) {
        this.nodeRecordDialog.show({});
    }

    rename(addr: string, name: string) {
        this.nodeHolderService.rename(addr, name);
    }

    setNodeView(view: string) {
        this.nodeView = view;
        switch (view) {
            case "raw": this.autoZoom = 1;
                break;
            case "limb": this.autoZoom = 0;
                break;
            default: alert('unrecognised view: ' + view);
                break;
        }
    }

    showPosition(p: any): string {
        return p.x + ' ' + p.y + ' ' + p.z;
    }
    

    updateLimb(addr: string) {
        let node = this.nodeHolderService.getManagedNode(addr);
        let limbModel = node.model.getObjectByName("limbModel-" + addr);
        let proposedLength = this.selectedLimb.proposedLimbLength;
        let proposedModel = this.selectedLimb.proposedLimbModel;

        let makeNewLimb = true;
        if (limbModel !== undefined) {
            if (proposedModel !== this.selectedLimb.limbModel) {
                node.model.remove(limbModel);
            } else {
                this.limbAssemblyService.sizeLimb('limbModel-' + proposedModel, proposedLength, node);
                makeNewLimb = false;
            }
        }
        if (makeNewLimb) {
            if (proposedModel.match(/.json/)) {
                let l = this.limbMakerService.makeLimbFromModel(proposedModel, 1);
                l.name = "limbModel-" + addr;
                node.model.add(l);
            }
        }
        this.selectedLimb.limbLength = proposedLength;
        this.selectedLimb.limbModel = proposedModel;
        this.nodeData[addr].limb = this.selectedLimb;
        if (this.selectedLimb.parentLimbName !== "none") {
            this.limbAssemblyService.addLimbAsChildOf(node, this.selectedLimb.parentLimbName);
        }
    }

    nodeCalibrationMode(addr: string): number {
        if (this.nodeData[addr] !== undefined) {
            return this.nodeData[addr].auto;
        }
        return 0;
    }

    displayRecordedData(jsonData: string) {
        this.router.navigate(['recordings', {'title': this.selectedNodeName, 'data': jsonData}]);
    }

    getStats() {
        return this.threedService.getStats();
    }

    getNodeRecording(addr: string) {
        this.biotService.getRecordedData(addr).subscribe(
            rawData => { this.displayRecordedData(JSON.stringify(rawData))},
            error => { alert('error:' + error)},
        );
    }

    hasRecording(addr: string) {
        return this.recordingExists[addr];
    }

    replayNodeRecording(addr) {
        alert("sorry cannot do that yet");
    }

    startRecordingNode(addr: string) {
        this.biotService.recordData(addr, this.recordSeconds).subscribe(
            rawData => { this.recordingActive[addr] = true; },
            error => { alert('error:' + error)},
        );
    }


    setCalibrateMode(addr, mode) {
        this.biotService.putAutoCal(addr, mode).subscribe(
            rawData => { this.debug("calibration set to mode: " + mode + " for: " + addr) },
            error => { this.debug("error when setting calibration node:" + addr + " to: " + mode + " : " + error); }
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
    //    this.biotService.resetService();
    }

    getAllNodeData() {
        this.nodeAddresses = this.nodeHolderService.getNodeAddresses();
        this.nodeData = this.nodeHolderService.getNodes();
    }

}
