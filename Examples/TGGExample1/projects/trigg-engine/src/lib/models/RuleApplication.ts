export class RuleApplication {
  public ruleName: string;
  public srcElements: any[] = [];
  public trgElements: any[] = [];
  public dependentRuleApplications: Set<RuleApplication>;
  constructor() {
    this.dependentRuleApplications = new Set<RuleApplication>();
  }
}
