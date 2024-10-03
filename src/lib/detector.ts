import { validateSync } from 'class-validator';

import { ResourceId, ResourceEventDto, Collision, ResourceCollisions } from './types';

export class Detector {
  /**
   * Resource events storage.
   * The goal is to keep the resourceStore for each resource as an array,
   * sorted by startTime ascending.
   */
  public resourceStore: Record<ResourceId, ResourceEventDto[]>;

  /**
   * The only class instance.
   * Part of the singleton implementation.
   */
  private static instance: Detector;

  /**
   * Class constructor.
   * Declared private due to the singleton implementation.
   */
  private constructor() {
    this.resourceStore = {};
  }

  /**
   * Returns the class instance.
   * Implements a singleton.
   */
  public static getInstance(): Detector {
    if (!Detector.instance) {
      Detector.instance = new this();
    }

    return Detector.instance;
  }

  /**
   * Purges the resourceStore object.
   */
  public purgeResourceStore(): void {
    this.resourceStore = {};
  }

  /**
   * Adds a batch of resource events.
   */
  public addResourceEvents(resourceEvents: Record<string, any>[]): number {
    let successfullyAdded = 0;

    for (let i = 0; i < resourceEvents.length; i++) {
      try {
        this.addResourceEvent(resourceEvents[i]);
        successfullyAdded++;
      } catch (error) {
        const msg = `could not insert ${JSON.stringify(resourceEvents[i])} due to ${error}`;
        console.error(`${this.addResourceEvents.name} ${msg}`);
      }
    }

    return successfullyAdded;
  }

  /**
   * Adds a single resource event to the resourceStore.
   * The goal is to keep the resourceStore for each resource as an array,
   * sorted by startTime ascending.
   * Performs input validation, since there's no evidence,
   * that events are arriving from trusted source.
   *
   * Time complexity: O(log n)
   */
  public addResourceEvent(resourceEvent: Record<string, any>): void {
    const dto = new ResourceEventDto(resourceEvent);
    const validationErrors = validateSync(dto);

    if (validationErrors.length !== 0) {
      const errors = JSON.stringify(validationErrors);
      console.error(`${this.addResourceEvent.name} validationErrors: ${errors}`);
      throw new Error(errors);
    }

    if (!this.resourceStore[dto.resourceId]) {
      this.resourceStore[dto.resourceId] = [];
    }

    let lowIndex = 0;
    let highIndex = this.resourceStore[dto.resourceId].length;

    while (lowIndex < highIndex) {
      const medianIndex = this.getMedian(lowIndex, highIndex);

      if (this.resourceStore[dto.resourceId][medianIndex].startTime < dto.startTime) {
        lowIndex = medianIndex + 1;
        continue;
      }

      highIndex = medianIndex;
    }

    this.resourceStore[dto.resourceId].splice(lowIndex, 0, dto);
  }

  /**
   * Determines whether the resource is locked at given time spot.
   *
   * Time complexity: O(log n)
   */
  public isLocked(resourceId: string, time: number): boolean {
    return this._isLocked(resourceId, time);
  }

  /**
   * Determines whether the resource has collision at given time spot.
   * Note, a collision may consist of more than 2 objects.
   * Consult corresponding test cases to see the examples.
   *
   * Time complexity:
   * a. Worst: O(n)
   * b. Best: O(log n)
   */
  public hasCollision(resourceId: string, time: number): boolean {
    const hasCollision = true;
    return this._isLocked(resourceId, time, hasCollision);
  }

