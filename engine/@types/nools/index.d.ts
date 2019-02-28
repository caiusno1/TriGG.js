// Type definitions for nools
// Project: http://noolsjs.com/
// Definitions by: Kai Biermeier https://www.kai-biermeier.de
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
export as namespace noolspackage
  export interface noolsengine {
    flow(name: string, callback: (flow: Flow) => void): Flow;
    deleteFlow(name: string): void;
    deleteFlows();
    getFlow(name: string): Flow;
    hasFlow(name: string): boolean;
  }
  export interface Flow {
    rule(name: string, pattern: any[], callback: (facts: any[]|any) => void);
    rule(name: string, config: NoolsRuleConfig , pattern: any[], callback: (facts: any[]|any) => void);
    conflictResolution(strategyOrder: string[]);
    getSession(): Session;
  }
  export interface NoolsRuleConfig {
    agendaGroup: string;
    autoFocus: boolean;
    salience: number;
    scope: any;
  }
  export interface Session {
    assert(fact: object): void;
    match(): Promise<void>;
    match(callback: (err: Error) => void): void;
    retract(fact: object): void;
    modify(fact: object): void;
    getFacts(): any[]|any;
    getFacts(type: any): any[]|any;
    dispose(): void;
    focus(agendaGroupe: string): Session;
    on(event: string, callback: (ruleName) => void);
  }
