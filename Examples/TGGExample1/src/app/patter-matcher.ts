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
  private ruleswithoutsrcblack = [];
  private ruleswithouttrgblack = [];
  private applicableRulesSrc = [];
  private applicableRulesTrg = [];
  private applicableFwdSyncRules = [];
  constructor(srcmodel, trgmodel, ruleseset) {
    this.addmodelElements(srcmodel, trgmodel, ruleseset);
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
              intersection.push({'rule': srcrule.rule, 'srcmatch': srcmatch, 'trgmatch': trgmatch});
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
  public addtrgElements(item) {
    this.trgsession.assert(item);
    this.trggreensession.assert(item);
  }
  private addmodelElements(srcmodel, trgmodel, ruleseset) {
    // extract src patterns
    const matcher = this;
    this.srcflow = nools.flow('src', function(s) {
      for ( const rule of ruleseset) {
        if (rule.srcblackpattern) {
          s.rule(rule.name + '_src', rule.srcblackpattern, function(facts) {
            // rewrite match
            matcher.applicableRulesSrc.push({'rule': rule, 'match': facts});
            console.log('srcblackmatch');
          });
        } else {
          matcher.ruleswithoutsrcblack.push(rule);
        }
      }
    });
    this.trgflow = nools.flow('trg', function(t) {
      for ( const rule of ruleseset) {
        if (rule.trgblackpattern) {
          t.rule(rule.name + '_trg', rule.trgblackpattern, function(facts) {
            // rewrite match
            matcher.applicableRulesTrg.push({'rule': rule, 'match': facts});
            console.log('trgblackmatch');
          });
        } else {
          matcher.ruleswithouttrgblack.push(rule);
        }
      }
    });
    this.srcgreenflow = nools.flow('src_green', function(s) {
      for ( const rule of ruleseset) {
        s.rule(rule.name + '_src_green', rule.srcgreenpattern, function(facts) {
          // rewrite match
          matcher.applicableFwdSyncRules.push({'rule': rule, 'match': facts});
          console.log('srcgreenmatch');
        });
      }
    });
    this.trggreenflow = nools.flow('trg_green', function(s) {
      for ( const rule of ruleseset) {
        s.rule(rule.name + '_trg_green', rule.trggreenpattern, function(facts) {
          // rewrite match
          matcher.applicableRulesSrc.push({'rule': rule, 'match': facts});
          console.log('trggreenmatch');
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
