import { TestBed } from '@angular/core/testing';

import { TriggModelService } from './trigg-model.service';

describe('ModelServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TriggModelService = TestBed.get(TriggModelService);
    expect(service).toBeTruthy();
  });
});
