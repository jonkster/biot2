import { TestBed, inject } from '@angular/core/testing';
import { ThreedDirective } from './threed.directive';


describe('ThreedDirective', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ ThreedDirective ]
        });
    });
    it('should create an instance', inject([ThreedDirective], (directive: ThreedDirective) => {
        expect(directive).toBeTruthy();
    }));
});
