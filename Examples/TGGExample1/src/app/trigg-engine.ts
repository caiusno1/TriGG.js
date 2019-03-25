import { isObject } from 'util';
import { PatterMatcher } from './patter-matcher';
export class TriggEngine {
    private patternMatcher: PatterMatcher;
    public src: any[];
    public trg: any[];
    private corrModel;
    private declaredSrc;
    private declaredTrg;
    init(srcmodel, trgmodel, ruleseset) {
        this.patternMatcher = new PatterMatcher(srcmodel, trgmodel, ruleseset);
        this.src = [srcmodel];
        this.trg = [trgmodel];
    }
    addRule() {
        throw new Error('Method not implemented.');
    }
    removeRule() {
        throw new Error('Method not implemented.');
    }
    forward_sync() {
      const trigg = this;
      const blackmatches = this.patternMatcher.blackmatch();
      const srcgreenmatches = this.patternMatcher.matchSrcGreen();
      for (const match of blackmatches) {
        for (const green of srcgreenmatches) {
          if (match.rule.name === green.rule.name) {
            let alledgesMatching = true;
            for (const edge of match.rule.srcbrighingEdges) {
              alledgesMatching = alledgesMatching && match.srcmatch[edge.node1][edge.edgeName] === green.match[edge.node2];
            }
            if (alledgesMatching) {
              const items = {};
              for (const tocreateElement of match.rule.trggreenpattern) {
                items[tocreateElement[1]] = new tocreateElement[0]();
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
                this.patternMatcher.addtrgElements(currentity);
                if (connected === false) {
                  this.trg.push(currentity);
                }
              }
            }
          }
        }
      }
    }
    cc() {
        throw new Error('Method not implemented.');
    }
    /* private getDiffPathesFromRoot(diff, chain = '') {
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
    }*/
}
