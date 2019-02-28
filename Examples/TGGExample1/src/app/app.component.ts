import { TriggEngine } from './trigg-engine';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'TGGExample1';
  constructor(){
    let engine = new TriggEngine;
    engine.loadRules();
  }
}
