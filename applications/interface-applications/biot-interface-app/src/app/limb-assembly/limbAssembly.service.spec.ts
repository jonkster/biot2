import { TestBed, inject } from '@angular/core/testing';

import { LimbAssemblyService} from './limbAssembly.service';

describe('LimbAssemblyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LimbAssemblyService]
    });
  });

  it('should ...', inject([LimbAssemblyService], (service: LimbAssemblyService) => {
    expect(service).toBeTruthy();
  }));
});
