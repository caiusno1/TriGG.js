import { modelbase } from "./modelbase";

export class Website extends modelbase {
  pages: Page[];
  name: string;
}
export class Page extends modelbase {
  name: string;
}
