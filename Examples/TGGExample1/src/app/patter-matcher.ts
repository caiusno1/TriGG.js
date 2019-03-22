import { Session, noolsengine, Flow } from 'customTypings/nools';
declare var nools: noolsengine;
class Rule {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

export class PatterMatcher {
  private corrModel;
  private declaredSrc;
  private declaredTrg;
  private srcflow: Flow;
  private trgflow: Flow;
  private srcgreenflow: Flow;
  private trggreenflow: Flow;
  private srcsession: Session;
  private trgsession: Session;
  // need mixed session i think
  public srcgreensession: Session;
  private trggreensession: Session;
  private applicableRulesSrc = [];
  private applicableRulesTrg = [];
  private applicableFwdSyncRules = [];
  constructor(srcmodel, trgmodel, ruleseset) {
    this.addmodelElements(srcmodel, trgmodel, ruleseset);
  }
  public blackmatch(): Promise<any> {
    this.applicableRulesSrc = [];
    this.applicableRulesTrg = [];
    const patternmatcher = this;
    return this.srcsession.match().then(function()
    {
      return patternmatcher.trgsession.match().then(function() {
        const intersection = [];
        for (const srcrule of patternmatcher.applicableRulesSrc) {
          for (const trgrule of patternmatcher.applicableRulesTrg) {
            if (srcrule.rule.name === trgrule.rule.name) {
              const srcmatch = srcrule.match;
              const trgmatch = trgrule.match;
              intersection.push({'name': srcrule.rule.name, 'srcmatch': srcmatch, 'trgmatch': trgmatch});
            }
          }
        }
        return Promise.resolve(intersection);
      });
    });
  }
  public matchSrcGreen(fact) {
    this.applicableFwdSyncRules = [];
    this.srcgreensession = this.srcgreenflow.getSession();
    for (const key in fact.srcmatch) {
      if (key !== '__i__') {
        this.srcgreensession.assert( fact.srcmatch[key] );
      }
    }
    this.srcgreensession.match();
    return this.applicableFwdSyncRules;
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
    this.srcsession.assert(srcmodel);
    this.trgsession.assert(trgmodel);
    /*for (const srcelement of this.BreadthFirstSearch(srcmodel)) {
      this.srcsession.assert(srcelement);
    }

    for (const trgelement of this.BreadthFirstSearch(trgmodel)) {
      this.trgsession.assert(trgelement);
    }*/
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
