import { TestBed, inject } from '@angular/core/testing';
import { ThreedService } from './threed.service';

describe('ThreedService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThreedService]
    });
  });

  it('should ...', inject([ThreedService], (service: ThreedService) => {
    expect(service).toBeTruthy();
  }));
});
