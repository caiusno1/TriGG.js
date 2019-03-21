import { Session, noolsengine } from 'customTypings/nools';
import { isObject } from 'util';
declare var nools: noolsengine;
export class TriggEngine {
    loadRules() {
        throw new Error('Method not implemented.');
    }
    addRule() {
        throw new Error('Method not implemented.');
    }
    removeRule() {
        throw new Error('Method not implemented.');
    }
    forward_sync() {
        throw new Error('Method not implemented.');
    }
    cc() {
        throw new Error('Method not implemented.');
    }
    match(diff) {
      // console.log(JSON.stringify(diff));
      console.log(JSON.stringify(this.getDiffPathesFromRoot(diff)));
      // TODO get involved rules
      // revoke delete based
      // match with rule engine (not currently corr related elements? for future maybe)
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
