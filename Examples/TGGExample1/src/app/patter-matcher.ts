import { Session, noolsengine, Flow } from 'customTypings/nools';
declare var nools: noolsengine;
export class PatterMatcher {
  private corrModel;
  private declaredSrc;
  private declaredTrg;
  private srcflow: Flow;
  private trgflow: Flow;
  public srcsession: Session;
  private trgsession: Session;
  private applicableRulesSrc = [];
  private applicableRulesTrg = [];
  constructor(srcmodel, trgmodel, ruleseset) {
    this.addmodelElements(srcmodel, trgmodel, ruleseset);
  }
  public match(): Promise<any> {
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
  private addmodelElements(srcmodel, trgmodel, ruleseset) {
    // extract src patterns
    const matcher = this;
    this.srcflow = nools.flow('src', function(s) {
      for ( const rule of ruleseset) {
        s.rule(rule.name + '_src', rule.srcpattern, function(facts) {
          // rewrite match
          matcher.applicableRulesSrc.push({'rule': rule, 'match': facts});
        });
      }
    });
    this.trgflow = nools.flow('trg', function(t) {
      for ( const rule of ruleseset) {
        t.rule(rule.name + '_trg', rule.trgpattern, function(facts) {
          // rewrite match
          matcher.applicableRulesTrg.push({'rule': rule, 'match': facts});
        });
      }
    });
    this.srcsession = this.srcflow.getSession();
    this.trgsession = this.trgflow.getSession();

    for (const srcelement of this.BreadthFirstSearch(srcmodel)) {
      this.srcsession.assert(srcelement);
    }

    for (const trgelement of this.BreadthFirstSearch(trgmodel)) {
      this.trgsession.assert(trgelement);
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
