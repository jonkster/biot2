import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { ChartsModule } from 'ng2-charts';
import {MatSliderModule} from '@angular/material/slider';
import {CdkTableModule} from '@angular/cdk/table';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { AngularDraggableModule } from 'angular2-draggable';

import { AppComponent } from './app.component';
import { ThreedDirective } from './threed.directive';
import { NodesComponent } from './nodes/nodes.component';
import { AboutComponent } from './about/about.component';
import { NotfoundComponent } from './notfound/notfound.component';

import {ThreedService} from './threed/threed.service';
import {LimbmakerService} from './3d-objects/limbmaker.service';
import {LimbAssemblyService} from './limb-assembly/limbAssembly.service';
import {LimbService} from './limbservice/limb.service';
import {LoggingService} from './logging.service';
import {NodemodelService} from './3d-objects/nodemodel.service';
import {ObjectDrawingService} from './objectdrawing/object-drawing.service';
import {BiotService} from './biotservice/biot.service';
import {BiotBrokerService} from './biotbrokerservice/biot-broker.service';
import {NodeholderService} from './biotservice/nodeholder.service';
import {NodeService} from './nodeservice/node.service';
import {PeriodicService} from './periodic.service';
import {SystemComponent} from './system/system.component';
import { DialogComponent } from './dialog/dialog.component';
import { RecordingsComponent } from './recordings/recordings.component';
import { MonitorComponent } from './monitor/monitor.component';
import { ThreestatsDirective } from './threestats.directive';
import { AssembliesComponent } from './assemblies/assemblies.component';
import { Rad2degPipe } from './rad2deg.pipe';


export const rootRouterConfig: Routes = [
    {path: '', redirectTo: 'about', pathMatch: 'full'},
    {path: 'about', component: AboutComponent},
    {path: 'nodes', component: NodesComponent},
    {path: 'recordings', component: RecordingsComponent},
    {path: 'monitor', component: MonitorComponent},
    {path: 'system', component: SystemComponent},
    {path: 'assemblies', component: AssembliesComponent},
    {path: '**', component: NotfoundComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    ThreedDirective,
    NodesComponent,
    AboutComponent,
    NotfoundComponent,
    SystemComponent,
    DialogComponent,
    RecordingsComponent,
    MonitorComponent,
    ThreestatsDirective,
    AssembliesComponent,
    Rad2degPipe
  ],
  imports: [
    BrowserModule,
    ChartsModule,
    AngularDraggableModule,
    FormsModule,
    HttpModule,
    MatSliderModule,
    CdkTableModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(rootRouterConfig)
  ],
  providers: [ThreedService, LimbmakerService, LimbAssemblyService, LimbService, LoggingService, NodemodelService, ObjectDrawingService, BiotService, BiotBrokerService, NodeholderService, NodeService, PeriodicService],
  bootstrap: [AppComponent]
})
export class AppModule { }
