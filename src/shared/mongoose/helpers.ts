import { MongooseModuleOptions } from '@nestjs/mongoose';
import config from 'config';
import _ from 'lodash';
import mongoose from 'mongoose';

export function isObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export function convertSetToObject<T = any>(value: Set<T>): T[] {
  return Array.from(value.values());
}

export function convertMapToPlainObject<T = any>(
  value: Map<string, T>,
): { [key: string]: T } {
  return _.fromPairs(Array.from(value.entries()));
}

export interface ConvertObjectOptions {
  /**
   * Fields to exclude, either as dot-notation string or path array
   */
  exclude?: (string | string[])[];
  /**
   * Exclude properties starting with prefix
   */
  excludePrefixes?: string[];
  /**
   * Function to replace value (see lodash@cloneDeepWith)
   */
  replacer?: (value: any) => any;
  /**
   * Key-to-key mapping, or function
   */
  keymap?: { [key: string]: string } | ((key: string) => string);
}

export function forOwnRecursive(
  obj: any,
  iteratee: (value: any, path: string[], obj: any) => any = _.identity,
) {
  return _.forOwn(obj, (value, key) => {
    const path = [key.toString()];
    if (_.isPlainObject(value) || _.isArray(value)) {
      return forOwnRecursive(value, (v, p) =>
        iteratee(v, path.concat(p || []), obj),
      );
    }
    return iteratee(value, path, obj);
  });
}

export function convertObject<T = any>(
  obj: any,
  options: ConvertObjectOptions = {},
): T {
  if (!obj) {
    return obj;
  }
  const defaultReplacer = (value) => {
    if (value?.constructor?.name === mongoose.Types.ObjectId.name) {
      return value.toHexString();
    }
    if (value?.constructor?.name === mongoose.Types.Decimal128.name) {
      return Number(value.toString());
    }
    if (value?.constructor?.name === Set.name) {
      return convertSetToObject(value);
    }
    if (value?.constructor?.name === Map.name) {
      return convertMapToPlainObject(value);
    }
  };
  const {
    exclude = [],
    excludePrefixes = ['_', '$'],
    replacer = defaultReplacer,
    keymap = { _id: 'id' },
  } = options;
  const resultObj = _.cloneDeepWith(obj, replacer);
  if (_.isPlainObject(resultObj) || _.isArray(resultObj)) {
    forOwnRecursive(resultObj, (value, path) => {
      const key = _.last(path);
      const newKey = _.isFunction(keymap)
        ? (keymap as any)(key)
        : _.get(keymap, key || '');
      if (newKey) {
        _.set(resultObj, _.concat(_.dropRight(path), newKey), value);
      }
    });
    forOwnRecursive(resultObj, (value, path) => {
      if (
        !_.isEmpty(excludePrefixes) &&
        excludePrefixes.some((pref) => (_.last(path) || '').startsWith(pref))
      ) {
        _.unset(resultObj, path);
      }
      _.forEach(exclude, (field) => {
        if (_.isString(field)) {
          field = _.toPath(field);
        }
        if (_.isEqual(field, path)) {
          _.unset(resultObj, path);
          return false;
        }
      });
    });
  }
  return JSON.parse(JSON.stringify(resultObj)) as T;
}

export function createMongooseOptions(
  uriConfigPath: string,
): MongooseModuleOptions {
  return {
    uri: config.get<string>(uriConfigPath),
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
}
