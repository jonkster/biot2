import { Injectable } from '@angular/core';
import { HttpModule, Http, Response, URLSearchParams } from '@angular/http';

import {Observable} from 'rxjs/Observable';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';

@Injectable()
export class BiotzService {

    private statusOK:boolean = true;
    private resetRunning: boolean = false;

    constructor(private http: Http) {}

    private extractWSData (res: Response) {
        let body = res.json();
        return body || {};
    }

    addDummyNode(addr) {
        var path = 'biotz/addnode/' + addr;
        var url = "http://localhost:8889/" + path;
        return this.http.put(url, '')
            .map((response) => response.json());
    }

    dropDummyNodes() {
        var path = 'biotz/dropnodes';
        var url = "http://localhost:8889/" + path;
        return this.http.put(url, '')
            .map((response) => response.json());
    }

    getCalibration(addr) {
        var result = this.makeBrokerRequest('biotz/addresses/' + addr + '/calibration');
        return result;
    }

    getCachedAssemblies() {
        var path = 'data/assembly';
        var result = this.makeBrokerRequest(path);
        return result;
    }

    getCachedAssembly(name) {
        var path = 'data/assembly/' + name;
        var result = this.makeBrokerRequest(path);
        return result;
    }

    getCachedCalibrationAddresses() {
        var result = this.makeBrokerRequest('data/addresses');
        return result;
    }

    getCachedCalibration(addr) {
        var path = 'data/addresses/' + addr;
        var result = this.makeBrokerRequest(path);
        return result;
    }

    getData() {
        var result = this.makeBrokerRequest('biotz/all/data');
        return result;
    }

    getCommunicationStatus() {
        if (! this.statusOK) {
            if (! this.resetRunning) {
                console.log('retry communication...');
                this.resetRunning = true;
                setTimeout(e => {
                    this.resetService();
                    this.resetRunning = false;
                }, 5000);
            }
        }
        return this.statusOK;
    }

    getStatus(addr) {
        var result = this.makeBrokerRequest('biotz/addresses/' + addr + '/alive');
        return result;
    }

    getSystemMessageRate() {
        var result = this.makeBrokerRequest('system/mrate');
        return result;
    }

    private handleError (error: any) {
        let errMsg = (error.message) ? error.message :
            error.status ? `${error.status} - ${error.statusText}` : 'Server error';
        //console.log("Error in broker request", errMsg);
        return Observable.throw(errMsg);
    }


    identify(addr) {
        var path = 'biotz/addresses/' + addr + '/led';
        var url = "http://localhost:8889/" + path ;
        return this.http.put(url, "3")
            .map((response) => response.json());
    }

    private makeBrokerRequest(path: string) {
        var url = "http://localhost:8889/" + path ;
        return this.http.get(url)
            .map(this.extractWSData)
            .catch((err: Response) => { this.statusOK = false; return this.handleError(err)});
    }

    postAssemblyToCache(name, data: string) {
        var path = 'data/assembly/' + name;
        var url = "http://localhost:8889/" + path ;
        return this.http.post(url, data)
            .map((response) => response.json());
    }

    putAutoCal(addr, data: number) {
        var path = 'biotz/addresses/' + addr + '/auto';
        var url = "http://localhost:8889/" + path ;
        return this.http.put(url, data)
            .map((response) => response.json());
    }

    putCalibrationsToCache(addr, data: string) {
        var path = 'data/addresses/' + addr;
        var url = "http://localhost:8889/" + path ;
        return this.http.put(url, data)
            .map((response) => response.json());
    }

    putCalibrationToNode(addr, data: string) {
        var path = 'biotz/addresses/' + addr + '/calibration';
        var url = "http://localhost:8889/" + path ;
        return this.http.put(url, data)
            .map((response) => response.json());
    }

    putBiotzSensors(addr:string, g:boolean, a:boolean, c:boolean) {

        var data = '';
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

        var path = 'biotz/addresses/' + addr + '/dof';
        var url = "http://localhost:8889/" + path ;
        return this.http.put(url, data)
            .map((response) => response.json());
    }

    resetService() {
        console.log("resetting communications");
        this.statusOK = true;
    }

    resetCalibrationOnNode(addr) {
        var path = 'biotz/addresses/' + addr + '/calibration';
        var url = "http://localhost:8889/" + path ;
        return this.http.put(url, '0:0:0:0:0:0')
            .map((response) => response.json());
    }

    synchronise() {
        var result = this.makeBrokerRequest('biotz/synchronise');
        return result;
    }

}
