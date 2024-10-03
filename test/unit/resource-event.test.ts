import { describe, it, expect } from '@jest/globals';
import { v4 as uuidV4 } from 'uuid';
import { validateSync } from 'class-validator';

import { ResourceEventDto } from '../../src';

describe('resource tests', (): void => {
  it('should yield no validation errors', (): void => {
    // Arrange.
    const startTime = new Date().getTime();
    const endTime = startTime + 2000;

    // Act.
    const resourceEventDto = new ResourceEventDto({ resourceId: uuidV4(), startTime, endTime });
    const validationErrors = validateSync(resourceEventDto);

    // Assert.
    expect(validationErrors.length).toBe(0);
  });

  it('should fail because "endTime" must be a positive integer, and greater than startTime', (): void => {
    // Arrange.
    const startTime = new Date().getTime();
    const endTime = -startTime;

    // Act.
    const resourceEventDto = new ResourceEventDto({ resourceId: uuidV4(), startTime, endTime });
    const validationErrors = validateSync(resourceEventDto);

    // Assert.
    expect(validationErrors.length).toBe(1);
    expect(validationErrors[0].constraints).toStrictEqual({
      isPositive: '"endTime" must be a positive integer',
      isGreaterThan: '"endTime" must be greater than "startTime"',
    });
  });

  it('should fail because "endTime" must be a positive integer', (): void => {
    // Arrange.
    const startTime = new Date().getTime();
    const endTime = startTime + 2000.4;

    // Act.
    const resourceEventDto = new ResourceEventDto({ resourceId: uuidV4(), startTime, endTime });
    const validationErrors = validateSync(resourceEventDto);

    // Assert.
    expect(validationErrors.length).toBe(1);
    expect(validationErrors[0].constraints).toStrictEqual({
      isInt: '"endTime" must be of type integer',
    });
  });

  it('should successfully determine whether the resource event is locked at given time spot', (): void => {
    // Arrange.
    const startTime = new Date().getTime();
    const endTime = startTime + 2000;
    const resourceEventDto = new ResourceEventDto({ resourceId: uuidV4(), startTime, endTime });

    // Act.
    const isLockedAt1 = resourceEventDto.isLockedAt(startTime - 1);
    const isLockedAt2 = resourceEventDto.isLockedAt(startTime);
    const isLockedAt3 = resourceEventDto.isLockedAt(startTime + 1000);
    const isLockedAt4 = resourceEventDto.isLockedAt(startTime + 2000);
    const isLockedAt5 = resourceEventDto.isLockedAt(startTime + 2001);

    // Assert.
    expect(isLockedAt1).toBe(false);
    expect(isLockedAt2).toBe(true);
    expect(isLockedAt3).toBe(true);
    expect(isLockedAt4).toBe(true);
    expect(isLockedAt5).toBe(false);
  });
});
