import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { AboutComponent } from './about/about.component';
import { AssembliesComponent } from './assemblies/assemblies.component';
import { NodesComponent } from './nodes/nodes.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { ThreeDirective } from './three.directive';


export const rootRouterConfig: Routes = [
    {path: '', redirectTo: 'about', pathMatch: 'full'},
    {path: 'about', component: AboutComponent},
    {path: 'nodes', component: NodesComponent},
    {path: 'assemblies', component: AssembliesComponent},
    {path: '**', component: NotfoundComponent }
];


@NgModule({
  declarations: [
    AppComponent,
    AssembliesComponent,
    AboutComponent,
    NodesComponent,
    NotfoundComponent,
    ThreeDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(rootRouterConfig)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
