import { TGGRule } from 'TriGGEngine/Examples/TGGExample1/projects/trigg-engine/src/lib/TGGModels/TGGRule';
import { NoolsRuleConfig } from '../../customTypings/nools';
import { Session, noolsengine, Flow } from '../../customTypings/nools';
declare var nools: noolsengine;

export class DeclerationRepo {
  public declaredSrc = new Map();
  public declaredTrg = new Map();
  public checkDeclaredSrc(element: any): boolean {
    return this.declaredSrc[element];
  }
  public checkDeclaredTrg(element: any): boolean {
    return this.declaredTrg[element];
  }
}

export class PatterMatcher {
  private srcflow: Flow;
  private trgflow: Flow;
  private srcgreenflow: Flow;
  private trggreenflow: Flow;
  private srcsession: Session;
  public trgsession: Session;
  public srcgreensession: Session;
  private trggreensession: Session;
  private ruleswithoutsrcblack = [];
  private ruleswithouttrgblack = [];
  private applicableRulesSrc = [];
  private applicableRulesTrg = [];
  private applicableFwdSyncRules = [];
  public dcl: DeclerationRepo;
  constructor(ruleseset) {
    this.dcl = new DeclerationRepo;
    this.addrules(ruleseset);

  }
  public blackmatch(): Promise<any[]> {
    // this.applicableRulesSrc = [];
    // this.applicableRulesTrg = [];
    const intersection = [];
    const patternmatcher = this;
    for (const srcrule of this.ruleswithoutsrcblack) {
      for (const trgrule of this.ruleswithouttrgblack) {
        if (srcrule === trgrule) {
          intersection.push({'rule': srcrule});
        }
      }
    }
    let waitforMatch = Promise.all([patternmatcher.srcsession.match(), patternmatcher.trgsession.match()]);
    return waitforMatch.then(function() {
        for (const srcrule of patternmatcher.applicableRulesSrc) {
          for (const trgrule of patternmatcher.applicableRulesTrg) {
            if (srcrule.rule.name === trgrule.rule.name) {
              const srcmatch = srcrule.match;
              const trgmatch = trgrule.match;
              intersection.push({'rule': srcrule.rule,
              'srcmatch': srcmatch,
              'trgmatch': trgmatch,
              'allTrgMatches': patternmatcher.applicableRulesTrg.filter((rule)=>rule.rule.name === srcrule.rule.name)});
              console.log('black match');
            }
          }
        }
        return Promise.resolve(intersection);
      }, function() {return Promise.resolve([])});
  }
  public matchSrcGreen(): Promise<any[]> {
    const patternmatcher = this;
    // this.applicableFwdSyncRules = [];
    return patternmatcher.srcgreensession.match().then(function() {
      return Promise.resolve(patternmatcher.applicableFwdSyncRules);
    });
  }
  public addtrgElement(item) {
    this.trgsession.assert(item);
    this.trggreensession.assert(item);
  }
  public addTrgElementsRecursive(item) {
    for (const singleitem of this.BreadthFirstSearch(item)) {
      this.trgsession.assert(singleitem);
      this.trggreensession.assert(singleitem);
    }
  }
  public addSrcElementsRecursive(item) {
    for (const singleitem of this.BreadthFirstSearch(item)) {
      this.srcsession.assert(singleitem);
      this.srcgreensession.assert(singleitem);
    }
  }
  public removeSrcElements(items) {
    for (const item of items) {
      this.srcsession.retract(item);
      this.srcgreensession.retract(item);
    }
  }
  removeTrgElement(modelTrgElement: any) {
    this.trgsession.retract(modelTrgElement);
    this.trggreensession.retract(modelTrgElement);
  }
  // don't work for not reason?
  public updateRuleSet(ruleseset:TGGRule[]){
    if(nools.hasFlow('src')){
      nools.deleteFlow('src');
      this.srcflow = undefined;
    }
    if(nools.hasFlow('src_green')){
      nools.deleteFlow('src_green');
      this.srcgreenflow = undefined;
    }
    if(nools.hasFlow('trg')){
      nools.deleteFlow('trg');
      this.trgflow = undefined;
    }
    if(nools.hasFlow('trg_green')){
      nools.deleteFlow('trg_green');
      this.trgflow = undefined;
    }
    const srcFacts = this.srcsession.getFacts();
    const srcGreenFacts = this.srcgreensession.getFacts();
    const trgFacts = this.trgsession.getFacts();
    const trgGreenFacts = this.trggreensession.getFacts();
    this.addrules(ruleseset);
    for(const srcFact of srcFacts){
      this.srcsession.assert(srcFact);
    }
    for(const srcGreenFact of srcGreenFacts){
      this.srcgreensession.assert(srcGreenFact);
    }
    for(const trgFact of trgFacts){
      this.trgsession.assert(trgFact);
    }
    for(const trgGreenFact of trgGreenFacts){
      this.trggreensession.assert(trgGreenFact);
    }
  }
  public addRule(rule:TGGRule){
    const srcFacts = this.srcsession.getFacts();
    const srcGreenFacts = this.srcgreensession.getFacts();
    const trgFacts = this.trgsession.getFacts();
    const trgGreenFacts = this.trggreensession.getFacts();
    const noolsConfigSrc: NoolsRuleConfig =
    {scope: {dcl: this.dcl}, agendaGroup: undefined, autoFocus: undefined, salience: undefined};
    const noolsConfigTrg: NoolsRuleConfig =
    {scope: {dcl: this.dcl}, agendaGroup: undefined, autoFocus: undefined, salience: undefined};
    const matcher = this;
    this.srcflow = nools.getFlow('src');
    if (rule.srcblackpattern) {
      if((<any>rule.srcblackpattern).scope){
        delete (<any>rule.srcblackpattern).scope;
      }
      this.srcflow.rule(rule.name + '_src', noolsConfigSrc , rule.srcblackpattern, function(facts) {
        // rewrite match
        matcher.applicableRulesSrc.push({'rule': rule, 'match': facts});
        console.log('srcblackmatch ' + rule.name );
      });
    } else {
      matcher.ruleswithoutsrcblack.push(rule);
    }
    this.trgflow = nools.getFlow('trg')
    if (rule.trgblackpattern) {
      if((<any>rule.trgblackpattern).scope){
        delete (<any>rule.trgblackpattern).scope;
      }
      this.trgflow.rule(rule.name + '_trg', noolsConfigTrg, rule.trgblackpattern, function(facts) {
        // rewrite match
        matcher.applicableRulesTrg.push({'rule': rule, 'match': facts});
        console.log('trgblackmatch ' + rule.name);
      });
    } else {
      matcher.ruleswithouttrgblack.push(rule);
    }
    this.srcgreenflow = nools.getFlow('src_green');
    if (rule.srcgreenpattern) {
      if((<any>rule.srcgreenpattern).scope){
        delete (<any>rule.srcgreenpattern).scope;
      }
      this.srcgreenflow.rule(rule.name + '_src_green', noolsConfigSrc , rule.srcgreenpattern, function(facts) {
        matcher.applicableFwdSyncRules.push({'rule': rule, 'match': facts});
        console.log('srcgreenmatch ' + rule.name);
      });
    }
    this.trggreenflow = nools.getFlow('trg_green');
    if (rule.trggreenpattern) {
      if((<any>rule.trggreenpattern).scope){
        delete (<any>rule.trggreenpattern).scope;
      }
      this.trggreenflow.rule(rule.name + '_trg_green', noolsConfigTrg, rule.trggreenpattern, function(facts) {
        matcher.applicableRulesTrg.push({'rule': rule, 'match': facts});
        console.log('trggreenmatch ' + rule.name);
      });
    }
    this.srcsession = this.srcflow.getSession();
    this.trgsession = this.trgflow.getSession();
    // this.srcsession.assert(this.dcl);
    // this.trgsession.assert(this.dcl);
    this.srcgreensession = this.srcgreenflow.getSession();
    this.trggreensession = this.trggreenflow.getSession();
    for(const srcFact of srcFacts){
      this.srcsession.assert(srcFact);
    }
    for(const srcGreenFact of srcGreenFacts){
      this.srcgreensession.assert(srcGreenFact);
    }
    for(const trgFact of trgFacts){
      this.trgsession.assert(trgFact);
    }
    for(const trgGreenFact of trgGreenFacts){
      this.trggreensession.assert(trgGreenFact);
    }
  }
  private addrules(ruleseset:TGGRule[]) {
    // extract src patterns
    const noolsConfigSrc: NoolsRuleConfig =
    {scope: {dcl: this.dcl}, agendaGroup: undefined, autoFocus: undefined, salience: undefined};
    const noolsConfigTrg: NoolsRuleConfig =
    {scope: {dcl: this.dcl}, agendaGroup: undefined, autoFocus: undefined, salience: undefined};
    const matcher = this;
    this.srcflow = nools.flow('src', function(s) {
      for ( const rule of ruleseset) {
        if (rule.srcblackpattern) {
          if((<any>rule.srcblackpattern).scope){
            delete (<any>rule.srcblackpattern).scope;
          }
          s.rule(rule.name + '_src', noolsConfigSrc , rule.srcblackpattern, function(facts) {
            // rewrite match
            matcher.applicableRulesSrc.push({'rule': rule, 'match': facts});
            console.log('srcblackmatch ' + rule.name );
          });
        } else {
          matcher.ruleswithoutsrcblack.push(rule);
        }
      }
    });
    this.trgflow = nools.flow('trg', function(t) {
      for ( const rule of ruleseset) {
        if (rule.trgblackpattern) {
          if((<any>rule.trgblackpattern).scope){
            delete (<any>rule.trgblackpattern).scope;
          }
          t.rule(rule.name + '_trg', noolsConfigTrg, rule.trgblackpattern, function(facts) {
            // rewrite match
            matcher.applicableRulesTrg.push({'rule': rule, 'match': facts});
            console.log('trgblackmatch ' + rule.name);
          });
        } else {
          matcher.ruleswithouttrgblack.push(rule);
        }
      }
    });
    this.srcgreenflow = nools.flow('src_green', function(s) {
      for ( const rule of ruleseset) {
        if (rule.srcgreenpattern) {
          if((<any>rule.srcgreenpattern).scope){
            delete (<any>rule.srcgreenpattern).scope;
          }
          s.rule(rule.name + '_src_green', noolsConfigSrc , rule.srcgreenpattern, function(facts) {
            // rewrite match
            matcher.applicableFwdSyncRules.push({'rule': rule, 'match': facts});
            console.log('srcgreenmatch ' + rule.name);
          });
        }
      }
    });
    this.trggreenflow = nools.flow('trg_green', function(s) {
      for ( const rule of ruleseset) {
        if (rule.trggreenpattern) {
          if((<any>rule.trggreenpattern).scope){
            delete (<any>rule.trggreenpattern).scope;
          }
          s.rule(rule.name + '_trg_green', noolsConfigTrg, rule.trggreenpattern, function(facts) {
            // rewrite match
            matcher.applicableRulesTrg.push({'rule': rule, 'match': facts});
            console.log('trggreenmatch ' + rule.name);
          });
        }
      }
    });
    this.srcsession = this.srcflow.getSession();
    this.trgsession = this.trgflow.getSession();
    // this.srcsession.assert(this.dcl);
    // this.trgsession.assert(this.dcl);
    this.srcgreensession = this.srcgreenflow.getSession();
    this.trggreensession = this.trggreenflow.getSession();
    // this.srcgreensession.assert(this.dcl);
    // this.trggreensession.assert(this.dcl);

    /*for (const srcelement of this.BreadthFirstSearch(srcmodel)) {
      this.srcsession.assert(srcelement);
    }
    if (trgmodel) {
      for (const trgelement of this.BreadthFirstSearch(trgmodel)) {
        this.trgsession.assert(trgelement);
      }
    }

    for (const srcelement of this.BreadthFirstSearch(srcmodel)) {
      this.srcgreensession.assert(srcelement);
    }
    if (trgmodel) {
      for (const trgelement of this.BreadthFirstSearch(trgmodel)) {
        this.srcgreensession.assert(trgelement);
      }
    }*/
  }
  public clearNonApplicableRulesFromApplicable(){
    this.applicableRulesSrc = this.applicableRulesSrc.filter((posRuleApp)=> {
      let valid = true;
      for(const prop in (<Object>posRuleApp.match)){
        if(prop !== '__i__')
          valid = valid && this.dcl.declaredSrc.get((<Object>posRuleApp.match)[prop])
      }
      return valid;
    });
    this.applicableFwdSyncRules = this.applicableFwdSyncRules.filter((posRuleApp)=> {
      let valid = true;
      for(const prop in (<Object>posRuleApp.match)){
        if(prop !== '__i__')
          valid = valid && this.dcl.declaredSrc.get((<Object>posRuleApp.match)[prop])
      }
      return valid;
    });
  }
  public BreadthFirstSearch(model): any[] {
    const foundNodes = [];
    const nodes2visit = [model];
    while (nodes2visit.length > 0) {
      const node = nodes2visit[0];
      for (const key in node) {
        if (typeof(node[key]) === 'object') {
          if (!(node[key] in foundNodes || node[key] in nodes2visit)) {
            nodes2visit.push(node[key]);
          }
        }
      }
      foundNodes.push(nodes2visit.reverse().pop());
    }
    return foundNodes;
  }
  public removeFromApplicableFwdSyncRules(rule: any) {
    this.applicableFwdSyncRules = this.applicableFwdSyncRules.filter(m => m.rule !== rule);
  }
  public refreshDeclerationSrc() {
    this.srcsession.modify(this.dcl);
    this.srcgreensession.modify(this.dcl);
  }
  public refreshSrcElement( element ){
    this.srcsession.modify(element);
    this.srcgreensession.modify(element);
  }
  public refreshDeclerationTrg() {
    this.trgsession.modify(this.dcl);
    this.trggreensession.modify(this.dcl);
  }
  public refreshTrgElement(element){
    this.trgsession.modify(element);
    this.trggreensession.modify(element);
  }
}
