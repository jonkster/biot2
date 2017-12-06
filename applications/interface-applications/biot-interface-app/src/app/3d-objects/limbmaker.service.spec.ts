import { TestBed, inject } from '@angular/core/testing';
import { NodemodelService } from './nodemodel.service';
import { HttpModule, Http } from '@angular/http';

import { LimbmakerService } from './limbmaker.service';

describe('LimbmakerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
        providers: [ {provide: LimbmakerService, nodemodel: NodemodelService, http: Http} ]
    });
  });

  it('should ...', inject([LimbmakerService], (service: LimbmakerService) => {
    expect(service).toBeTruthy();
  }));
});
