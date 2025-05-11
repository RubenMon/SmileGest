import { TestBed } from '@angular/core/testing';

import { ModalEventsService } from './modal-events.service';

describe('ModalEventsService', () => {
  let service: ModalEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalEventsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
