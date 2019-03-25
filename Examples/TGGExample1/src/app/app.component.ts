import { PatterMatcher } from './patter-matcher';
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
  constructor(){
    /*let engine = new TriggEngine;
    engine.loadRules();
    const obj = {root: {'test': '5'}, damm: {prop1: 'testy'}};
    const obj2 = {root: {'test': '7'}, root2: {blindness: 'true'}};
    engine.match(diff(obj, obj2));*/
    const srcmodel_ctx: Context = new Context();
    srcmodel_ctx.userContext = new UserContext();
    srcmodel_ctx.userContext.vision = new Vision();
    srcmodel_ctx.userContext.vision.value = 0.5;

    const trgmodel_ifml: Website = new Website();
    trgmodel_ifml.pages = [];
    trgmodel_ifml.pages.push(new Page());
    trgmodel_ifml.pages[0].name = 'MyWebsite';
    // console.log(srcmodel_ctx.userContext.vision.value == 0.5);
    // console.log(trgmodel_ifml.pages[0].name == 'MyWebsite');
    const ruleset = [
        {
        'name': 'test1',
        'srcblackpattern': [
          [Context, 'ctx'],
          [UserContext, 'uctx', '', 'from ctx.userContext']
        ],
        'srcbrighingEdges': [{
          'node1': 'uctx',
          'node2': 'v',
          'edgeName': 'vision'
        }],
        'srcgreenpattern': [
          [Vision, 'v', 'v.value>0']
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
      }
    ];
    // this.matcher = new PatterMatcher(srcmodel_ctx, trgmodel_ifml, ruleset);
    // this.matcher.srcsession.assert(new Message('hello world'));
    // this.matcher.srcsession.match();
    // this.matcher.srcsession.assert(srcmodel_ctx.userContext.vision);
    console.log(trgmodel_ifml);
    const engine: TriggEngine = new TriggEngine;
    engine.init(srcmodel_ctx, trgmodel_ifml, ruleset);
    engine.forward_sync();
    // console.log(engine.trg[0]);

  }
  public onButton() {
  }
}
