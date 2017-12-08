import { TestBed, inject } from '@angular/core/testing';

import { ObjectDrawingService } from './object-drawing.service';

describe('ObjectDrawingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ObjectDrawingService]
    });
  });

  it('should be created', inject([ObjectDrawingService], (service: ObjectDrawingService) => {
    expect(service).toBeTruthy();
  }));
});
