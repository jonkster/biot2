import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import {BiotService} from '../biotservice/biot.service';
import {ThreedService} from '../threed/threed.service';
import * as THREE from 'three';

@Component({
    selector: 'app-system',
    templateUrl: './system.component.html',
    styleUrls: ['./system.component.css']
})
export class SystemComponent implements AfterViewInit {

    private biotService: BiotService;
    private threedService: ThreedService;
    private routerStatus = {
        title: '',
        time: '',
        description: '',
        version: '',
        'UDP-IP-status': '',
        'Edge-Router-status': '',
        'DODAG-status': '',
        status: '',
        links: []
    };
    private nodeStatus = {
        count: 0,
        addresses: [],
        nodeData: {}
    }

    private systemStatus = {
        tcpip: 'unknown',
        biotbroker: 'unknown',
        udpip: 'unknown',
        edgerouter: 'unknown',
        biots: 'unknown'
    }
    @ViewChild('sysCanvas') canvasRef: ElementRef;
    image = 'assets/architecture-1.png';
    hotspots = {
	'biots': [50, 70, 470, 320 ],
	'edgerouter': [235, 380, 200, 60 ],
	'udpip': [380, 480, 180, 100 ],
	'biotbroker': [380, 600, 200, 100 ],
	'tcpip': [210, 600, 150, 100 ],
    };
    context;
    flashCount = 0;


    constructor(biotService: BiotService, threedService: ThreedService) {
        this.biotService = biotService;
        this.threedService = threedService;
    }

    ngAfterViewInit() {
	console.log('fire');
	this.getRouterStatus();
	this.setFaultStatus();
    	this.initCanvas();
	this.drawImage();
    }

    drawHotspot(name: string, status: string) {
    	let drawFault = '';
	if (status === 'OK') {
	    this.context.fillStyle = "rgba(0, 255, 0, 0.1)";
	} else if (status === 'unknown') {
	    this.context.fillStyle = "rgba(100, 100, 100, 0.8)";
	    if (this.flashCount % 2 === 0) {
	    	drawFault = '?';
	    }
	} else if (status === 'fault') {
	    if (this.flashCount % 2 === 0) {
		this.context.fillStyle = "rgba(255, 0, 0, 0.2)";
	    } else {
	    	drawFault = 'fault';
		this.context.fillStyle = "rgba(255, 0, 0, 0.8)";
	    }
	}
	let x = this.hotspots[name][0];
	let y = this.hotspots[name][1];
	let w = this.hotspots[name][2];
	let h = this.hotspots[name][3];
	this.context.fillRect(x, y, w, h);
	if (drawFault != '') {
	    this.context.fillStyle = "rgba(255, 255, 255, 1.0)";
	    this.context.fillText(drawFault, x + w/2, y + h/2);
	}
    }

    drawSpots() {
	if (this.context !== undefined) {
	    let spots = Object.keys(this.hotspots);
	    for (let i = 0; i < spots.length; i++) {
		let spot = spots[i];
		this.drawHotspot(spot, this.systemStatus[spot]);
	    }
	}
	this.flashCount++;
    }

    initCanvas() {
	let canvas = this.canvasRef.nativeElement;
	this.context = canvas.getContext('2d');
	canvas.height = 750;
	canvas.width = 570;
    }

    drawImage() {
	let canvas = this.canvasRef.nativeElement;
	let source = new Image();
	source.onload = () => {
	    this.context.clearRect(0, 0, canvas.width, canvas.height);
	    this.context.drawImage(source, 0, 0, canvas.width, canvas.height );
	    this.context.font = "30px impact";
	    this.context.textAlign = 'center';
	    this.image = canvas.toDataURL();  
	    this.context.fillStyle = "rgba(0, 255, 0, 0.1)";
	    this.drawSpots();
	}
	// this will trigger the above onload
	source.src = this.image;
	setTimeout(e => {
		this.drawImage();
	}, 1000);
    }

