import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ThreedService } from '../threed/threed.service';
import { ThreedDirective } from '../threed.directive';
import { LimbmakerService } from '../3d-objects/limbmaker.service';
import { NodemodelService } from '../3d-objects/nodemodel.service';
import { NotfoundComponent } from './notfound.component';

describe('NotfoundComponent', () => {
  let component: NotfoundComponent;
  let fixture: ComponentFixture<NotfoundComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NotfoundComponent, ThreedDirective ],
      providers: [ ThreedService, LimbmakerService, NodemodelService ],
      imports: [ RouterTestingModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotfoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
