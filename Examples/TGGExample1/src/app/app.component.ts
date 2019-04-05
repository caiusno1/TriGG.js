import { ModelServiceService } from './services/model-service.service';
import { PatterMatcher, DeclerationRepo } from './patter-matcher';
import { Component } from '@angular/core';
import { Context, Vision, Message, UserContext } from './models/Context';
import { Page, Website } from './models/Ifml';
import { TriggEngine } from './trigg-engine';
import { diff } from 'json-diff';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'TGGExample1';
  matcher: PatterMatcher;
  srcmodel_ctx: Context;
  constructor(private modServ: ModelServiceService) {
    /*let engine = new TriggEngine;
    engine.loadRules();
    const obj = {root: {'test': '5'}, damm: {prop1: 'testy'}};
    const obj2 = {root: {'test': '7'}, root2: {blindness: 'true'}};
    engine.match(diff(obj, obj2));*/
    this.srcmodel_ctx = new Context();
    this.srcmodel_ctx.userContext = new UserContext();
    this.srcmodel_ctx.userContext.vision = new Vision();
    this.srcmodel_ctx.userContext.vision.value = 0.5;
    let trgmodel_ifml = null;
    /*const trgmodel_ifml: Website = new Website();
    trgmodel_ifml.pages = [];
    trgmodel_ifml.pages.push(new Page());
    trgmodel_ifml.pages[0].name = 'MyWebsite';*/
    // console.log(srcmodel_ctx.userContext.vision.value == 0.5);
    // console.log(trgmodel_ifml.pages[0].name == 'MyWebsite');
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
    // this.matcher = new PatterMatcher(srcmodel_ctx, trgmodel_ifml, ruleset);
    // this.matcher.srcsession.assert(new Message('hello world'));
    // this.matcher.srcsession.match();
    // this.matcher.srcsession.assert(srcmodel_ctx.userContext.vision);
    // console.log(trgmodel_ifml);
    const engine: TriggEngine = new TriggEngine;
    modServ.pushSrcModel(this.srcmodel_ctx);
    modServ.pushTrgModel(trgmodel_ifml);
    engine.init(ruleset, modServ);
    // srcmodel_ctx.userContext.vision.value = 0;
    // modServ.pushSrcModel(srcmodel_ctx);

  }
  public onButton() {
    this.srcmodel_ctx.userContext.vision.value = 0;
    this.modServ.pushSrcModel(this.srcmodel_ctx);
  }
}
