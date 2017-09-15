import { Component, OnInit, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { ChartsModule } from 'ng2-charts';
import { BaseChartDirective } from 'ng2-charts/ng2-charts';
import {BiotService} from '../biotservice/biot.service';
import {NodeholderService} from '../biotservice/nodeholder.service';
import {PeriodicService} from '../periodic.service';
import * as THREE from 'three';
import * as SPEC from 'fourier-transform';

declare const require: (moduleId: string) => any;

@Component({
  selector: 'app-monitor',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.css']
})
export class MonitorComponent implements OnInit {

    private biotService: BiotService;
    private data: any = [];
    private monitor: any = {};
    private nodeAddresses: string[] = [];
    private nodeData: any = {};
    private nodeHolderService: NodeholderService = undefined;
    private now: number = 0;
    private selectedNodeAddress: string = '';
    private sr: number = 0;
    private spectrumBandwidth: number = 3;
    private xFreqsSorted: [number][] = [];
    private yFreqsSorted: [number][] = [];
    private zFreqsSorted: [number][] = [];

    private monPeriod : number = 10;

    @ViewChild('xyzplot') elementView;
    @ViewChildren(BaseChartDirective) public charts: BaseChartDirective;

    public lineChartLegend:boolean = true;
    public lineChartType:string = 'line';

    public spectrumChartLegend:boolean = true;
    public spectrumChartType:string = 'line';

    public lineChartData:Array<any> = [
        {data: [], label: 'x'},
        {data: [], label: 'y'},
        {data: [], label: 'z'}
    ];
    public lineChartLabels:Array<any> = [];

    public lineChartOptions:any = {
        elements: {
            point: {
                pointStyle: 'circle'
            }
        },
        responsive: true,
        title: { text: 'Rotations', display: true },
        scales: {
            xAxes: [{
                scaleLabel: {
                    labelString: 'seconds',
                    display: true
                }
            }],
            yAxes: [{
                ticks: {
                    stepSize: 25
                },
                scaleLabel: {
                    labelString: 'degrees',
                    display: true
                }
            }]
        },
        pointStyle: 'cross'
    };

    public lineChartColors:Array<any> = [
        { // grey
            backgroundColor: 'rgba(255,159,177,0.2)',
            borderColor: 'rgba(255,159,177,1)',
            pointBackgroundColor: 'rgba(255,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(255,159,177,0.8)'
        },
        { // dark grey
            backgroundColor: 'rgba(77,255,96,0.2)',
            borderColor: 'rgba(77,255,96,1)',
            pointBackgroundColor: 'rgba(77,255,96,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(77,255,96,1)'
        },
        { // grey
            backgroundColor: 'rgba(148,159,255,0.2)',
            borderColor: 'rgba(148,159,255,1)',
            pointBackgroundColor: 'rgba(148,159,255,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,255,0.8)'
        }
    ];

    public spectrumChartData:Array<any> = [
        {data: [], label: 'x'},
        {data: [], label: 'y'},
        {data: [], label: 'z'}
    ];
    public spectrumChartLabels:Array<any> = [];

    public spectrumChartOptions:any = {
        elements: {
            point: {
                pointStyle: 'circle'
            }
        },
        responsive: true,
        title: { text: 'Frequency Spectrum', display: true },
        scales: {
            xAxes: [{
                ticks: {
                    stepSize: 4
                },
                scaleLabel: {
                    labelString: 'frequency (Hz)',
                    display: true
                }
            }],
            yAxes: [{
                ticks: {
                    stepSize: 15
                },
                scaleLabel: {
                    labelString: 'magnitude',
                    display: true
                }
            }]
        },
        pointStyle: 'cross'
    };
    public spectrumChartColors:Array<any> = [
        { // grey
            backgroundColor: 'rgba(255,159,177,0.2)',
            borderColor: 'rgba(255,159,177,1)',
            pointBackgroundColor: 'rgba(255,159,177,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(255,159,177,0.8)'
        },
        { // dark grey
            backgroundColor: 'rgba(77,255,96,0.2)',
            borderColor: 'rgba(77,255,96,1)',
            pointBackgroundColor: 'rgba(77,255,96,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(77,255,96,1)'
        },
        { // grey
            backgroundColor: 'rgba(148,159,255,0.2)',
            borderColor: 'rgba(148,159,255,1)',
            pointBackgroundColor: 'rgba(148,159,255,1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(148,159,255,0.8)'
        }
    ];

    constructor(biotService: BiotService, nodeHolderService: NodeholderService, private periodicService: PeriodicService) {
        this.biotService = biotService;
        this.nodeHolderService = nodeHolderService;
    }

    ngOnInit() {
        this.biotService.detectNodes();
        this.periodicService.registerTask('node update', this.nodeHolderService, this.nodeHolderService.updateLoop);
        this.addDetectedNodes();
    }

    addDetectedNodes() {
        setTimeout(e => {
            this.nodeAddresses = this.biotService.getDetectedAddresses();
            this.getAllNodeData();
            this.addDetectedNodes();
            this.updateRecordings();
        }, 1000);
    }

    displayRecording(addr: string, recordingData) {
        this.lineChartOptions.title.text = 'rotation of: ' + recordingData.title;
        let recording = JSON.parse(recordingData.data);

        let start = 0;
        let now = 0;
        let points = this.getNearestPowerOfTwo(recording.data);
        let dropped = recordingData.length - points.length;
        if (dropped !== 0) {

            let stepSize = recording.interval / recording.data.length;
            this.sr = recording.sampleRate;

            if (points.length >= 16) {
                let prevEuler = undefined;
                this.data = [];
                for (let i = 0; i < points.length; i++) {
                    var st = points[i];
                    var parts = st.split(':');
                    now = parts[0];
                    if (start === 0) {
                        start = now;
                    }
                    let quaternion = new THREE.Quaternion(parts[2], parts[3], parts[4], parts[1]).normalize();
                    let euler = this.scaleEuler(new THREE.Euler().setFromQuaternion(quaternion), prevEuler);
                    prevEuler = euler;
                    this.data.push({
                        time: i * stepSize,
                        ts: parts[0],
                        w: parts[1],
                        x: parts[2],
                        y: parts[3],
                        z: parts[4],
                        ex: this.scaleDegrees(euler.x),
                        ey: this.scaleDegrees(euler.y),
                        ez: this.scaleDegrees(euler.z)
                    });
                }
                this.setPlottingData(this.sr);
                // force chart update
                this.charts['_results'][0].ngOnChanges({} as SimpleChanges);
                this.charts['_results'][1].ngOnChanges({} as SimpleChanges);
            } else {
                console.log("too few points");
            }
        } else {
            alert("missing data?");
        }
    }

    getCommunicationStatus() {
        return this.biotService.getCommunicationStatus();
    }

    getAllNodeData() {
        this.now = new Date().getTime();
        for (let i = 0; i < this.nodeAddresses.length; i++) {
            let addr = this.nodeAddresses[i];
            if (this.nodeData[addr] === undefined) {
                    this.nodeData[addr] = {
                        'lasttime' : this.now,
                        'timeStamp' : 0
                    };
                    this.monitorNode(addr, this.monPeriod, false);
            }
            this.biotService.getANodesData(addr).subscribe(
                rawData => {
                    let posData = rawData["data"];
                    let parts = posData.split(/:/);
                    if (Number(parts[0]) != this.nodeData[addr].timeStamp) {
                        this.nodeData[addr].timeStamp = Number(parts[0]); 
                        this.nodeData.lasttime = this.now;
                    }
                },
                error => {
                    console.log('error getting data:', error);
                }
            );
        }
    }

    getNearestPowerOfTwo(points) {
        let N = points.length
        let k = Math.floor(Math.log(N) / Math.LN2)

        while ((N > 0) && Math.pow(2, k) !== N) {
            k = Math.floor(Math.log(--N) / Math.LN2)
        }
        console.log('nearest = ', N);
        points.splice(N);
        return points;
    }

    getRecordingAndDisplay(addr: string) {
        this.biotService.getRecordedData(addr).subscribe(
            rawData => { this.displayRecording(addr, {'title': addr, 'data': JSON.stringify(rawData)}); },
            error => { alert('error:' + error)},
        );
    }

    monitorNode(addr: string, period: number, active: boolean) {
        if (this.monitor[addr] === undefined) {
            this.monitor[addr] = {
                active: false,
                period: period
            }
        }

        if (active && this.monitor[addr].active) {
            alert('already monitoring');
            return;
        }

        this.monitor[addr] = {
            active: active,
            period: period
        }
    }

    openNodeControl(addr: string) {
        this.selectedNodeAddress = addr;
    }

    pickFrequencies(sampleRate: number) {
        this.xFreqsSorted = this.sortSpectrum(this.spectrumChartData[0].data,  this.spectrumChartLabels, sampleRate);
        this.yFreqsSorted = this.sortSpectrum(this.spectrumChartData[1].data,  this.spectrumChartLabels, sampleRate);
        this.zFreqsSorted = this.sortSpectrum(this.spectrumChartData[2].data,  this.spectrumChartLabels, sampleRate);
    }

    setPlottingData(sampleRate: number) {
        console.log('plotting', this.data.length, 'samples');

        if (this.data.length > 0) {
            this.lineChartData[0].data = [];
            this.lineChartData[1].data = [];
            this.lineChartData[2].data = [];
            this.lineChartLabels = [];
            this.spectrumChartData[0].data = [];
            this.spectrumChartData[1].data = [];
            this.spectrumChartData[2].data = [];
            this.spectrumChartLabels = [];
            let data = [[], [], []];

            for (let i = 0; i < this.data.length; i++) {
                var x = this.data[i].ex;
                var y = this.data[i].ey;
                var z = this.data[i].ez;

                this.lineChartData[0].data.push(x);
                this.lineChartData[1].data.push(y);
                this.lineChartData[2].data.push(z);
                data[0].push(x);
                data[1].push(y);
                data[2].push(z);
                let secs = Math.floor((this.data[i].time * 100)) / 100;
                if (i % 4 === 0) {
                    this.lineChartLabels.push(secs);
                } else {
                    this.lineChartLabels.push(' ');
                }
            }
            let ft = require('fourier-transform');
            let spectrumx = ft(data[0]);
            let spectrumy = ft(data[1]);
            let spectrumz = ft(data[2]);
            let freqScale = sampleRate / 2;
            let startFreq = 0;
            let sums = [0, 0, 0];
            let bands = Math.floor(freqScale / this.spectrumBandwidth);
            let mod = Math.floor(spectrumx.length / bands);
            console.log('b', bands, 'm', mod);
            for (let i = 1; i < spectrumx.length; i++) {
                sums[0] += spectrumx[i];
                sums[1] += spectrumy[i];
                sums[2] += spectrumz[i];
                let freq = ((i / spectrumx.length) * freqScale);
                if (i % mod === 0) {
                    this.spectrumChartData[0].data.push(sums[0]);
                    this.spectrumChartData[1].data.push(sums[1]);
                    this.spectrumChartData[2].data.push(sums[2]);
                    this.spectrumChartLabels.push((startFreq + (freq - startFreq)/2).toFixed(1));
                    startFreq = freq;
                    sums = [0, 0, 0];
                }
            }
            this.pickFrequencies(sampleRate);

        } else {
            alert('no data');
        }
    }

    scaleDegrees(radians: number) {

        return radians * 180 / Math.PI;
    }

    scaleAngle(radians: number, prevRadians: number) {
        let delta = radians - prevRadians;
        if (Math.abs(delta) > Math.PI) {
            if (delta < 0) {
                radians += 2*Math.PI;
            } else {
                radians -= 2*Math.PI;
            }
        }
        return radians;
    }

    scaleEuler(euler, prevEuler) {

        if (prevEuler !== undefined) {
            euler.x = this.scaleAngle(euler.x, prevEuler.x);
            euler.y = this.scaleAngle(euler.y, prevEuler.y);
            euler.z = this.scaleAngle(euler.z, prevEuler.z);
        }
        return euler;
    }

    sortSpectrum(magnitude: number[], freqs: number[], sampleRate: number) {
        let freqTable = [];
        for (let i = 0; i < magnitude.length; i++) {
            freqTable.push([freqs[i], magnitude[i]]);
        }
        freqTable.sort(function(a, b) {
            return b[1] - a[1];
        });
        let main = [];
        for (let i = 0; i < freqTable.length; i++) {
            main.push(freqTable[i][0]);
        }
        return main;
    }


    startRecording(addr, period: number) {
        this.biotService.recordData(addr, period).subscribe(
            rawData => { console.log("recording"); },
            error => { alert('error:' + error)},
        );
    }

    updateRecordings() {
        for (let i = 0; i < this.nodeAddresses.length; i++) {
            let addr = this.nodeAddresses[i];
            if (this.monitor[addr].active) {

                this.biotService.getRecordStatus(addr)
                    .subscribe(
                        rawData => {
                            console.log('recording status', rawData);
                            if (! rawData.recordingActive)  {
                                if (rawData.recordingExists) {
                                    this.getRecordingAndDisplay(addr);
                                }
                                console.log("Trigger recording again");
                                this.startRecording(addr, this.monPeriod);
                                this.monitor[addr].period = this.monPeriod;
                            }
                        },
                        error => { console.log('error getting record status:' + error); },
                    );
                    if (this.monitor[addr].period-- <= 0) {
                        console.log('?');
                    }
            }
        }
    }

}
