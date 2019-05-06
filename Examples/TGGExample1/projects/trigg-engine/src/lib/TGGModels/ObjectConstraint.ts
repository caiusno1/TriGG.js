export class ObjectContraint{
  temperatur;
  entity;
  operator;
  name;
  value;
  // "Partitially" Blocked
  blockedBy:Set<any>=new Set([]);
}
