import { ResourceDto } from './resource.dto';

export class Detector {
  resourceStore: Record<string, ResourceDto[]>;
  resourceStore2: Record<string, ResourceDto[]>;

  constructor() {
    this.resourceStore = {};
  }
}
