import { TestBed, inject } from '@angular/core/testing';

import { LimbmakerService } from './limbmaker.service';

describe('LimbmakerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LimbmakerService]
    });
  });

  it('should ...', inject([LimbmakerService], (service: LimbmakerService) => {
    expect(service).toBeTruthy();
  }));
});
