import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TriggEngineModule } from 'projects/trigg-engine/src/public_api';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule, TriggEngineModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
