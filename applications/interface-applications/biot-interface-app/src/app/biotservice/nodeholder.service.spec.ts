import { TestBed, inject } from '@angular/core/testing';

import { NodeholderService } from './nodeholder.service';

describe('NodeholderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NodeholderService]
    });
  });

  it('should ...', inject([NodeholderService], (service: NodeholderService) => {
    expect(service).toBeTruthy();
  }));
});
