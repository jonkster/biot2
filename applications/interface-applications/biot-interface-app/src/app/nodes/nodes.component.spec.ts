import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BaseRequestOptions, Http, HttpModule, Response, ResponseOptions } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';

import { NodesComponent } from './nodes.component';
import {BiotzService} from '../biotz.service';

describe('NodesComponent', () => {
  let component: NodesComponent;
  let fixture: ComponentFixture<NodesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodesComponent ],
      providers: [
          BiotzService,
          MockBackend,
          BaseRequestOptions,
          {
              provide: Http,
              useFactory: (backend, options) => new Http(backend, options),
              deps: [MockBackend, BaseRequestOptions]
          }
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    console.log(component.biotz);
  });

});