    getAllBiotData() {
        for (let i = 0; i < this.nodeStatus.count; i++) {
            let addr = this.nodeStatus.addresses[i];
            const status =  this.biotService.getStatus(addr);
            status.subscribe(
                rawData => {
                    this.nodeStatus.nodeData[addr] = rawData.status + ':' + rawData.ts;
                },
                error => {
                    this.nodeStatus.nodeData[addr] = 'error';
                }
            );
        }
    }


    getBiotAddresses() {
        const status =  this.biotService.getAddresses();
        status.subscribe(
            rawData => {
                this.nodeStatus.addresses = rawData;
                this.nodeStatus.count = rawData.length;
                this.getAllBiotData();
            },
            error => {
                this.routerStatus.status = 'ERROR';
                this.systemStatus.biotbroker = 'fault';
            }
        );
    }

    getRouterStatus() {
        const status =  this.biotService.getRouterStatus();
        status.subscribe(
            rawData => {
                this.routerStatus = rawData;
                this.routerStatus.status = 'Connected';
                this.systemStatus.biotbroker = 'OK';
                this.systemStatus.tcpip = 'OK';
                this.systemStatus.udpip = this.routerStatus['UDP-IP-status'];
                this.systemStatus.edgerouter = this.routerStatus['Edge-Router-status'];
                this.systemStatus.biots = this.routerStatus['DODAG-status'];
            },
            error => {
                this.routerStatus.status = 'ERROR';
                this.systemStatus.biotbroker = 'fault';
            }
        );
        let siht = this;
        this.getBiotAddresses();
        setTimeout(function(){ siht.getRouterStatus() }, 3000);
    }

    getSystemStatus() {
        return this.systemStatus;
    }

    setFaultStatus() {
        if (this.systemStatus.tcpip === 'fault') {
            this.systemStatus.biotbroker = 'unknown';
            this.systemStatus.udpip = 'unknown';
            this.systemStatus.edgerouter = 'unknown';
            this.systemStatus.biots = 'unknown';
        } 
        if (this.systemStatus.biotbroker === 'fault') {
            this.systemStatus.udpip = 'unknown';
            this.systemStatus.udpip = 'unknown';
            this.systemStatus.edgerouter = 'unknown';
            this.systemStatus.biots = 'unknown';
        } 
        if (this.systemStatus.udpip === 'fault') {
            this.systemStatus.edgerouter = 'unknown';
            this.systemStatus.biots = 'unknown';
        } 
        if (this.systemStatus.edgerouter === 'fault') {
            this.systemStatus.biots = 'unknown';
        } 
        if (this.systemStatus.tcpip === 'OK') {
            if (this.systemStatus.biotbroker === 'unknown') {
                this.systemStatus.biotbroker = 'OK';
                this.systemStatus.udpip = 'OK';
                this.systemStatus.edgerouter = 'OK';
                this.systemStatus.biots = 'OK';
            }
        } 
        if (this.systemStatus.biotbroker === 'OK') {
            if (this.systemStatus.udpip === 'unknown') {
                this.systemStatus.udpip = 'OK';
                this.systemStatus.edgerouter = 'OK';
                this.systemStatus.biots = 'OK';
            }
        } 
        if (this.systemStatus.udpip === 'OK') {
            if (this.systemStatus.edgerouter === 'unknown') {
                this.systemStatus.edgerouter = 'OK';
                this.systemStatus.biots = 'OK';
            }
        }
        if (this.systemStatus.edgerouter === 'OK') {
            if (this.systemStatus.biots === 'unknown') {
                this.systemStatus.biots = 'OK';
            }
        }
    }

    getClass(state: string) {
        if (state === 'OK') {
            return 'good';
        } else if (state === 'unknown') {
            return 'unknown';
        }
        return 'bad';
    }

    toggleStatus(property: string) {
        let state = this.systemStatus[property];
        if (state === 'OK') {
            state = 'fault';
        } else if (state === 'fault') {
            state = 'OK';
        } else if (state === 'unknown') {
            state = 'OK';
        }
        this.systemStatus[property] = state;
        this.setFaultStatus();
    }

}
