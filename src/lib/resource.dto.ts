import {
  IsUUID,
  IsInt,
  IsDefined,
  IsPositive,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

type DecoratorClosure = (object: Record<string, any>, propertyName: string) => void;

const IsGreaterThan = (
  property: string,
  validationOptions?: ValidationOptions,
): DecoratorClosure => {
  // Typically, custom validation utilities/decorators reside in separate file/folder.
  // IsGreaterThan decorator resides here just for a sake of simplicity,
  // since the ResourceDto is the only place current decorator is used.
  return (object: Record<string, any>, propertyName: string): void => {
    registerDecorator({
      name: 'isGreaterThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments): boolean {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value > relatedValue;
        },
      },
    });
  };
};

export class ResourceDto {
  @IsDefined({ message: '"id" is missing' })
  @IsUUID(4, { message: '"id" must be of type UUID' })
  id: string;

  @IsDefined({ message: '"startTime" is missing' })
  @IsPositive({ message: '"startTime" must be a positive integer' })
  @IsInt({ message: '"startTime" must be a positive integer' })
  startTime: number;

  @IsGreaterThan('startTime', { message: '"endTime" must be greater than "startTime"' })
  @IsDefined({ message: '"endTime" is missing' })
  @IsPositive({ message: '"endTime" must be a positive integer' })
  @IsInt({ message: '"endTime" must be of type integer' })
  endTime: number;

  constructor(resource: unknown) {
    Object.assign(this, resource);
  }
}
