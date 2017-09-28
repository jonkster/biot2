import { Injectable } from '@angular/core';
import { HttpModule, Http, Response, URLSearchParams } from '@angular/http';
import {Observable} from 'rxjs/Observable';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';

declare const require: (moduleId: string) => any;

@Injectable()
export class BiotService {

    private statusOK:boolean = false;
    private resetRunning: boolean = false;
    private detectedAddresses: any = {};
    private biotServerHost: string = '127.0.0.1';
    private biotServerPort: string = '8889';

    constructor(private http: Http) {
        this.getBiotRouter();
    }

    private extractWSData (res: Response) {
        const body = res.json();
        return body || {};
    }

    addDummyNode(addr) {
        const path = 'biotz/addnode/' + addr;
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path;
        return this.http.put(url, '')
            .map((response) => response.json());
    }

    detectNodes() {
        let biotData = this.getData();
        biotData.subscribe(
            rawData => {
                let addresses = Object.keys(rawData);
                for (let i = 0; i < addresses.length; i++) {
                    let address = addresses[i];
                    let data = rawData[address];
                    this.detectedAddresses[address] = data;
                }
            },
            error => {
                console.log('error getting data:', error);
            });
    }

    dropNode(addr: string) {
        if (this.detectedAddresses[addr] !== undefined) {
            delete this.detectedAddresses[addr];
        }
        const path = 'biotz/addresses/' + addr;
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path;
        return this.http.delete(url, '')
            .map((response) => response.json());
    }

    dropDummyNodes() {
        const path = 'biotz/dropnodes';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path;
        return this.http.put(url, '')
            .map((response) => response.json());
    }

    getBiotRouter()
    {
        var localHost = location.hostname;
        var net = localHost.replace(/\.[0-9]+$/, '.');
        let i = 0;
        let p = setInterval(() =>{
            if (i > 255) {
                console.log('NONE FOUND: SET BROKER TO:', this.biotServerHost);
                clearInterval(p);
            }
            let ip = net + i++;
            const url = "http://" + ip + ":" + this.biotServerPort + "/";
            this.http.get(url)
                .timeout(40)
                .subscribe(
                    data => {
                        this.statusOK = true;
                        console.log('GOT BROKER', ip);
                        this.biotServerHost = ip;
                        clearInterval(p);
                    },
                    error => {
                        console.log('no broker at', ip);
                    }
                );
        }, 10);
    }


    getDetectedAddresses(): string[] {
        return Object.keys(this.detectedAddresses);
    }

    getPosition(addr) {
        return this.detectedAddresses[addr];
    }

    getAddresses() {
        const result = this.makeBrokerRequest('biotz/addresses');
        return result;
    }

    getBrokerIP() {
        return this.biotServerHost;
    }

    getBrokerPort() {
        return this.biotServerPort;
    }

    getCalibration(addr) {
        const result = this.makeBrokerRequest('biotz/addresses/' + addr + '/calibration');
        return result;
    }

    getANodesData(addr) {
        const path = 'biotz/addresses/' + addr;
        const result = this.makeBrokerRequest(path);
        return result;
    }

    getAllNodes() {
        const path = 'biotz/all/nodes';
        const result = this.makeBrokerRequest(path);
        return result;
    }

    getCachedAssemblies() {
        const path = 'data/assembly';
        const result = this.makeBrokerRequest(path);
        return result;
    }

    getCachedAssembly(name) {
        const path = 'data/assembly/' + name;
        const result = this.makeBrokerRequest(path);
        return result;
    }

    getCachedCalibrationAddresses() {
        const result = this.makeBrokerRequest('data/addresses');
        return result;
    }

    getCachedCalibration(addr) {
        const path = 'data/addresses/' + addr;
        const result = this.makeBrokerRequest(path);
        return result;
    }

    getData() {
        const result = this.makeBrokerRequest('biotz/all/data');
        return result;
    }

    getCommunicationStatus() {
        if (! this.statusOK) {
            if (! this.resetRunning) {
                console.log('retry communication...');
                this.getBiotRouter();
                this.resetRunning = true;
                setTimeout(e => {
                    this.resetService();
                    this.resetRunning = false;
                }, 5000);
            }
        }
        return this.statusOK;
    }

    getRecordStatus(addr) {
        const result = this.makeBrokerRequest('biotz/addresses/' + addr + '/record/status');
        return result;
    }

    getRouterStatus() {
        const path = '';
        return this.makeBrokerRequest(path);
    }

    getStatus(addr) {
        const result = this.makeBrokerRequest('biotz/addresses/' + addr + '/alive');
        return result;
    }

    getSystemMessageRate() {
        const result = this.makeBrokerRequest('system/mrate');
        return result;
    }

    private handleError (error: any) {
        const errMsg = (error.message) ? error.message :
           error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        console.log("Error in broker request", errMsg);
        return Observable.throw(errMsg);
    }


    identify(addr) {
        const path = 'biotz/addresses/' + addr + '/led';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.put(url, "3")
            .map((response) => response.json());
    }

    private makeBrokerRequest(path: string) {
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        console.log(path);
        let src = this.http.get(url)
            .timeout(20)
            .map(this.extractWSData)
            .catch((err: Response) => {
                console.log(err);
                if (err.status >= 500) {
                    this.statusOK = false;
                } 
                console.log('failed to get resource', url, err);
                return this.handleError(err)
            });
            return src;

    }

    postAssemblyToCache(name, data: string) {
        const path = 'data/assembly/' + name;
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.post(url, data)
            .map((response) => response.json());
    }

    putAutoCal(addr, data: number) {
        const path = 'biotz/addresses/' + addr + '/auto';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.put(url, data)
            .map((response) => response.json());
    }

    putCalibrationsToCache(addr, data: string) {
        const path = 'data/addresses/' + addr;
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.put(url, data)
            .map((response) => response.json());
    }

    putCalibrationToNode(addr, data: string) {
        const path = 'biotz/addresses/' + addr + '/calibration';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.put(url, data)
            .map((response) => response.json());
    }

    putBiotzSensors(addr:string, g:boolean, a:boolean, c:boolean) {

        let data = '';
        if (g) {
            data += '1';
        } else {
            data += '0';
        } if (a) {
            data += '1';
        } else {
            data += '0';
        } if (c) {
            data += '1';
        } else {
            data += '0';
        }

        const path = 'biotz/addresses/' + addr + '/dof';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.put(url, data)
            .map((response) => response.json());
    }

    getRecordedData(addr: string) {
        const path = 'biotz/addresses/' + addr + '/record';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.get(url)
            .map((response) => response.json());
    }

    getRecordings() {
        const path = 'biotz/addresses/recordings';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.get(url)
            .map((response) => response.json());
    }

    recordData(addr: string, seconds: number) {
        const path = 'biotz/addresses/' + addr + '/record';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.put(url, seconds)
            .map((response) => response.json());
    }

    resetService() {
        console.log("resetting communications");
        const path = '';
        const result = this.makeBrokerRequest(path);
        result.subscribe(
            rawData => {
                console.log('data', rawData);
                this.statusOK = true;
            },
            error => {
                console.log('error resetting:', error);
            }
        );
    }

    resetCalibrationOnNode(addr) {
        const path = 'biotz/addresses/' + addr + '/calibration';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.put(url, '0:0:0:0:0:0')
            .map((response) => response.json());
    }

    synchronise() {
        const result = this.makeBrokerRequest('biotz/synchronise');
        return result;
    }


}
