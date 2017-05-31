import { Component, AfterViewInit } from '@angular/core';
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
        status: '',
        links: []
    };
    private nodeStatus = {
        count: 0,
        addresses: [],
        nodeData: {}
    }


    constructor(biotService: BiotService, threedService: ThreedService) {
        this.biotService = biotService;
        this.threedService = threedService;
    }

    ngAfterViewInit() {
        console.log('fire');
        this.getRouterStatus();
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
            }
        );
    }

    getRouterStatus() {
        const status =  this.biotService.getRouterStatus();
        status.subscribe(
            rawData => {
                this.routerStatus = rawData;
                this.routerStatus.status = 'Connected';
            },
            error => {
                this.routerStatus.status = 'ERROR';
            }
        );
        let siht = this;
        this.getBiotAddresses();
        setTimeout(function(){ siht.getRouterStatus() }, 3000);
    }

}
