import { ModelServiceService } from './services/model-service.service';
import { RuleApplication } from './models/RuleApplication';
import { isObject } from 'util';
import { PatterMatcher } from './patter-matcher';
export class TriggEngine {
    private patternMatcher: PatterMatcher;
    private src: any[];
    private trg: any[];
    public modelServ: ModelServiceService;
    private corrModel;
    private ruleApplications: RuleApplication[] = [];
    private ruleApplicationDict = {};
    init(ruleseset, modelServ: ModelServiceService) {
        this.patternMatcher = new PatterMatcher(ruleseset);
        this.src = [modelServ.getSrcModel()];
        if (modelServ.getTrgModel()) {
          this.trg = [modelServ.getTrgModel()];
        } else {
          this.trg = [];
        }
        this.modelServ = modelServ;
        modelServ.registerSrcDiffBasedSyncronizer(this);
        this.patternMatcher.addSrcElementsRecursive(modelServ.getSrcModel());
        if (modelServ.getTrgModel()) {
          this.patternMatcher.addTrgElementsRecursive(modelServ.getTrgModel());
        }
    }
    addRule() {
        throw new Error('Method not implemented.');
    }
    removeRule() {
        throw new Error('Method not implemented.');
    }
    forward_sync(srcdiff): Promise<void> {
      console.log(srcdiff);
      if (srcdiff) {
        for (const pdiff of srcdiff) {
          if (pdiff.type === 'del' || pdiff.type === 'mod') {
            const delRuleApplication = this.ruleApplicationDict[pdiff.element];
            this.rolebackRuleApplicationsRecursive(delRuleApplication);
          }
          if (pdiff.type === 'add' || pdiff.type === 'mod') {
            this.patternMatcher.addSrcElementsRecursive(pdiff.element);
          }
          if (pdiff.type === 'mod') {
            console.log(this.ruleApplicationDict[pdiff.element]);
            this.patternMatcher.refreshSrcElement(pdiff.element);
          }
        }
      }
      return this.fwd_sync(true);
    }
    private rolebackRuleApplicationsRecursive(rApp: RuleApplication) {
      for (const modelTrgElement of rApp.trgElements) {
        this.patternMatcher.removeTrgElement(modelTrgElement);
        // remove from container ?;
      }
      for (const modelSrcElement of rApp.srcElements) {
        this.patternMatcher.dcl.declaredSrc[modelSrcElement] = undefined;
      }
      for (const depRuleApplication of rApp.dependentRuleApplications) {
        this.rolebackRuleApplicationsRecursive(depRuleApplication);
      }
    }
    /*private getElementByPathOfModel(path, model) {
      const pathelements = path.split('.');
      let pathelement = model[pathelements[0]];
      let pathindex = 1;
      while (pathelement !== undefined && pathindex < pathelements.length) {
        pathelement = pathelement = pathelement[pathelements[pathindex]];
        pathindex++;
      }
      return pathelement;
    }*/
    private fwd_sync(changed): Promise<void> {
      const trigg = this;
      if (changed === false) {
        return Promise.resolve();
      }
      changed = false;
      // todo implement roleback & add, remove and modify nools modelelements
      return Promise.all([trigg.patternMatcher.blackmatch(), trigg.patternMatcher.matchSrcGreen()]).then(function(matches) {
          const applicableRules = [];
          for (const match of matches[0]) {
            for (const green of matches[1]) {
              if (match.rule.name === green.rule.name) {
                let alledgesMatching = true;
                if (match.rule.srcbrighingEdges) {
                  for (const edge of match.rule.srcbrighingEdges) {
                    alledgesMatching = alledgesMatching && match.srcmatch[edge.node1][edge.edgeName] === green.match[edge.node2];
                  }
                }
                if (alledgesMatching) {
                  applicableRules.push({match: match, green: green});
                }
              }
            }
          }
          changed = trigg.applyFwdSyncRule(applicableRules, trigg);
          trigg.modelServ.pushTrgModel(trigg.trg[0]);
          if (!changed) {
            // console.log(trigg.trg);
            console.log(trigg.modelServ.getTrgModel());
          }
          return trigg.fwd_sync(changed);
      });
    }
    private applyFwdSyncRule(rules, trigg) {
      if (rules && rules[0]) {
        const rule = rules[0];
        const match = rule.match;
        const green = rule.green;
        const items = {};
        const rApp = new RuleApplication;
        const dependingList = [];
        for (const srcBlackMatchElement in match.srcmatch) {
          if (srcBlackMatchElement !== '__i__') {
            dependingList.push(trigg.patternMatcher.dcl.declaredSrc[match.srcmatch[srcBlackMatchElement]]);
          }
        }
        for (const trgBlackMatchElement in match.trgmatch) {
          if (trgBlackMatchElement !== '__i__') {
            dependingList.push(trigg.patternMatcher.dcl.declaredSrc[match.srcmatch[trgBlackMatchElement]]);
          }
        }
        rApp.ruleName = match.rule.name;
        trigg.patternMatcher.removeFromApplicableFwdSyncRules(green.rule);
        for (const element in green.match) {
          if (element !== '__i__') {
            const srceelement = green.match[element];
            rApp.srcElements.push(srceelement);
            trigg.ruleApplicationDict[srceelement] = rApp;
            trigg.patternMatcher.dcl.declaredSrc[srceelement] = rApp;
            trigg.patternMatcher.refreshSrcElement(srceelement);
          }
        }
        for (const tocreateElement of match.rule.trggreenpattern) {
          items[tocreateElement[1]] = new tocreateElement[0]();
          rApp.trgElements.push(items[tocreateElement[1]]);
          trigg.patternMatcher.dcl.declaredTrg[items[tocreateElement[1]]] = rApp;
          // trigg.patternMatcher.refreshDeclerationTrg();
          const pathAndValue = tocreateElement[2].split('==');
          let currentity = items;
          const pathentities = pathAndValue[0].split('.');
          const pathlength = pathentities.length;
          pathentities.pop();
          for (const path of pathentities) {
            currentity = currentity[path];
          }
          currentity[pathAndValue[0].split('.')[pathlength - 1]] = pathAndValue[1];
          let connected = false;
          if(match.rule.trgbrighingEdges) {
            for (const edge of match.rule.trgbrighingEdges) {
              if (tocreateElement[1] === edge.node2) {
                connected = true;
                if (Array.isArray(match.trgmatch[edge.node1][edge.edgeName])) {
                  match.trgmatch[edge.node1][edge.edgeName].push(currentity);
                } else {
                  match.trgmatch[edge.node1][edge.edgeName] = currentity ;
                }
              }
            }
          }
          trigg.patternMatcher.addtrgElement(currentity);
          if (connected === false) {
            trigg.trg.push(currentity);
          }
        }
        const dependingSet = new Set<RuleApplication>(dependingList);
        for (const dependentElement of dependingSet) {
          if (dependentElement) {
            dependentElement.dependentRuleApplications.add(rApp);
          }
        }
        return true;
      } else {
        return false;
      }
    }
    cc() {
        throw new Error('Method not implemented.');
    }
}
