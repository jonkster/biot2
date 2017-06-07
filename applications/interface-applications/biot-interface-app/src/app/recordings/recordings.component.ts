import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ChartsModule } from 'ng2-charts';
import * as THREE from 'three';
import * as SPEC from 'fourier-transform';

declare const require: (moduleId: string) => any;

@Component({
  selector: 'app-recordings',
  templateUrl: './recordings.component.html',
  styleUrls: ['./recordings.component.css']
})
export class RecordingsComponent implements OnInit {

    private sub: any = undefined;
    private data: any = [];
    private isCollapsed = true;
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
    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            this.lineChartOptions.title.text = params.title;
            var json = JSON.parse(params.data);
            var data = json.data;
            this.currentRecording.address = json.address;
            this.currentRecording.sampleRate = json.sampleRate;
            this.currentRecording.interval = json.interval;
            this.currentRecording.count = json.count;


            let keys = Object.keys(data);
            let start = 0;
            let now = 0;
            for (let i = 0; i < keys.length; i++) {
                var st = data[keys[i]];
                var parts = st.split(':');
                now = parts[0];
                if (start === 0) {
                    start = now;
                }
                let quaternion = new THREE.Quaternion(parts[2], parts[3], parts[4], parts[1]).normalize();
                let euler = new THREE.Euler().setFromQuaternion(quaternion);
                this.data.push({
                    time: (now - start)/1000,
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
        });
    }

    ngOnDestroy() {
        if (this.sub !== undefined) {
            this.sub.unsubscribe();
        }
    }

    setPlottingData() {
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
            if (i % 2 === 0) {
                this.lineChartLabels.push(this.data[i].time);
            } else {
                this.lineChartLabels.push(' ');
            }
        }
        let ft = require('fourier-transform');
        let spectrumx = ft(data[0]);
        let spectrumy = ft(data[1]);
        let spectrumz = ft(data[2]);
        let freqScale = this.currentRecording['sampleRate'] / 2;
        console.log(freqScale);
        for (let i = 0; i < spectrumx.length; i++) {
            this.spectrumChartData[0].data.push(spectrumx[i]);
            this.spectrumChartData[1].data.push(spectrumy[i]);
            this.spectrumChartData[2].data.push(spectrumz[i]);
            this.spectrumChartLabels.push(((i/spectrumx.length) * freqScale).toFixed(3));
        }
        
    }



    // events
    public chartClicked(e:any):void {
        console.log(e);
    }

    public chartHovered(e:any):void {
        console.log(e);
    }
}
