import { element } from 'protractor';
import { TriggEngine } from './../trigg-engine';
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Subscription } from 'rxjs';
import { diff, patch} from 'jsondiffpatch';

@Injectable({
  providedIn: 'root'
})
export class TriggModelService {
  constructor() { }
  private srcModelProvider: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  private srcDiffProvider: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  private trgModelProvider: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  private trgDiffProvider: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  private afterSync: Subject<void> = new Subject();
  private subscriptions: Subscription[] = [];
  registerSrcService(any) {
    this.subscriptions.push(this.srcModelProvider.subscribe(any));
  }
  registerSrcDiffBasedSyncronizer(any: TriggEngine) {
    const modServ = this;
    this.subscriptions.push(this.srcDiffProvider.subscribe((pdiff) => {
      any.forward_sync(pdiff).then(function() {
        modServ.afterSync.next();
      });
    } ));
  }
  registerTrgService(any) {
    this.subscriptions.push(this.trgModelProvider.subscribe(any));
  }
  registerTrgDiffService(any) {
    this.subscriptions.push(this.trgDiffProvider.subscribe(any));
  }
  registerForAfterSync(any) {
    this.subscriptions.push(this.afterSync.subscribe(any));
  }
  pushSrcModel(srcModel) {
    // model loader needed
    srcModel = this.clone(srcModel);
    const delta = diff(this.srcModelProvider.value, srcModel);
    const diffObj = this.calcDiffElements(delta, this.srcModelProvider.value, srcModel);
    if (diffObj[0] && diffObj[0].root) {
      this.srcModelProvider.next(srcModel);
    } else {
      patch(this.srcModelProvider.value, delta);
      this.srcModelProvider.next(this.srcModelProvider.value);
    }
    this.srcDiffProvider.next(diffObj);
  }
  pushTrgModel(trgModel) {
    trgModel = this.clone(trgModel);
    const delta = diff(this.trgModelProvider.value, trgModel);
    const diffObj = this.calcDiffElements(delta, this.trgModelProvider.value, trgModel);
    if (diffObj[0] && diffObj[0].root) {
      this.trgModelProvider.next(trgModel);
    } else {
      patch(this.trgModelProvider.value, delta);
      this.trgModelProvider.next(this.trgModelProvider.value);
    }
    this.trgDiffProvider.next(diffObj);
  }
  getSrcModel(): Readonly<any> {
    return this.srcModelProvider.value;
  }
  getTrgModel(): Readonly<any> {
    return this.trgModelProvider.value;
  }
  private clone(a) {
    if (a) {
      let theclone = JSON.parse(JSON.stringify(a));
      this.cloneHelper(theclone, a);
      return theclone;
    }
  }
  private cloneHelper(clone, a) {
    Object.setPrototypeOf(clone, Object.getPrototypeOf(a) );
    for (const prop in a) {
      if (typeof(clone[prop]) === 'object') {
        this.cloneHelper(clone[prop], a[prop]);
      }
    }
  }
  private calcDiffElements(pdiff, origin, fork) {
    if (pdiff) {
      // Adress special case that root element was created
      if ('0' in pdiff) {
        return [{type: 'add', element: fork, root : true}];
      }
    }
    return this.calcDiffElementsHelper(pdiff, origin, fork, null, null);
  }
  private calcDiffElementsHelper(pdiff, origin, fork, originParent, originEdge) {
    let diffItems = [];
    if (pdiff) {
      for (const propName in pdiff) {
        if (propName === '_t') {
        } else if (pdiff[propName]) {
          if (pdiff[propName].length != null) {
            if (pdiff[propName].length === 1) {
              // add
              diffItems.push({type: 'add', element: fork[propName]});
            } else if (pdiff[propName].length === 2) {
              // mod
              diffItems.push({type: 'mod', element: origin, parent: originParent, edge: originEdge});
            } else if (pdiff[propName].length === 3) {
              // del
              diffItems.push({type: 'del', element: origin[propName], origin, propName});
            }
          } else {
            diffItems = diffItems.concat(this.calcDiffElementsHelper(pdiff[propName], origin[propName], fork[propName], origin, propName));
          }
        }
      }
    }
    return diffItems;
  }
}
