import { TriggModelService } from './services/trigg-model.service';
import { TriggEngine } from './trigg-engine';
import { noolsengine } from './../../customTypings/nools/index.d';
import { TestBed, async } from '@angular/core/testing';
import { Context, UserContext, Vision } from './models/Context';
import { Website, Page } from './models/Ifml';
declare var nools: noolsengine;
describe('TriggEngine', () => {
  beforeEach(
    () => {
      TestBed.configureTestingModule({});
      nools.deleteFlows();
    }
  );

  it('should be created', () => {
    const service: TriggEngine = TestBed.get(TriggEngine);
    expect(service).toBeTruthy();
  });
  it('check sync in case of init-forward', async (done: DoneFn) => {
    const modServ = TestBed.get(TriggModelService);
    const srcmodel_ctx = new Context();
    srcmodel_ctx.userContext = new UserContext();
    srcmodel_ctx.userContext.vision = new Vision();
    srcmodel_ctx.userContext.vision.value = 0.5;
    const engine: TriggEngine = TestBed.get(TriggEngine);
    const ruleset = [
        {
        'name': 'test1',
        'srcblackpattern': [
          [Context, 'ctx', 'dcl.declaredSrc[ctx]'],
          [UserContext, 'uctx', 'dcl.declaredSrc[uctx]', 'from ctx.userContext']
        ],
        'srcbrighingEdges': [{
          'node1': 'uctx',
          'node2': 'v',
          'edgeName': 'vision'
        }],
        'srcgreenpattern': [
          [Vision, 'v', 'v.value>0 && !dcl.declaredSrc[v]']
        ],
        'trgblackpattern': [
          [Website, 'w', 'w']
        ],
        'trggreenpattern': [
          [Page, 'p', `p.name == 'MyWebsite'`]
        ],
        'trgbrighingEdges': [{
          'node1': 'w',
          'node2': 'p',
          'edgeName': 'pages'
        }],
        'corr': [
          {'refsrc': 'v', 'reftrg': 'p'}
        ]
      },
      {
        'name': 'test2',
        'srcgreenpattern': [
          [Context, 'ctx', '!dcl.declaredSrc[ctx]'],
          [UserContext, 'uctx', '!dcl.declaredSrc[uctx]', 'from ctx.userContext']
        ],
        'trggreenpattern': [
          [Website, 'w', `w.name == 'testWebsite' && !dcl.declaredSrc[w]`]
        ]
      }
    ];
    modServ.pushSrcModel(srcmodel_ctx);
    modServ.pushTrgModel(null);
    const uimodel = new Website();
    uimodel.name = ' testWebsite && !dcl.declaredSrc[w]';
    engine.init(ruleset, modServ);
    engine.forward_sync(null).then(() => {
      engine.forward_sync(null).then(() => {
      expect(engine.modelServ.getTrgModel()).toBeDefined();
      expect(engine.modelServ.getTrgModel().name).toBe(uimodel.name);
      done();
      });
    });
  });
  it('check sync in case of real but simple sync-forward', async (done: DoneFn) => {
    const modServ = TestBed.get(TriggModelService);
    const srcmodel_ctx = new Context();
    srcmodel_ctx.userContext = new UserContext();
    srcmodel_ctx.userContext.vision = new Vision();
    srcmodel_ctx.userContext.vision.value = 0;
    const engine: TriggEngine = TestBed.get(TriggEngine);
    const ruleset = [
        {
        'name': 'test1',
        'srcblackpattern': [
          [Context, 'ctx', 'dcl.declaredSrc[ctx]'],
          [UserContext, 'uctx', 'dcl.declaredSrc[uctx]', 'from ctx.userContext']
        ],
        'srcbrighingEdges': [{
          'node1': 'uctx',
          'node2': 'v',
          'edgeName': 'vision'
        }],
        'srcgreenpattern': [
          [Vision, 'v', 'v.value>0 && !dcl.declaredSrc[v]']
        ],
        'trgblackpattern': [
          [Website, 'w', 'w']
        ],
        'trggreenpattern': [
          [Page, 'p', `p.name == 'MyWebsite'`]
        ],
        'trgbrighingEdges': [{
          'node1': 'w',
          'node2': 'p',
          'edgeName': 'pages'
        }],
        'corr': [
          {'refsrc': 'v', 'reftrg': 'p'}
        ]
      },
      {
        'name': 'test2',
        'srcgreenpattern': [
          [Context, 'ctx', '!dcl.declaredSrc[ctx]'],
          [UserContext, 'uctx', '!dcl.declaredSrc[uctx]', 'from ctx.userContext']
        ],
        'trggreenpattern': [
          [Website, 'w', `w.name == 'testWebsite' && !dcl.declaredSrc[w]`]
        ]
      }
    ];
    modServ.pushSrcModel(srcmodel_ctx);
    modServ.pushTrgModel(null);
    const uimodel = new Website();
    uimodel.name = ' testWebsite && !dcl.declaredSrc[w]';
    engine.init(ruleset, modServ);
    let i = 0;
    engine.modelServ.registerForAfterSync(() => {
      if (i === 0) {
        expect(engine.modelServ.getTrgModel().name).toBeDefined();
        expect(engine.modelServ.getTrgModel().pages).toBeUndefined();
        srcmodel_ctx.userContext.vision.value = 0.5;
        engine.modelServ.pushSrcModel(srcmodel_ctx);
        i++;
      }
      else if(i === 1) {
        expect(engine.modelServ.getTrgModel().pages).toBeDefined();
        done();
      }
    });
  });
});