  /**
   * The actual implementation of isLocked and hasCollision methods.
   * Consult isLocked and hasCollision docs/comments for more details.
   * Note, each collision may consist of more than 2 objects.
   * Consult corresponding test cases to see the examples.
   */
  private _isLocked(resourceId: string, time: number, hasCollision: boolean = false): boolean {
    if (!this.resourceStore[resourceId]) {
      return false;
    }

    let lowIndex = 0;
    let highIndex = this.resourceStore[resourceId].length;

    while (lowIndex < highIndex) {
      const medianIndex = this.getMedian(lowIndex, highIndex);
      const resourceEvent = this.resourceStore[resourceId][medianIndex];

      if (resourceEvent.isLockedAt(time)) {
        if (hasCollision) {
          // !!!Note, there might be multiple [non]adjacent resource events on given time spot.
          let previousIndex = medianIndex - 1;
          let nextIndex = medianIndex + 1;

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const canIterateDown = previousIndex >= 0;
            const canIterateUp = nextIndex < this.resourceStore[resourceId].length;

            if (canIterateDown) {
              if (this.resourceStore[resourceId][previousIndex--].isLockedAt(time)) {
                return true;
              }
            }

            if (canIterateUp) {
              if (this.resourceStore[resourceId][nextIndex++].isLockedAt(time)) {
                return true;
              }
            }

            if (!canIterateDown && !canIterateUp) {
              // At some point, we'll reach the point where we no longer can iterate neither down nor up.
              // At this point, the conclusion is that the "while (true)" loop ended, and no collision is detected.
              return false;
            }
          }
        }

        return true;
      }

      const middleIsNewHigh = resourceEvent.startTime > time && highIndex !== medianIndex;
      const middleIsNewLow = resourceEvent.endTime < time && lowIndex !== medianIndex;

      if (middleIsNewHigh) {
        highIndex = medianIndex;
      } else if (middleIsNewLow) {
        lowIndex = medianIndex;
      } else {
        break;
      }
    }

    return false;
  }

  /**
   * Returns the first collision on given resource.
   * Otherwise, if no collision found, returns null.
   * Note, each collision may consist of more than 2 objects.
   * Consult corresponding test cases to see the examples.
   *
   * Time complexity:
   * a. Worst: O(n^2)
   * b. Best: O(n)
   */
  public getFirstCollision(resourceId: string): Collision | null {
    const firstOnly = true;
    return this._getCollisions(resourceId, firstOnly) as Collision | null;
  }

  /**
   * Returns all collision on given resource.
   * Otherwise, if no collision found, returns an empty array.
   * Note, each collision may consist of more than 2 objects.
   * Consult corresponding test cases to see the examples.
   *
   * Time complexity: O(n^2)
   */
  public getCollisions(resourceId: string): ResourceCollisions {
    return this._getCollisions(resourceId) as ResourceCollisions;
  }

  /**
   * The actual implementation of getFirstCollision and getCollisions methods.
   * Consult getFirstCollision and getCollisions docs/comments for more details.
   * Note, each collision may consist of more than 2 objects.
   * Consult corresponding test cases to see the examples.
   */
  private _getCollisions(
    resourceId: string,
    firstOnly: boolean = false,
  ): ResourceCollisions | Collision | null {
    if (!this.resourceStore[resourceId]) {
      return firstOnly ? null : [];
    }

    const collisions: ResourceCollisions = [];

    for (let i = 0; i < this.resourceStore[resourceId].length; i++) {
      const resourceEventI = this.resourceStore[resourceId][i];
      const collision: Collision = [resourceEventI];

      for (let j = i + 1; j < this.resourceStore[resourceId].length; j++) {
        const resourceEventJ = this.resourceStore[resourceId][j];
        const collisionDetected =
          resourceEventI.isLockedAt(resourceEventJ.startTime) ||
          resourceEventI.isLockedAt(resourceEventJ.endTime);

        if (collisionDetected) {
          collision.push(resourceEventJ);
        }
      }

      if (collision.length !== 1) {
        // Note, collision.length is at least 1.
        // Hence, if collision.length is greater,
        // then, depending on the value of firstOnly,
        // we can either add a new Collision to the resulting collisions array,
        // or just return that new Collision.
        if (firstOnly) {
          return collision;
        }

        collisions.push(collision);
      }
    }

    return firstOnly ? null : collisions;
  }

  /**
   * Returns a median of 2 numbers.
   */
  public getMedian(low: number, high: number): number {
    return Math.floor((low + high) / 2);
  }
}
