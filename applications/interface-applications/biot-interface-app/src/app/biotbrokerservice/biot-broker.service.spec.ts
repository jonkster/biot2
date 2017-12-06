import { TestBed, inject } from '@angular/core/testing';

import { MockBackend } from '@angular/http/testing';

import { BiotBrokerService } from './biot-broker.service';

describe('BiotBrokerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BiotBrokerService]
    });
  });

  it('should be created', inject([BiotBrokerService], (service: BiotBrokerService) => {
    expect(service).toBeTruthy();
  }));

  it('should set the Biot Broker IP Address to the current host', inject([BiotBrokerService], (service: BiotBrokerService) => {
      expect(this.biotServerHost.toEqual('10.1.1.61'));
  }));
});
