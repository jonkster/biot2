import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { ChartsModule } from 'ng2-charts';
import {MatSliderModule} from '@angular/material/slider';
import {CdkTableModule} from '@angular/cdk/table';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { ThreedDirective } from './threed.directive';
import { NodesComponent } from './nodes/nodes.component';
import { AboutComponent } from './about/about.component';
import { NotfoundComponent } from './notfound/notfound.component';

import {ThreedService} from './threed/threed.service';
import {LimbmakerService} from './3d-objects/limbmaker.service';
import {LimbAssemblyService} from './limb-assembly/limbAssembly.service';
import {NodemodelService} from './3d-objects/nodemodel.service';
import {BiotService} from './biotservice/biot.service';
import {NodeholderService} from './biotservice/nodeholder.service';
import {PeriodicService} from './periodic.service';
import {SystemComponent} from './system/system.component';
import { DialogComponent } from './dialog/dialog.component';
import { RecordingsComponent } from './recordings/recordings.component';
import { MonitorComponent } from './monitor/monitor.component';
import { ThreestatsDirective } from './threestats.directive';
import { AssembliesComponent } from './assemblies/assemblies.component';


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
    AssembliesComponent
  ],
  imports: [
    BrowserModule,
    ChartsModule,
    FormsModule,
    HttpModule,
    MatSliderModule,
    CdkTableModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(rootRouterConfig)
  ],
  providers: [ThreedService, LimbmakerService, LimbAssemblyService, NodemodelService, BiotService, NodeholderService, PeriodicService],
  bootstrap: [AppComponent]
})
export class AppModule { }
