import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ViewChildren, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ChartsModule } from 'ng2-charts';
import { BaseChartDirective } from 'ng2-charts/ng2-charts';
import {BiotService} from '../biotservice/biot.service';
import {ThreedService} from '../threed/threed.service';
import {LimbmakerService} from '../3d-objects/limbmaker.service';
import * as THREE from 'three';
import * as SPEC from 'fourier-transform';

declare const require: (moduleId: string) => any;

@Component({
  selector: 'app-recordings',
  templateUrl: './recordings.component.html',
  styleUrls: ['./recordings.component.css']
})
export class RecordingsComponent implements OnInit {

    @ViewChild('xyzplot') elementView;
    @ViewChildren(BaseChartDirective) public charts: BaseChartDirective;

    private biotService: BiotService;
    private threedService: ThreedService;
    private limbMakerService: LimbmakerService;
    private image: THREE.Object3D;
    private limb: THREE.Object3D;
    private i: number = 0;
    private replayStart: number = 0;
    private cursorPosition: number = 50;

    private isPlaying: boolean = false;
    private isLooping: boolean = true;
    private replaySpeed: number = 1;
    private replayPosition: number = 0;

    private sub: any = undefined;
    private data: any = [];
    private isCollapsed = true;
    private knownRecordings = [];
    private currentRecording = {
        address: '',
        sampleRate: 0,
        interval: 0,
        count: 0
    };

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
                    stepSize: 5
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
    constructor(private route: ActivatedRoute, biotService: BiotService, threedService: ThreedService, limbMakerService: LimbmakerService) { 
        this.biotService = biotService;
        this.threedService = threedService;
        this.limbMakerService = limbMakerService;
    }

    getRecordingsAndDisplay() {
        this.biotService.getRecordings().subscribe(
            rawData => {
                this.knownRecordings = rawData;
                if (this.knownRecordings.length > 0) {
                    let addr = this.knownRecordings[0];
                    this.biotService.getRecordedData(addr).subscribe(
                        rawData => { this.displayRecording({'title': 'recording', 'data': JSON.stringify(rawData)}); },
                        error => { alert('error:' + error)},
                    );
                } else {
                    console.log('Woah!');
                }
            },
            error => { alert('error:' + error)},
        );
    }

