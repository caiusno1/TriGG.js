import { TemperatureEnum } from "./TemperatureEnum";
import { BridgingEdge } from "./BridgingEdge";
import { CorrespondensLink } from "./CorrespondensLink";

type Class = { new(...args: any[]): any; };
export class TGGRule{
  name:string;
  temperature:TemperatureEnum;
  srcblackpattern?:([Class,string,string,string|FromLink]|[Class,string,null,string,string|FromLink]|[Class,string,string])[];
  srcgreenpattern:([Class,string,string,string|FromLink]|[Class,string,null,string,string|FromLink]|[Class,string,string])[];
  srcbrighingEdges?:BridgingEdge[]|undefined;
  trgblackpattern?:([Class,string,string,string|FromLink]|[Class,string,null,string,string|FromLink]|[Class,string,string])[];
  trggreenpattern:([Class,string,string,string|FromLink]|[Class,string,null,string,string|FromLink]|[Class,string,string])[];
  trgbrighingEdges?:BridgingEdge[]|undefined;
  corr?:CorrespondensLink[];
}
export class FromLink{
  from;
}
