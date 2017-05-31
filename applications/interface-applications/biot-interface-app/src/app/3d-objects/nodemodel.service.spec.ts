import { TestBed, inject } from '@angular/core/testing';

import { NodemodelService } from './nodemodel.service';

describe('NodemodelService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NodemodelService]
    });
  });

  it('should ...', inject([NodemodelService], (service: NodemodelService) => {
    expect(service).toBeTruthy();
  }));
});
