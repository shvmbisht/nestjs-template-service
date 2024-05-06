import { registerDecorator, ValidationArguments } from 'class-validator';
import _ from 'lodash';

export function ValidateMultipleFields(
  fields: string[],
  validateFn: (...values: any[]) => boolean,
  options?: {
    message?: string;
  },
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'ValidateMulitpleFields',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: options?.message,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          return validateFn(value, ...fields.map((f) => _.get(args.object, f)));
        },
      },
    });
  };
}
