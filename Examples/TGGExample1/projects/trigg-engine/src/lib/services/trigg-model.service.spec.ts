import { noolsengine } from './../../../customTypings/nools/index.d';
import { TestBed } from '@angular/core/testing';

import { TriggModelService } from './trigg-model.service';
import { Context, UserContext, Vision } from '../models/Context';
declare var nools: noolsengine;
describe('ModelServiceService', () => {
  beforeEach(
    () => {
      TestBed.configureTestingModule({});
      nools.deleteFlows();
    }
  );

  it('should be created', () => {
    const service: TriggModelService = TestBed.get(TriggModelService);
    expect(service).toBeTruthy();
  });
  it('should load model src and only src', () => {
    const service: TriggModelService = TestBed.get(TriggModelService);
    const srcmodel_ctx = new Context();
    service.pushSrcModel(srcmodel_ctx);
    expect(service.getSrcModel()).toEqual(srcmodel_ctx);
    expect(service.getTrgModel()).toBeUndefined();
  });
  it('loaded model src should not be the inserted but a clone', () => {
    const service: TriggModelService = TestBed.get(TriggModelService);
    const srcmodel_ctx = new Context();
    service.pushSrcModel(srcmodel_ctx);
    expect(service.getSrcModel()).not.toBe(srcmodel_ctx);
    expect(service.getSrcModel()).toEqual(srcmodel_ctx);
  });
  it('the cloning mechanism should work', () => {
    const service: TriggModelService = TestBed.get(TriggModelService);
    const srcmodel_ctx = new Context();
    const clone = (<any>service).clone(srcmodel_ctx);
    expect(clone).toEqual(srcmodel_ctx);
    expect(clone.constructor).toBe(Context);
  });
});
