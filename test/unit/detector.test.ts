import { describe, it, expect, afterEach } from '@jest/globals';
import { v4 as uuidV4 } from 'uuid';

import { Detector, ResourceEventDto } from '../../src';

describe('detector tests', (): void => {
  const resourceId = uuidV4();
  const detector = Detector.getInstance();

  describe('addResource tests', (): void => {
    afterEach((): void => {
      detector.purgeResourceStore();
    });

    it('should successfully insert 5 out of 7 resource events, due to validation errors in 2 of them', (): void => {
      // Arrange.
      const nowMills = new Date().getTime();
      const resources = [
        { resourceId, startTime: nowMills + 120, endTime: nowMills + 123 },
        { resourceId, startTime: nowMills, endTime: nowMills + 1 },
        { resourceId, startTime: nowMills + 110, endTime: nowMills + 114 },
        { resourceId, startTime: nowMills + 115, endTime: nowMills + 114 }, // Note, startTime is greater than endTime.
        { resourceId, startTime: nowMills + 100, endTime: nowMills + 102 },
        { resourceId, startTime: nowMills + 134, endTime: nowMills + 135 },
        { resourceId, startTime: nowMills + 134.1, endTime: nowMills + 135 }, // Note, startTime is float.
      ];

      // Act.
      const successfullyAdded = detector.addResourceEvents(resources);

      // Assert.
      expect(successfullyAdded).toBe(5);
      expect(detector.resourceStore).not.toStrictEqual({ [resourceId]: resources });
      expect(detector.resourceStore).toStrictEqual({
        [resourceId]: [
          new ResourceEventDto({ resourceId, startTime: nowMills, endTime: nowMills + 1 }),
          new ResourceEventDto({ resourceId, startTime: nowMills + 100, endTime: nowMills + 102 }),
          new ResourceEventDto({ resourceId, startTime: nowMills + 110, endTime: nowMills + 114 }),
          new ResourceEventDto({ resourceId, startTime: nowMills + 120, endTime: nowMills + 123 }),
          new ResourceEventDto({ resourceId, startTime: nowMills + 134, endTime: nowMills + 135 }),
        ],
      });
    });
  });

  describe('isLocked tests', (): void => {
    afterEach((): void => {
      detector.purgeResourceStore();
    });

    it('should successfully determine whether the resource is locked at given time spot', (): void => {
      // Arrange.
      const resources = [
        { resourceId, startTime: 120, endTime: 123 },
        { resourceId, startTime: 1, endTime: 2 },
        { resourceId, startTime: 110, endTime: 114 },
        { resourceId, startTime: 100, endTime: 102 },
        { resourceId, startTime: 134, endTime: 135 },
        { resourceId, startTime: 134, endTime: 135 },
      ];

      // Act.
      detector.addResourceEvents(resources);
      const isLocked0 = detector.isLocked(resourceId, 1);
      const isLocked1 = detector.isLocked(resourceId, 2);
      const isLocked112 = detector.isLocked(resourceId, 112);
      const isLocked114 = detector.isLocked(resourceId, 114);
      const isLocked115 = detector.isLocked(resourceId, 115);
      const isLockedNoResource = detector.isLocked(uuidV4(), 1);

      // Assert.
      expect(isLocked0).toBe(true);
      expect(isLocked1).toBe(true);
      expect(isLocked112).toBe(true);
      expect(isLocked114).toBe(true);
      expect(isLocked115).toBe(false);
      expect(isLockedNoResource).toBe(false);
    });
  });

  describe('hasCollision tests', (): void => {
    afterEach((): void => {
      detector.purgeResourceStore();
    });

    it('should successfully determine whether the resource collides with others', (): void => {
      // Arrange.
      const resources = [
        { resourceId, startTime: 1, endTime: 2 },
        { resourceId, startTime: 100, endTime: 102 },
        { resourceId, startTime: 99, endTime: 100 },
        { resourceId, startTime: 990, endTime: 1000 },
        { resourceId, startTime: 100, endTime: 100 },
        { resourceId, startTime: 100, endTime: 102 },
        { resourceId, startTime: 99, endTime: 101 },
        { resourceId, startTime: 114, endTime: 135 },
        { resourceId, startTime: 116, endTime: 130 },
        { resourceId, startTime: 118, endTime: 130 },
        { resourceId, startTime: 134, endTime: 135 },
        { resourceId, startTime: 100, endTime: 101 },
        { resourceId, startTime: 990, endTime: 1101 },
        { resourceId, startTime: 102, endTime: 102 },
        { resourceId, startTime: 102, endTime: 103 },
      ];

      // Act.
      detector.addResourceEvents(resources);
      const hasCollision = detector.hasCollision(resourceId, 1);
      const hasCollision2 = detector.hasCollision(resourceId, 2);
      const hasCollision22 = detector.hasCollision(resourceId, 22);
      const hasCollision99 = detector.hasCollision(resourceId, 99);
      const hasCollision100 = detector.hasCollision(resourceId, 100);
      const hasCollision101 = detector.hasCollision(resourceId, 101);
      const hasCollision102 = detector.hasCollision(resourceId, 102);
      const hasCollision103 = detector.hasCollision(resourceId, 103);
      const hasCollision134 = detector.hasCollision(resourceId, 134);
      const hasCollision1000 = detector.hasCollision(resourceId, 1000);
      const hasCollision1100 = detector.hasCollision(resourceId, 1100);

      // Assert.
      expect(hasCollision).toBe(false);
      expect(hasCollision2).toBe(false);
      expect(hasCollision22).toBe(false);
      expect(hasCollision99).toBe(true);
      expect(hasCollision100).toBe(true);
      expect(hasCollision101).toBe(true);
      expect(hasCollision102).toBe(true);
      expect(hasCollision102).toBe(true);
      expect(hasCollision103).toBe(false);
      expect(hasCollision134).toBe(true);
      expect(hasCollision1000).toBe(true);
      expect(hasCollision1100).toBe(false);
    });
  });

  describe('getFirstCollision tests', (): void => {
    afterEach((): void => {
      detector.purgeResourceStore();
    });

    it('should determine there are no collisions', (): void => {
      // Arrange.
      const resources = [
        { resourceId, startTime: 100, endTime: 102 },
        { resourceId, startTime: 110, endTime: 114 },
        { resourceId, startTime: 120, endTime: 123 },
        { resourceId, startTime: 134, endTime: 135 },
      ];

      // Act.
      detector.addResourceEvents(resources);
      const firstCollision = detector.getFirstCollision(resourceId);

      // Assert.
      expect(firstCollision === null).toBe(true);
    });

    it('should successfully determine the first collision; case 1', (): void => {
      // Arrange.
      const resources = [
        { resourceId, startTime: 1, endTime: 2 },
        { resourceId, startTime: 99, endTime: 100 },
        { resourceId, startTime: 99, endTime: 101 },
        { resourceId, startTime: 100, endTime: 102 },
        { resourceId, startTime: 100, endTime: 102 },
        { resourceId, startTime: 100, endTime: 101 },
        { resourceId, startTime: 102, endTime: 103 },
        { resourceId, startTime: 114, endTime: 135 },
        { resourceId, startTime: 116, endTime: 130 },
        { resourceId, startTime: 118, endTime: 130 },
        { resourceId, startTime: 134, endTime: 135 },
        { resourceId, startTime: 990, endTime: 1000 },
        { resourceId, startTime: 990, endTime: 1101 },
      ];

      // Act.
      detector.addResourceEvents(resources);
      const firstCollision = detector.getFirstCollision(resourceId);

      // Assert.
      expect(firstCollision).toStrictEqual([
        new ResourceEventDto({ resourceId, startTime: 99, endTime: 101 }),
        new ResourceEventDto({ resourceId, startTime: 99, endTime: 100 }),
        new ResourceEventDto({ resourceId, startTime: 100, endTime: 101 }),
        new ResourceEventDto({ resourceId, startTime: 100, endTime: 102 }),
        new ResourceEventDto({ resourceId, startTime: 100, endTime: 102 }),
      ]);
    });

    it('should successfully determine the first collision; case 2', (): void => {
      // Arrange.
      const resources = [
        { resourceId, startTime: 1, endTime: 2 },
        { resourceId, startTime: 9, endTime: 10 },
        { resourceId, startTime: 11, endTime: 12 },
        { resourceId, startTime: 13, endTime: 14 },
        { resourceId, startTime: 15, endTime: 16 },
        { resourceId, startTime: 17, endTime: 18 },
        { resourceId, startTime: 102, endTime: 989 },
        { resourceId, startTime: 114, endTime: 135 },
        { resourceId, startTime: 116, endTime: 130 },
        { resourceId, startTime: 118, endTime: 130 },
        { resourceId, startTime: 134, endTime: 135 },
        { resourceId, startTime: 990, endTime: 1000 },
        { resourceId, startTime: 990, endTime: 1101 },
      ];

      // Act.
      detector.addResourceEvents(resources);
      const firstCollision = detector.getFirstCollision(resourceId);

      // Assert.
      expect(firstCollision).toStrictEqual([
        new ResourceEventDto({ resourceId, startTime: 102, endTime: 989 }),
        new ResourceEventDto({ resourceId, startTime: 114, endTime: 135 }),
        new ResourceEventDto({ resourceId, startTime: 116, endTime: 130 }),
        new ResourceEventDto({ resourceId, startTime: 118, endTime: 130 }),
        new ResourceEventDto({ resourceId, startTime: 134, endTime: 135 }),
      ]);
    });

    it('should successfully determine the first collision; case 3', (): void => {
      // Arrange.
      const resources = [
        { resourceId, startTime: 1, endTime: 2 },
        { resourceId, startTime: 9, endTime: 10 },
        { resourceId, startTime: 11, endTime: 12 },
        { resourceId, startTime: 13, endTime: 14 },
        { resourceId, startTime: 15, endTime: 16 },
        { resourceId, startTime: 17, endTime: 18 },
        { resourceId, startTime: 102, endTime: 105 },
        { resourceId, startTime: 114, endTime: 115 },
        { resourceId, startTime: 116, endTime: 130 },
        { resourceId, startTime: 132, endTime: 133 },
        { resourceId, startTime: 134, endTime: 135 },
        { resourceId, startTime: 880, endTime: 1001 },
        { resourceId, startTime: 990, endTime: 1000 },
        { resourceId, startTime: 990, endTime: 1101 },
      ];

      // Act.
      detector.addResourceEvents(resources);
      const firstCollision = detector.getFirstCollision(resourceId);

      // Assert.
      expect(firstCollision).toStrictEqual([
        new ResourceEventDto({ resourceId, startTime: 880, endTime: 1001 }),
        new ResourceEventDto({ resourceId, startTime: 990, endTime: 1101 }),
        new ResourceEventDto({ resourceId, startTime: 990, endTime: 1000 }),
      ]);
    });

    it('should successfully determine the first collision; case 4', (): void => {
      // Arrange.
      const resources = [
        { resourceId, startTime: 1, endTime: 2 },
        { resourceId, startTime: 9, endTime: 10 },
        { resourceId, startTime: 11, endTime: 12 },
        { resourceId, startTime: 13, endTime: 14 },
        { resourceId, startTime: 15, endTime: 16 },
        { resourceId, startTime: 15, endTime: 18 },
        { resourceId, startTime: 17, endTime: 18 },
        { resourceId, startTime: 102, endTime: 105 },
        { resourceId, startTime: 114, endTime: 115 },
        { resourceId, startTime: 116, endTime: 130 },
        { resourceId, startTime: 132, endTime: 133 },
        { resourceId, startTime: 134, endTime: 135 },
        { resourceId, startTime: 880, endTime: 891 },
        { resourceId, startTime: 990, endTime: 995 },
        { resourceId, startTime: 1020, endTime: 1101 },
      ];

      // Act.
      detector.addResourceEvents(resources);
      const firstCollision = detector.getFirstCollision(resourceId);

      // Assert.
      expect(firstCollision).toStrictEqual([
        new ResourceEventDto({ resourceId, startTime: 15, endTime: 18 }),
        new ResourceEventDto({ resourceId, startTime: 15, endTime: 16 }),
        new ResourceEventDto({ resourceId, startTime: 17, endTime: 18 }),
      ]);
    });
  });

  describe('getCollisions tests', (): void => {
    afterEach((): void => {
      detector.purgeResourceStore();
    });

    it('should determine no collisions', (): void => {
      // Arrange.
      const resources = [
        { resourceId, startTime: 100, endTime: 102 },
        { resourceId, startTime: 110, endTime: 114 },
        { resourceId, startTime: 120, endTime: 123 },
        { resourceId, startTime: 134, endTime: 135 },
      ];

      // Act.
      detector.addResourceEvents(resources);
      const collisions = detector.getCollisions(resourceId);

      // Assert.
      expect(collisions).toStrictEqual([]);
    });

    it('should successfully determine all collisions; case 1', (): void => {
      // Arrange.
      const resources = [
        { resourceId, startTime: 15, endTime: 18 },
        { resourceId, startTime: 15, endTime: 16 },
        { resourceId, startTime: 1, endTime: 2 },
        { resourceId, startTime: 11, endTime: 12 },
        { resourceId, startTime: 13, endTime: 18 },
        { resourceId, startTime: 17, endTime: 18 },
        { resourceId, startTime: 9, endTime: 10 },
        { resourceId, startTime: 134, endTime: 135 },
        { resourceId, startTime: 880, endTime: 1001 },
        { resourceId, startTime: 990, endTime: 1000 },
        { resourceId, startTime: 102, endTime: 105 },
        { resourceId, startTime: 132, endTime: 133 },
        { resourceId, startTime: 990, endTime: 1101 },
        { resourceId, startTime: 114, endTime: 115 },
        { resourceId, startTime: 1101, endTime: 1108 },
        { resourceId, startTime: 116, endTime: 130 },
        { resourceId, startTime: 1109, endTime: 1118 },
      ];

      // Act.
      detector.addResourceEvents(resources);
      const collisions = detector.getCollisions(resourceId);

      // Assert.
      expect(detector.resourceStore).toStrictEqual({
        [resourceId]: [
          new ResourceEventDto({ resourceId, startTime: 1, endTime: 2 }),
          new ResourceEventDto({ resourceId, startTime: 9, endTime: 10 }),
          new ResourceEventDto({ resourceId, startTime: 11, endTime: 12 }),
          new ResourceEventDto({ resourceId, startTime: 13, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 16 }),
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 17, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 102, endTime: 105 }),
          new ResourceEventDto({ resourceId, startTime: 114, endTime: 115 }),
          new ResourceEventDto({ resourceId, startTime: 116, endTime: 130 }),
          new ResourceEventDto({ resourceId, startTime: 132, endTime: 133 }),
          new ResourceEventDto({ resourceId, startTime: 134, endTime: 135 }),
          new ResourceEventDto({ resourceId, startTime: 880, endTime: 1001 }),
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1101 }),
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1000 }),
          new ResourceEventDto({ resourceId, startTime: 1101, endTime: 1108 }),
          new ResourceEventDto({ resourceId, startTime: 1109, endTime: 1118 }),
        ],
      });

      expect(collisions).toStrictEqual([
        [
          new ResourceEventDto({ resourceId, startTime: 13, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 16 }),
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 17, endTime: 18 }),
        ],
        [
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 16 }),
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 18 }),
        ],
        [
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 17, endTime: 18 }),
        ],
        [
          new ResourceEventDto({ resourceId, startTime: 880, endTime: 1001 }),
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1101 }),
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1000 }),
        ],
        [
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1101 }),
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1000 }),
          new ResourceEventDto({ resourceId, startTime: 1101, endTime: 1108 }),
        ],
      ]);
    });

    it('should successfully determine all collisions; case 2', (): void => {
      // Arrange.
      const resources = [
        { resourceId, startTime: 15, endTime: 18 },
        { resourceId, startTime: 15, endTime: 16 },
        { resourceId, startTime: 1, endTime: 999 },
        { resourceId, startTime: 11, endTime: 12 },
        { resourceId, startTime: 13, endTime: 18 },
        { resourceId, startTime: 17, endTime: 18 },
        { resourceId, startTime: 9, endTime: 10 },
        { resourceId, startTime: 134, endTime: 135 },
        { resourceId, startTime: 880, endTime: 1001 },
        { resourceId, startTime: 990, endTime: 1000 },
        { resourceId, startTime: 102, endTime: 105 },
        { resourceId, startTime: 132, endTime: 133 },
        { resourceId, startTime: 990, endTime: 1101 },
        { resourceId, startTime: 114, endTime: 115 },
        { resourceId, startTime: 1101, endTime: 1108 },
        { resourceId, startTime: 116, endTime: 130 },
        { resourceId, startTime: 1109, endTime: 1118 },
      ];

      // Act.
      detector.addResourceEvents(resources);
      const collisions = detector.getCollisions(resourceId);

      // Assert.
      expect(detector.resourceStore).toStrictEqual({
        [resourceId]: [
          new ResourceEventDto({ resourceId, startTime: 1, endTime: 999 }),
          new ResourceEventDto({ resourceId, startTime: 9, endTime: 10 }),
          new ResourceEventDto({ resourceId, startTime: 11, endTime: 12 }),
          new ResourceEventDto({ resourceId, startTime: 13, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 16 }),
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 17, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 102, endTime: 105 }),
          new ResourceEventDto({ resourceId, startTime: 114, endTime: 115 }),
          new ResourceEventDto({ resourceId, startTime: 116, endTime: 130 }),
          new ResourceEventDto({ resourceId, startTime: 132, endTime: 133 }),
          new ResourceEventDto({ resourceId, startTime: 134, endTime: 135 }),
          new ResourceEventDto({ resourceId, startTime: 880, endTime: 1001 }),
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1101 }),
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1000 }),
          new ResourceEventDto({ resourceId, startTime: 1101, endTime: 1108 }),
          new ResourceEventDto({ resourceId, startTime: 1109, endTime: 1118 }),
        ],
      });

      expect(collisions).toStrictEqual([
        [
          new ResourceEventDto({ resourceId, startTime: 1, endTime: 999 }),
          new ResourceEventDto({ resourceId, startTime: 9, endTime: 10 }),
          new ResourceEventDto({ resourceId, startTime: 11, endTime: 12 }),
          new ResourceEventDto({ resourceId, startTime: 13, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 16 }),
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 17, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 102, endTime: 105 }),
          new ResourceEventDto({ resourceId, startTime: 114, endTime: 115 }),
          new ResourceEventDto({ resourceId, startTime: 116, endTime: 130 }),
          new ResourceEventDto({ resourceId, startTime: 132, endTime: 133 }),
          new ResourceEventDto({ resourceId, startTime: 134, endTime: 135 }),
          new ResourceEventDto({ resourceId, startTime: 880, endTime: 1001 }),
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1101 }),
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1000 }),
        ],
        [
          new ResourceEventDto({ resourceId, startTime: 13, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 16 }),
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 17, endTime: 18 }),
        ],
        [
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 16 }),
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 18 }),
        ],
        [
          new ResourceEventDto({ resourceId, startTime: 15, endTime: 18 }),
          new ResourceEventDto({ resourceId, startTime: 17, endTime: 18 }),
        ],
        [
          new ResourceEventDto({ resourceId, startTime: 880, endTime: 1001 }),
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1101 }),
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1000 }),
        ],
        [
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1101 }),
          new ResourceEventDto({ resourceId, startTime: 990, endTime: 1000 }),
          new ResourceEventDto({ resourceId, startTime: 1101, endTime: 1108 }),
        ],
      ]);
    });
  });

  describe('getMedian tests', (): void => {
    it('should successfully determine the median index', (): void => {
      // Arrange and Act.
      const result0_0 = detector.getMedian(0, 0);
      const result0_1 = detector.getMedian(0, 1);
      const result1_2 = detector.getMedian(1, 2);
      const result0_2 = detector.getMedian(0, 2);
      const result0_3 = detector.getMedian(0, 3);
      const result0_4 = detector.getMedian(0, 4);
      const result0_5 = detector.getMedian(0, 5);
      const result0_6 = detector.getMedian(0, 6);
      const result1_6 = detector.getMedian(1, 6);
      const result2_6 = detector.getMedian(2, 6);
      const result3_6 = detector.getMedian(3, 6);
      const result4_6 = detector.getMedian(4, 6);
      const result5_6 = detector.getMedian(5, 6);
      const result6_6 = detector.getMedian(6, 6);

      // Assert.
      expect(result0_0).toBe(0);
      expect(result0_1).toBe(0);
      expect(result1_2).toBe(1);
      expect(result0_2).toBe(1);
      expect(result0_3).toBe(1);
      expect(result0_4).toBe(2);
      expect(result0_5).toBe(2);
      expect(result0_6).toBe(3);
      expect(result1_6).toBe(3);
      expect(result2_6).toBe(4);
      expect(result3_6).toBe(4);
      expect(result4_6).toBe(5);
      expect(result5_6).toBe(5);
      expect(result6_6).toBe(6);
    });
  });
});
