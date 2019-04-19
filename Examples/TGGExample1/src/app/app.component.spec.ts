import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { noolsengine } from '../../projects/trigg-engine/customTypings/nools';
declare var nools: noolsengine;
describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
    }).compileComponents();
    nools.deleteFlows();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
  it(`should have as title 'TGGExample1'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('TGGExample1');
  }));
});
