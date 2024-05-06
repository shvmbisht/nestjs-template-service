import { ValidationPipe } from '@nestjs/common';

export const generalValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  validationError: {
    target: true,
    value: false,
  },
  validateCustomDecorators: true,
});
