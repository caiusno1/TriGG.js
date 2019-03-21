import { modelbase } from "./modelbase";

export class Website extends modelbase{
  pages: Page[];
}
export class Page extends modelbase{
  name: string;
}
