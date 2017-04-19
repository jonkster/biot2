import { async, TestBed, inject } from '@angular/core/testing';
import { BaseRequestOptions, Http, HttpModule, Response, ResponseOptions } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';

import { BiotzService } from './biotz.service';


describe('BiotzService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                BiotzService,
                MockBackend,
                BaseRequestOptions,
                {
                    provide: Http,
                    useFactory: (backend, options) => new Http(backend, options),
                    deps: [MockBackend, BaseRequestOptions]
                }
            ],
            imports: [
                HttpModule
            ]
        });
    });

    it('should construct', async(inject(
        [BiotzService, MockBackend], (service, mockBackend) => {
            expect(service).toBeDefined();
        })));

    describe('getCachedCalibrationAddresses', () => {
        const mockResponse = ["affe::7a6f:3f74:74a5:292"];

        it('should return cached calibration addresses', async(inject(
            [BiotzService, MockBackend], (service, mockBackend) => {
                mockBackend.connections.subscribe(conn => {
                    conn.mockRespond(new Response(new ResponseOptions({ body: JSON.stringify(mockResponse) })));
                });

                const result = service.getCachedCalibrationAddresses();

                result.subscribe(res => {
                    expect(res).toEqual(["affe::7a6f:3f74:74a5:292"]);
                });
            })));
    });

    /*it('should ...', inject([BiotzService], (service: BiotzService) => {
     expect(service).toBeTruthy();
    }));*/

});
