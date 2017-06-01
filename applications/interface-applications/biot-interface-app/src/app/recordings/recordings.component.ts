import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ChartsModule } from 'ng2-charts';
import * as THREE from 'three';

@Component({
  selector: 'app-recordings',
  templateUrl: './recordings.component.html',
  styleUrls: ['./recordings.component.css']
})
export class RecordingsComponent implements OnInit {

    private sub: any = undefined;
    private data: any = [];
    private isCollapsed = true;

    public lineChartLegend:boolean = true;
    public lineChartType:string = 'line';

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

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            this.lineChartOptions.title.text = params.title;
            var json = JSON.parse(params.data);
            let keys = Object.keys(json);
            console.log(keys);
            console.log(json);
            let start = 0;
            let now = 0;
            for (let i = 0; i < keys.length; i++) {
                var st = json[keys[i]];
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
        this.sub.unsubscribe();
    }

    setPlottingData() {
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
            if (i % 2 === 0) {
                this.lineChartLabels.push(this.data[i].time);
            } else {
                this.lineChartLabels.push(' ');
            }
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
