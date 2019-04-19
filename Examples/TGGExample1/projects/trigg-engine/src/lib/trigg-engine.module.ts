import { TriggEngine } from './trigg-engine';
import { TriggModelService } from './services/trigg-model.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  exports: [],
  providers: [TriggEngine, TriggModelService]
})
export class TriggEngineModule { }
