import { patch } from 'jsondiffpatch';
import { ApplicableRuleApp } from './TGGModels/ApplicableRuleApp';
import { TGGRule, FromLink } from './TGGModels/TGGRule';
import { TriggModelService } from './services/trigg-model.service';
import { RuleApplication } from './models/RuleApplication';
import { PatterMatcher } from './patter-matcher';
import { Injectable } from '@angular/core';
import { TemperatureEnum } from './TGGModels/TemperatureEnum';

(<any>String.prototype).replaceAll = function(search, replacement) {
  const target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

@Injectable({
  providedIn: 'root'
})
export class TriggEngine {
    private patternMatcher: PatterMatcher;
    private src: any[];
    private trg: any[];
    public modelServ: TriggModelService;
    private corrModel;
    private ruleApplications: RuleApplication[] = [];
    private ruleApplicationDict = {};
    private targetingReferencesKey: symbol;
    init(ruleseset, modelServ: TriggModelService) {
        this.patternMatcher = new PatterMatcher(ruleseset);
        this.src = [modelServ.getSrcModel()];
        if (modelServ.getTrgModel()) {
          this.trg = [modelServ.getTrgModel()];
        } else {
          this.trg = [];
        }
        this.modelServ = modelServ;
        // Preprocess for parent nodes
        modelServ.registerSrcDiffBasedSyncronizer(this);
        this.patternMatcher.addSrcElementsRecursive(modelServ.getSrcModel());
        if (modelServ.getTrgModel()) {
          this.patternMatcher.addTrgElementsRecursive(modelServ.getTrgModel());
        }
        this.targetingReferencesKey = Symbol('parent');
    }
    addRule() {
        throw new Error('Method not implemented.');
    }
    removeRule() {
        throw new Error('Method not implemented.');
    }
    forward_sync(srcdiff): Promise<void> {
      // console.log(srcdiff);
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
            // console.log(this.ruleApplicationDict[pdiff.element]);
            this.patternMatcher.refreshSrcElement(pdiff.element);
          }
        }
      }
      return this.fwd_sync(true);
    }
    private rolebackRuleApplicationsRecursive(rApp: RuleApplication) {
      if (rApp) {
        for (const modelTrgElement of rApp.trgElements) {
          if(modelTrgElement){
            this.patternMatcher.removeTrgElement(modelTrgElement);
            if (modelTrgElement[this.targetingReferencesKey]) {
              for (const referencingElementBundle of modelTrgElement[this.targetingReferencesKey]) {
                if (referencingElementBundle.type === 'single') {
                  referencingElementBundle.node[referencingElementBundle.edge] = undefined;
                } else if (referencingElementBundle.type === 'multi') {
                  // filter out modelTrgElement
                  referencingElementBundle.node[referencingElementBundle.edge] =
                  referencingElementBundle.node[referencingElementBundle.edge].filter(modelelement => modelelement !== modelTrgElement);
                }
              }
            }
          }
        }
        for (const modelSrcElement of rApp.srcElements) {
          this.patternMatcher.dcl.declaredSrc[modelSrcElement] = undefined;
        }
        for (const depRuleApplication of rApp.dependentRuleApplications) {
          this.rolebackRuleApplicationsRecursive(depRuleApplication);
        }
      }
    }
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
          changed = trigg.chooseApplicableRule(applicableRules, trigg);
          trigg.modelServ.pushTrgModel(trigg.trg[0]);
          trigg.patternMatcher.clearNonApplicableRulesFromApplicable();
          return trigg.fwd_sync(changed);
      });
    }
    private applyFwdSyncRule(rule: ApplicableRuleApp, trigg) {
      console.log(rule.green.rule.name + ' applied')
      if (rule) {
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
            dependingList.push(trigg.patternMatcher.dcl.declaredTrg[match.srcmatch[trgBlackMatchElement]]);
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
          const newElement = this.createObjectThatFitConstraints(tocreateElement[0], tocreateElement[2], items, tocreateElement[1] );
          rApp.trgElements.push(items[tocreateElement[1]]);

          let connected = false;
          newElement[this.targetingReferencesKey] = [];
          if (match.rule.trgbrighingEdges) {
            for (const edge of match.rule.trgbrighingEdges) {
              if (tocreateElement[1] === edge.node2) {
                connected = true;
                if (Array.isArray(match.trgmatch[edge.node1][edge.edgeName])) {
                  if(match.trgmatch[edge.node1][edge.edgeName].filter(ele => ele.name || ele.name === items[tocreateElement[1]].name ).length>0 && rule.green.rule.temperature === TemperatureEnum.COLD){
                    // This is just a quick and dirty fix (assuming name is unique in a list)
                    return;
                  }
                  match.trgmatch[edge.node1][edge.edgeName].push(items[tocreateElement[1]]);
                  newElement[this.targetingReferencesKey].push({node: match.trgmatch[edge.node1], edge: edge.edgeName, type: 'multi'});
                } else {
                  match.trgmatch[edge.node1][edge.edgeName] = items[tocreateElement[1]] ;
                  newElement[this.targetingReferencesKey].push({node: match.trgmatch[edge.node1], edge: edge.edgeName, type: 'single'});
                }
              }
            }
            if (tocreateElement.length > 4 && tocreateElement[4]) {
              const parentRefByNools = (<FromLink>tocreateElement[4]).from.trim().split('.')[0];
              const parentEdgeRefByNools = (<FromLink>tocreateElement[4]).from.trim().split('.')[1];
              if (parentRefByNools in items) {
                if(Array.isArray(items[parentRefByNools][parentEdgeRefByNools])){
                  items[parentRefByNools][parentEdgeRefByNools].push(newElement);
                } else {
                  items[parentRefByNools][parentEdgeRefByNools] = newElement;
                }
                connected = true;
              }
            }
      }
      this.patternMatcher.dcl.declaredTrg[newElement]=rApp;
      trigg.patternMatcher.addtrgElement(newElement);
      if (connected === false) {
        trigg.trg.push(newElement);
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
    private chooseApplicableRule(rules: ApplicableRuleApp[], trigg){
      // TODO same element check in multiple applicable rules (problem of multiplicity of an generated Element by 2 rules)
      // Solution idea adaptation elements ? 1-1 beziehung to be specific 1-n for possible adaptations
      // TODO multiple apply one rule to all matching elements
      if(rules && rules.length>0){
        const hotRules = rules.filter((rule)=> rule.green.rule.temperature === TemperatureEnum.HOT);
        if(hotRules.length>0){
          rules = hotRules;
        }
        return this.applyFwdSyncRule(rules[0],trigg);
      }
      else{
        return false;
      }
    }
    private createObjectThatFitConstraints(type: any, constraints: string, LokalConstraintObjectSpace: any, name: string) {
      const newElement = new type();
      for (const constraint of constraints.split('&&').map((str: string) => str.trim())) {
        if ( constraint.includes('dcl.declared') || constraint === '' ) {
          continue;
        }
        const pathAndValue = constraint.split(new RegExp('===|==|<=|>=|<|>|!==|!='));
        if(constraint.match('==|===|<|>|<=|>=|!=|!==') && constraint.match('==|===|<|>|<=|>=|!=|!==')[0]){
          const operator = constraint.match('==|===|<|>|<=|>=|!=|!==')[0];
          LokalConstraintObjectSpace[name] = newElement;
          let currentity = LokalConstraintObjectSpace;
          const pathentities = pathAndValue[0].split('.');
          const pathlength = pathentities.length;
          pathentities.pop();
          for (const path of pathentities) {
              currentity = currentity[path];
          }
          //console.log(operator);
          // console.log((pathAndValue[0].split('.')[pathlength - 1]).trim());
          // set constraint value
          if (['==', '===', '<=', '>='].includes(operator)) {
            currentity[(pathAndValue[0].split('.')[pathlength - 1]).trim()] = (<any>pathAndValue[1]).replaceAll('\'', '').trim();
          } else if (['>', '!=', '!=='].includes(operator)) {
            currentity[(pathAndValue[0].split('.')[pathlength - 1]).trim()] = (<any>pathAndValue[1]).replaceAll('\'', '').trim() + 1 ;
          } else {
            currentity[(pathAndValue[0].split('.')[pathlength - 1]).trim()] = (<any>pathAndValue[1]).replaceAll('\'', '').trim() - 1;
          }
        }
      }
      return newElement;
    }
    cc() {
        throw new Error('Method not implemented.');
    }
}
