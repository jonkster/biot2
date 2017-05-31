import { TestBed, inject } from '@angular/core/testing';

import { BiotService } from './biot.service';

describe('BiotService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BiotService]
    });
  });

  it('should ...', inject([BiotService], (service: BiotService) => {
    expect(service).toBeTruthy();
  }));
});
