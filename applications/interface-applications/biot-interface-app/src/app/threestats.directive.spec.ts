import { TestBed, inject } from '@angular/core/testing';
import { ThreestatsDirective } from './threestats.directive';

describe('ThreestatsDirective', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ ThreestatsDirective ]
        });
    });
  it('should create an instance',  inject([ThreestatsDirective], (directive: ThreestatsDirective) => {
    expect(directive).toBeTruthy();
  }));
});
