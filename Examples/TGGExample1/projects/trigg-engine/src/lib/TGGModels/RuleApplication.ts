import { RuntimeCorrespondensLink } from './RuntimeCorrespondensLink';
import { CorrespondensLink } from './CorrespondensLink';
import { TemperatureEnum } from './TemperatureEnum';
import { ObjectContraint } from './ObjectConstraint';
export class RuleApplication {
  public ruleName: string;
  public ruleTemperature: TemperatureEnum;
  public srcElements: any[] = [];
  public trgElements: any[] = [];
  public corr: RuntimeCorrespondensLink[];
  public dependentRuleApplications: Set<RuleApplication>;
  public constraints: ObjectContraint[] = [];
  constructor() {
    this.dependentRuleApplications = new Set<RuleApplication>();
  }
}
