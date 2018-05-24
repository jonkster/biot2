import { Injectable } from '@angular/core';
import { HttpModule, Http, Response, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';


import {PeriodicService} from '../periodic.service';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';

//declare const require: (moduleId: string) => any;


@Injectable()
export class BiotBrokerService {
    private biotServerHost: string = '';
    private biotServerPort: string = '8889';
    private detectedAddresses: { [addr: string]: string } = {};
    private DEBUG: boolean = true;
    private foundBroker: boolean = false;
    private secondsToWaitUntilBrokerSearch: number = 3;
    private updateCounter: number = 0;

    constructor(private http: Http, private periodicService: PeriodicService) {
        this.getHostIP();
        setTimeout(e => {
            if (! this.foundBroker) {
                this.getBiotRouter();
            }
        }, this.secondsToWaitUntilBrokerSearch * 1000);
        this.periodicService.registerTask('broker update', this, this.updateLoop);
    }

    private callBrokerHost(ip: string, cb) {
        const url = "http://" + ip + ":" + this.biotServerPort + "/";
        this.http.get(url)
            .timeout(40)
            .subscribe(
                data => {
                    this.foundBroker = true;
                    this.biotServerHost = ip;
                    this.debug('found broker',  ip + ':' + this.biotServerPort );
                    cb();
                },
                error => {
                    if (error.name !== 'TimeoutError' && error.status !== 0) {
                        this.debug('error when searching for broket at:' + ip + ':' + this.biotServerPort, error);
                    }
                }
            );
    }

    debug(msg: string, data: any) {
        if (this.DEBUG) {
            console.log('BiotBrokerService', msg, data);
        }
    }

    dropNode(addr: string) {
        const path = 'biotz/addresses/' + addr;
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path;
        this.http.delete(url, '')
            .subscribe(
                data => {
                    this.debug('node dropped', data);
                },
                error => {
                    this.debug('error dropping node', error);
                }
            );
    }

    private extractWSData (res: Response) {
        if (res.status == 200) {
            this.foundBroker = true;
        }
        const body = res.json();
        return body || {};
    }

    getANodesData(addr) {
        const result = this.makeBrokerRequest('biotz/addresses/' + addr, false);
        return result;
    }

    getAddresses() {
        const result = this.makeBrokerRequest('biotz/addresses', false);
        return result;
    }

    getAllNodesData() {
        const result = this.makeBrokerRequest('biotz/all/nodes', false);
        return result;
    }

    getAllNodesOrientation() {
        const result = this.makeBrokerRequest('biotz/all/data', false);
        return result;
    }

    getBiotRouter()
    {
        var localHost = location.hostname;
        if (localHost.match(/^\d+\.\d\.\d+\.\d+$/)) {
            if (localHost !== '127.0.0.1') {
                var net = localHost.replace(/\.[0-9]+$/, '.');
                let i = 0;
                let p = setInterval(() =>{
                    if (i > 255) {
                        this.foundBroker = false;
                        this.debug('NO Broker found: Setting broker to:', this.biotServerHost);
                        clearInterval(p);
                        return;
                    }
                    let ip = net + i++;
                    this.callBrokerHost(ip, () => { clearInterval(p); });
                }, 100);
            }
        }
    }

    getBrokerIP() {
        return this.biotServerHost;
    }

    getBrokerPort() {
        return this.biotServerPort;
    }

    getCachedAssemblies() {
        const result = this.makeBrokerRequest('data/assembly', true);
        return result;
    }

    getCachedAssembly(name) {
        const result = this.makeBrokerRequest('data/assembly/' + name, false);
        return result;
    }

    getCalibration(addr) {
        const result = this.makeBrokerRequest('biotz/addresses/' + addr + '/calibration', true);
        return result;
    }

    getCommunicationStatus() {
        /*if (this.biotServerHost !== '') {
            this.callBrokerHost(this.biotServerHost, {});
        }*/
        return this.foundBroker;
    }


    getDetectedAddresses(): string[] {
        return Object.keys(this.detectedAddresses);
    }

    private getHostIP() {
        const url = "assets/hostip.txt";
        return this.http.get(url)
            .subscribe(
                data => {
                    this.biotServerHost = data["_body"].replace(/\s/g, '');
                },
                error => {
                    this.debug('could not find host ip, try running "npm run setup"', error);
                }
            );
    }

    getPosition(addr) {
        if (this.detectedAddresses[addr] !== undefined) {
            return this.detectedAddresses[addr]['do'];
        } else {
            return undefined;
        }
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

    getRecordStatus(addr) {
        const result = this.makeBrokerRequest('biotz/addresses/' + addr + '/record/status', true);
        return result;
    }

    getRouterStatus() {
        const path = "biotz/edgerouter";
        return this.makeBrokerRequest(path, false);
    }

    getStatus(addr) {
        const result = this.makeBrokerRequest('biotz/addresses/' + addr + '/alive', true);
        return result;
    }

    getSystemMessageRate() {
        const result = this.makeBrokerRequest('system/mrate', false);
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


    private makeBrokerRequest(path: string, ignoreFail: boolean): Observable<any> {
            if (this.biotServerHost !== '') {
                    const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
                    let src = this.http.get(url)
                            .timeout(60)
                            .map(this.extractWSData)
                            .catch((err: Response) => {
                                            if (!ignoreFail) {
                                                console.log(err);
                                                if (err.status >= 500) {
                                                        this.foundBroker = false;
                                                } 
                                                console.log('failed to get resource', url, err);
                                                return this.handleError(err)
                                            }
                                            return Observable.empty();
                                    });
                    return src;
            } else {
                    return Observable.empty();
            }
    }

    postAssemblyToCache(name: string, data: string) {
        const path = 'data/assembly/' + name;
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.put(url, data)
            .map((response) => response.json());
    }

    putAutoCal(addr: string, data: number) {
        const path = 'biotz/addresses/' + addr + '/auto';
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

    recordData(addr: string, seconds: number) {
        const path = 'biotz/addresses/' + addr + '/record';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.put(url, seconds)
            .map((response) => response.json());
    }

    rereadNodes() {
        const path = 'biotz/all/nodes';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.delete(url, '')
            .map((response) => response.json());
    }

    resetCalibrationOnNode(addr) {
        const path = 'biotz/addresses/' + addr + '/calibration';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.put(url, '0:0:0:0:0:0')
            .map((response) => response.json());
    }

    resetService() {
        console.log("resetting communications");
        const path = '';
        const result = this.makeBrokerRequest(path, false);
        result.subscribe(
            rawData => {
                console.log('data', rawData);
                this.foundBroker = true;
            },
            error => {
                console.log('error resetting:', error);
            }
        );
    }

    saveData(key, value) {
        const path = 'data/config/' + key;
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.post(url, value)
            .map((response) => response.json());
    }

    setBiotBroker(address: string, port: string) {
        this.biotServerHost = address;
        this.biotServerPort = port;
        this.callBrokerHost(this.biotServerHost, {});
    }

    setEdgeRouter(address: string, port: string) {
        const path = 'biotz/edgerouter';
        const url = "http://" + this.biotServerHost + ":" + this.biotServerPort + "/" + path ;
        return this.http.put(url, address + ":" + port)
            .map((response) => response.json());
    }

    synchronise() {
        const result = this.makeBrokerRequest('biotz/synchronise', false);
        return result;
    }

    updateLoop(owner: any) {
        if ((owner.updateCounter++ % 100) === 0) {
            owner.getAllNodesData().subscribe(
                data => {
                    owner.detectedAddresses = {};
                    let addresses = Object.keys(data);
                    for (let i = 0; i < addresses.length; i++) {
                        let address = addresses[i];
                        let allData = data[address];
                        owner.detectedAddresses[address] = {
                            'do': allData['do'],
                            'dc': allData['dc'],
                            'ds': allData['ds']
                        };
                    }
                },
                error => {}
            );
        } else {
            owner.getAllNodesOrientation().subscribe(
                data => {
                    let addresses = Object.keys(data);
                    for (let i = 0; i < addresses.length; i++) {
                        let address = addresses[i];
                        let position = data[address];
                        if (owner.detectedAddresses[address] === undefined) {
                            owner.detectedAddresses[address] = {
                                'do': position,
                                'dc': null,
                                'ds': null
                            }
                        } else {
                            owner.detectedAddresses[address]['do'] = position;
                        }
                    }
                },
                error => {}
            );
        }
    }


}
