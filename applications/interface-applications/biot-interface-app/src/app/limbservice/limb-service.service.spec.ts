import { TestBed, inject } from '@angular/core/testing';

import { LimbService } from './limb.service';

describe('LimbService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LimbService]
    });
  });

  it('should be created', inject([LimbService], (service: LimbService) => {
    expect(service).toBeTruthy();
  }));
});
