import { describe, it, expect } from '@jest/globals';
import { v4 as uuidV4 } from 'uuid';
import { validateSync } from 'class-validator';

import { ResourceDto } from '../../src/lib/resource.dto';

describe('resource tests', (): void => {
  it('should yield no validation errors', (): void => {
    // Arrange.
    const startTime = new Date().getTime();
    const endTime = startTime + 2000;

    // Act.
    const resourceDto = new ResourceDto({ id: uuidV4(), startTime, endTime });
    const validationErrors = validateSync(resourceDto);

    // Assert.
    expect(validationErrors.length).toBe(0);
  });

  it('should fail because "endTime" must be a positive integer, and greater than startTime', (): void => {
    // Arrange.
    const startTime = new Date().getTime();
    const endTime = -startTime;

    // Act.
    const resourceDto = new ResourceDto({ id: uuidV4(), startTime, endTime });
    const validationErrors = validateSync(resourceDto);

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
    const endTime = `${startTime + 2000}`;

    // Act.
    const resourceDto = new ResourceDto({ id: uuidV4(), startTime, endTime });
    const validationErrors = validateSync(resourceDto);

    // Assert.
    expect(validationErrors.length).toBe(1);
    expect(validationErrors[0].constraints).toStrictEqual({
      isInt: '"endTime" must be of type integer',
      isPositive: '"endTime" must be a positive integer',
    });
  });
});
