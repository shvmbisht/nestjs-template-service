import { SchemaOptions } from '@nestjs/mongoose';
import { convertObject } from './helpers';

export const DefaultSchemaOptions: SchemaOptions = {
  timestamps: true,
  toObject: {
    transform: (_, ret) => convertObject(ret),
  },
  toJSON: {
    transform: (_, ret) => convertObject(ret),
    getters: true,
    virtuals: true,
    versionKey: false,
  },
};
