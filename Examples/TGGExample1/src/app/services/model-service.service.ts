import { element } from 'protractor';
import { TriggEngine } from './../trigg-engine';
import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Subscription } from 'rxjs';
import { diff, patch } from 'jsondiffpatch';

@Injectable({
  providedIn: 'root'
})
export class ModelServiceService {

  constructor() { }
  private srcModelProvider: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  private srcDiffProvider: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  private trgModelProvider: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  private trgDiffProvider: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);
  private subscriptions: Subscription[] = [];
  registerSrcService(any) {
    this.subscriptions.push(this.srcModelProvider.subscribe(any));
  }
  registerSrcDiffBasedSyncronizer(any: TriggEngine) {
    this.subscriptions.push(this.srcDiffProvider.subscribe((pdiff) => {any.forward_sync(pdiff)} ));
  }
  registerTrgService(any) {
    this.subscriptions.push(this.trgModelProvider.subscribe(any));
  }
  registerTrgDiffService(any) {
    this.subscriptions.push(this.trgDiffProvider.subscribe(any));
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
    if (this.trgDiffProvider == null) {
      this.trgDiffProvider = new BehaviorSubject(diffObj);
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
      this.cloneHelper(theclone, a, 0);
      return theclone;
    }
  }
  private cloneHelper(clone, a, depth) {
    // TODO why so depth
    if(clone && depth < 20 ) {
      Object.setPrototypeOf(clone, Object.getPrototypeOf(a) );
          // tslint:disable-next-line:forin
      for (const prop in a) {
        this.cloneHelper(clone[prop], a[prop], depth + 1);
        // else alert(JSON.stringify(clone));
      }
    }
  }
  private calcDiffElements(pdiff, origin, fork) {
    if (pdiff) {
      if ('0' in pdiff) {
        return [{type: 'add', element: fork, root : true}];
      }
    }
    return this.calcDiffElementsHelper(pdiff, origin, fork);
  }
  private calcDiffElementsHelper(pdiff, origin, fork) {
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
              diffItems.push({type: 'mod', element: origin});
            } else if (pdiff[propName].length === 3) {
              // del
              diffItems.push({type: 'add', element: origin[propName]});
            }
          } else {
            diffItems = diffItems.concat(this.calcDiffElements(pdiff[propName], origin[propName], fork[propName]));
          }
        }
      }
    }
    return diffItems;
  }
}
