import { modelbase } from "./modelbase";
export class Vision extends modelbase {
  value: number;
}
export class UserContext extends modelbase {
  vision: Vision;
}
export class Context extends modelbase {
  userContext: UserContext;
}
export class Message{
  private text: string;
}
