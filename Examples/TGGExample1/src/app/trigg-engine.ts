import { isObject } from 'util';
import { PatterMatcher } from './patter-matcher';
export class TriggEngine {
    private patternMatcher: PatterMatcher;
    init(srcmodel, trgmodel, ruleseset) {
        this.patternMatcher = new PatterMatcher(srcmodel, trgmodel, ruleseset);
    }
    addRule() {
        throw new Error('Method not implemented.');
    }
    removeRule() {
        throw new Error('Method not implemented.');
    }
    forward_sync() {
      const trigg = this;
      this.patternMatcher.blackmatch().then(function(items) {
        for (const item of items) {
          console.log(item.name === trigg.patternMatcher.matchSrcGreen(item)[0].rule.name);
          for ( const possibleRuleApplication of trigg.patternMatcher.matchSrcGreen(item)) {
            if (item.name === possibleRuleApplication.rule.name) {
              console.log('possible RuleApplication found!');
              console.table(item.trgmatch);
            }
          }
        }
      });
    }
    cc() {
        throw new Error('Method not implemented.');
    }
    private getDiffPathesFromRoot(diff, chain = '') {
      if (!diff) {
        return undefined;
      } else {
        let pathList = null;
        if (isObject(diff)) {
          pathList = [];
          for (const key in diff) {
            if (isObject(diff[key])) {
              if ('__old' in diff[key] ) {
                return [{path: chain + key, type: 'mod'}];
              } else if (key.includes('__added') ) {
                pathList.push({path: (chain + key).replace('__added', ''), type: 'add'});
              } else if (key.includes('__deleted')) {
                pathList.push({path: (chain + key).replace('__deleted', ''), type: 'rem'});
              } else {
                pathList = pathList.concat(this.getDiffPathesFromRoot(diff[key],  chain + key + '.'));
              }
            }
          }
        }
        return pathList;
      }
    }
}