    displayRecording(recordingData) {
        this.lineChartOptions.title.text = 'rotation of: ' + recordingData.title;
        let recording = JSON.parse(recordingData.data);
        this.currentRecording.address = recording.address;
        this.currentRecording.sampleRate = recording.sampleRate;
        this.currentRecording.interval = recording.interval;
        this.currentRecording.count = recording.count;
        let stepSize = recording.interval / recording.count;

        let points = recording.data;


        let start = 0;
        let now = 0;
        console.log('points count', points.length);
        for (let i = 0; i < points.length; i++) {
            var st = points[i];
            var parts = st.split(':');
            now = parts[0];
            if (start === 0) {
                start = now;
            }
            let quaternion = new THREE.Quaternion(parts[2], parts[3], parts[4], parts[1]).normalize();
            let euler = new THREE.Euler().setFromQuaternion(quaternion);
            this.data.push({
                time: i * stepSize,
                ts: parts[0],
                w: parts[1],
                x: parts[2],
                y: parts[3],
                z: parts[4],
                ex: euler.x * 180 / Math.PI,
                ey: euler.y * 180 / Math.PI,
                ez: euler.z * 180 / Math.PI
            });
        }
        this.setPlottingData();
        // force chart update
        this.charts['_results'][0].ngOnChanges({} as SimpleChanges);
        this.charts['_results'][1].ngOnChanges({} as SimpleChanges);
    }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            if (! params.data) {
                // no recording asked for
                this.getRecordingsAndDisplay();
                return;
            } else {
                console.log('pp', params);
                this.displayRecording(params);
            }
        });
    }

    ngAfterViewInit() {

        // set up some test objects

        this.threedService.setBackgroundColour('#ffffff');
        const texture = THREE.ImageUtils.loadTexture('./assets/mocap.png');
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 2, 2 );
        const material = new THREE.MeshBasicMaterial({map: texture, opacity: 0.2, transparent: true});
        material.side = THREE.DoubleSide;
        const geometry = new THREE.PlaneGeometry(800, 600, 0);
        this.image = new THREE.Mesh(geometry, material);
        this.image.rotateX(-Math.PI/2);

        let axis = this.limbMakerService.makeAxis(0, 0, 0, 420, 1, 0.1);

        //this.limb = this.limbMakerService.makeLimbWithNode();
        //this.limb.add(this.image);
        this.limb = this.limbMakerService.makeNodeModel('fred', 'RECORDED-IMU', 'recorded node', 0, 0, 0, '#ff7f7f');
        this.limb.add(axis);
        //this.limb.rotateX(0.9);
        //this.limb.rotateZ(0.9);
        this.threedService.add(this.limb);

        this.threedService.addLighting(0, 0, 0);

        this.replay();

        this.threedService.zoom(1.5);
    }

    ngOnDestroy() {
        if (this.sub !== undefined) {
            this.sub.unsubscribe();
        }
    }

    setPlottingData() {
        if (this.data.length > 0) {
            let data = [[], [], []];
            for (let i = 0; i < this.data.length; i++) {
                var x = this.data[i].ex;
                var y = this.data[i].ey;
                var z = this.data[i].ez;
                if (x < 0) {
                    x += 360;
                }
                x -= 180;

                this.lineChartData[0].data.push(x);
                this.lineChartData[1].data.push(y);
                this.lineChartData[2].data.push(z);
                data[0].push(x);
                data[1].push(y);
                data[2].push(z);
                let secs = Math.floor((this.data[i].time * 100)) / 100;
                if (i % 2 === 0) {
                    this.lineChartLabels.push(secs);
                } else {
                    this.lineChartLabels.push(' ');
                }
            }
            let ft = require('fourier-transform');
            let spectrumx = ft(data[0]);
            let spectrumy = ft(data[1]);
            let spectrumz = ft(data[2]);
            let freqScale = this.currentRecording['sampleRate'] / 2;
            console.log('fs', freqScale);
            for (let i = 0; i < spectrumx.length; i++) {
                this.spectrumChartData[0].data.push(spectrumx[i]);
                this.spectrumChartData[1].data.push(spectrumy[i]);
                this.spectrumChartData[2].data.push(spectrumz[i]);
                this.spectrumChartLabels.push(((i/spectrumx.length) * freqScale).toFixed(3));
            }

        } else {
            alert('no data');
        }
    }



    // events
    public chartClicked(e:any):void {
        console.log(e);
        console.log(this.elementView);
    }

    public chartHovered(e:any):void {
        console.log(e);
    }

    setCursor(time: number) {
        let secs = time / 1000;
        let fract = secs / this.currentRecording.interval;
        this.replayPosition = fract;

        let leftOffset = 50;
        let graphWidth = this.elementView.nativeElement.width;
        this.cursorPosition = leftOffset + (fract * (graphWidth - leftOffset));
    }

    getPoint(index: number) {
        if (this.data.length > 0) {
            return this.data[index];
        }
        return undefined;
    }

    getTime(index: number) {
        if (this.data.length > 0) {
            let point = this.getPoint(index);
            if (point !== undefined) {
                return (point.time * 1000);
            }
        }
        return 0;
    }


    replay() {
        requestAnimationFrame(() => {
            if (this.data.length > 0) {
                let t = this.getTime(this.i);
                let point = this.getPoint(this.i++);
                if (this.i >= this.data.length) {
                    if (! this.isLooping) {
                        this.isPlaying = false;
                        return;
                    }
                    this.i = 0;
                } else if (this.i < 0) {
                    this.i = 0;
                }
                let delay = t - this.replayStart;
                this.replayStart = t;
                let quaternion = new THREE.Quaternion(point.x, point.y, point.z, point.w).normalize();
                this.limb.setRotationFromQuaternion(quaternion);
                this.setCursor(t);
                if (this.isPlaying) {
                    setTimeout(e => {
                        this.replay();
                    }, delay);
                }
            }
        });
    }
}
