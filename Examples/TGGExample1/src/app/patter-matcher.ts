import { Session, noolsengine, Flow } from 'customTypings/nools';
declare var nools: noolsengine;
class Rule {
  name: string;
  constructor(name: string) {
    this.name = name;
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
  private applicableRulesSrc = [];
  private applicableRulesTrg = [];
  private applicableFwdSyncRules = [];
  constructor(srcmodel, trgmodel, ruleseset) {
    this.addmodelElements(srcmodel, trgmodel, ruleseset);
  }
  public blackmatch(): any[] {
    this.applicableRulesSrc = [];
    this.applicableRulesTrg = [];
    this.srcsession.match();
    this.trgsession.match();
    const intersection = [];
    for (const srcrule of this.applicableRulesSrc) {
      for (const trgrule of this.applicableRulesTrg) {
        if (srcrule.rule.name === trgrule.rule.name) {
          const srcmatch = srcrule.match;
          const trgmatch = trgrule.match;
          intersection.push({'rule': srcrule.rule, 'srcmatch': srcmatch, 'trgmatch': trgmatch});
        }
      }
    }
    return intersection;
  }
  public matchSrcGreen(): any[] {
    this.applicableFwdSyncRules = [];
    this.srcgreensession.match();
    return this.applicableFwdSyncRules;
  }
  public addtrgElements(item) {
    this.trgsession.assert(item);
    this.trggreensession.assert(item);
  }
  private addmodelElements(srcmodel, trgmodel, ruleseset) {
    // extract src patterns
    const matcher = this;
    this.srcflow = nools.flow('src', function(s) {
      for ( const rule of ruleseset) {
        s.rule(rule.name + '_src', rule.srcblackpattern, function(facts) {
          // rewrite match
          matcher.applicableRulesSrc.push({'rule': rule, 'match': facts});
        });
      }
    });
    this.trgflow = nools.flow('trg', function(t) {
      for ( const rule of ruleseset) {
        t.rule(rule.name + '_trg', rule.trgblackpattern, function(facts) {
          // rewrite match
          matcher.applicableRulesTrg.push({'rule': rule, 'match': facts});
        });
      }
    });
    this.srcgreenflow = nools.flow('src_green', function(s) {
      for ( const rule of ruleseset) {
        s.rule(rule.name + '_src_green', rule.srcgreenpattern, function(facts) {
          // rewrite match
          matcher.applicableFwdSyncRules.push({'rule': rule, 'match': facts});
        });
      }
    });
    this.trggreenflow = nools.flow('trg_green', function(s) {
      for ( const rule of ruleseset) {
        s.rule(rule.name + '_trg_green', rule.trggreenpattern, function(facts) {
          // rewrite match
          matcher.applicableRulesSrc.push({'rule': rule, 'match': facts});
        });
      }
    });
    this.srcsession = this.srcflow.getSession();
    this.trgsession = this.trgflow.getSession();
    this.srcgreensession = this.srcgreenflow.getSession();
    this.trggreensession = this.trggreenflow.getSession();

    for (const srcelement of this.BreadthFirstSearch(srcmodel)) {
      this.srcsession.assert(srcelement);
    }

    for (const trgelement of this.BreadthFirstSearch(trgmodel)) {
      this.trgsession.assert(trgelement);
    }

    for (const srcelement of this.BreadthFirstSearch(srcmodel)) {
      this.srcgreensession.assert(srcelement);
    }

    for (const trgelement of this.BreadthFirstSearch(trgmodel)) {
      this.srcgreensession.assert(trgelement);
    }
  }
  public BreadthFirstSearch(model): any[] {
    const foundNodes = [];
    const nodes2visit = [model];
    while (nodes2visit.length > 0) {
      const node = nodes2visit[0];
      for(const key in node) {
        if (typeof(node[key]) === 'object') {
          if(!(node[key] in foundNodes || node[key] in nodes2visit)) {
            nodes2visit.push(node[key]);
          }
        }
      }
      foundNodes.push(nodes2visit.reverse().pop());
    }
    return foundNodes;
  }
}
