import { Component, OnInit, AfterContentChecked, ViewChild, ElementRef } from '@angular/core';
import {DialogComponent} from '../dialog/dialog.component';
import {BiotBrokerService} from '../biotbrokerservice/biot-broker.service';
import {NodeService} from '../nodeservice/node.service';
import {ObjectDrawingService} from '../objectdrawing/object-drawing.service';
import {PeriodicService} from '../periodic.service';
import {ThreedService} from '../threed/threed.service';
import {LimbService} from '../limbservice/limb.service';
import {Router} from '@angular/router';
import * as THREE from 'three';

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.css']
})
export class NodesComponent implements OnInit, AfterContentChecked {

    @ViewChild('debugHolder') debugHolder: ElementRef;

    private autoZoom: number = 0;
    private worldSpace: THREE.Object3D = undefined;
    private nodeData: any = {};
    private nodeModels: { [key: string]: any} = {};
    private knownModels: string[];
    //private knownRecordings: string[] = [];
    private chosenModel: string = "humerus.json"
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

    constructor(
        private biotBrokerService: BiotBrokerService,
        private threedService: ThreedService,
        private limbService: LimbService,
        private objectDrawingService: ObjectDrawingService,
        private nodeService: NodeService,
        private router: Router,
        private periodicService: PeriodicService) {
            this.periodicService.registerTask('show node data', this, this.updateLoop);
    }

    ngDoCheck() {
    }

    ngOnInit() {
        this.addActiveNodes();
    }

    ngAfterContentChecked() {
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
                if (this.nodeModels[addr] === undefined) {
//console.log('addresses', this.nodeAddresses);
                    let node = this.nodeService.getNode(addr);
                    this.nodeService.setPosition(addr, 0, i * 40, 0);
                    let colour = this.pickAColour(i);
                    let model = this.nodeModels[addr] = this.limbService.makeNodeModel('node-' + i,
                        addr,
                        colour,
                        true
                    );
                    this.nodeModels[addr] = model;
                    this.objectDrawingService.addNodeMonitoredObject(addr, model);
                    this.nodeAddresses.push(addr);
                }
            }
            this.adjustNodePositions();
            for (let i = 0; i < addresses.length; i++) {
                this.getRecordActive(addresses[i]);
            }
            this.addActiveNodes();
        }, 1000);
    }



    adjustNodePositions() {
        let addresses = this.nodeService.getNodeAddresses();
        let count = addresses.length;
        let offset = count - 1;
        let width = 25;
        let x = -(width * offset)/2
        for (let i = 0; i < count; i++) {
            let addr = addresses[i];
            this.nodeService.setPosition(addr, 0, x, 0);
            x += width;
        }
        // zoom out to show all nodes
        if ((this.autoZoom === 1) && count !== 0) {
            this.threedService.setZoom(8/count);
        }
    }

    alertNode(addr) {
        this.biotBrokerService.identify(addr).subscribe(
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
        if (this.nodeAddresses.indexOf(addr) !== -1) {
            //delete this.nodeAddresses[addr];
            this.nodeAddresses.splice(this.nodeAddresses.indexOf(addr), 1);
        }
        if (this.nodeData[addr] !== undefined) {
            this.nodeService.dropNode(addr);
            this.objectDrawingService.removeNodeMonitoredObject(addr);
            delete this.nodeData[addr];
            delete this.nodeModels[addr];
            this.debug("dropped node:" + addr);
        }
    }

    flashNodeLed(addr: string, mode: number) {
        this.debug("flashing node:" + addr);
        this.nodeService.setNodeProperty(addr, 'led', mode.toString());
    }

    getCommunicationStatus() {
        return this.biotBrokerService.getCommunicationStatus();
    }

    getRecordActive(addr: string) {
        if (this.recordingActive[addr] === undefined) {
            this.recordingActive[addr] = false;
        } else {
            this.biotBrokerService.getRecordStatus(addr)
                .subscribe(
                    rawData => {
                        this.recordingActive[addr] = rawData['recordingActive'];
                        this.recordingExists[addr] = rawData['recordingExists'];
                    },
                    error => { this.debug("error getting node status node:'" + addr + "' : " + error); },
                    
                );
        }
    }

    openNodeControl(addr: string) {
        this.alertNode(addr);
        let node = this.nodeService.getNode(addr);
        this.selectedNode = node;
        this.selectedNodeAddress = addr;
        this.selectedNodeCalMode = parseInt(node.configuration.auto);
        this.selectedNodeColour = node.configuration.colour;
        this.selectedNodeName = node.configuration.name;
        this.candidateNodeName = node.configuration.name;
    }

    nameNode(addr: string) {
        this.nodeRenameDialog.show({});
    }

    recordNode(addr: string) {
        this.nodeRecordDialog.show({});
    }

    rename(addr: string, name: string) {
        this.nodeService.setNodeProperty(addr, 'name', name);
    }

    showPosition(p: any): string {
        return p.x + ' ' + p.y + ' ' + p.z;
    }
    

    nodeCalibrationMode(addr: string): number {
        if (this.nodeData[addr] !== undefined) {
            return this.nodeData[addr].auto;
        }
        return 0;
    }

    displayRecordedData(addr: string) {
        this.router.navigate(['recordings', {'address': addr}]);
    }

    getStats() {
        return this.threedService.getStats();
    }

    getNodeRecording(addr: string) {
        this.biotBrokerService.getRecordedData(addr).subscribe(
            rawData => { this.displayRecordedData(addr); },
            error => { alert('error:' + error)},
        );
    }

    hasRecording(addr: string) {
        return this.recordingExists[addr];
    }

    startRecordingNode(addr: string) {
        this.biotBrokerService.recordData(addr, this.recordSeconds).subscribe(
            rawData => { this.recordingActive[addr] = true; },
            error => { alert('error:' + error)},
        );
    }


    setCalibrateMode(addr, mode) {
        this.biotBrokerService.putAutoCal(addr, mode).subscribe(
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
        this.biotBrokerService.resetService();
    }

    private updateLoop(self: NodesComponent) {
        self.nodeData = self.nodeService.getNodes();
    }

}
