import { LeanDocument, Document, Types } from 'mongoose';
import { MakeEmptyable, NonEmptyable } from '../types';

export type Document2Interface<T> = NonEmptyable<T> extends Set<infer Y>
  ? MakeEmptyable<T, Array<Document2Interface<Y>>>
  : NonEmptyable<T> extends Map<string, infer U>
  ? MakeEmptyable<T, Record<string, Document2Interface<U>>>
  : NonEmptyable<T> extends Array<infer X>
  ? MakeEmptyable<T, Array<Document2Interface<X>>>
  : NonEmptyable<T> extends Document
  ? MakeEmptyable<
      T,
      {
        [k in keyof LeanDocument<NonEmptyable<T>>]: Document2Interface<
          NonEmptyable<T>[k]
        >;
      }
    >
  : NonEmptyable<T> extends Types.ObjectId
  ? MakeEmptyable<T, string>
  : NonEmptyable<T> extends Types.Decimal128
  ? MakeEmptyable<T, number>
  : T;
export enum MongoType {
  NULL = 10,
  STRING = 2,
  ARRAY = 4,
  BOOLEAN = 8,
  DATE = 9,
  OBJECT = 3,
}
