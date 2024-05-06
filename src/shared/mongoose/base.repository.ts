import { NotFoundException } from '@nestjs/common';
import { merge, slice } from 'lodash';
import { TransactionOptions } from 'mongodb';
import {
  ClientSession,
  Document,
  FilterQuery,
  Model,
  Query,
  QueryOptions,
  SaveOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';
import { isObjectId } from './helpers';

interface IDeleteOptions {
  session?: ClientSession | null;
}

export class BaseRepository<T extends Document> {
  protected primaryKey = '_id';
  protected softDeletedSupported = false;

  constructor(public readonly model: Model<T>) {
    this.softDeletedSupported = false;
  }

  aggregate<X = any>(aggregations?: any[]): Promise<X[]> {
    aggregations = slice(aggregations);
    return this.model.aggregate<X>(aggregations).exec();
  }

  async countWithFindOption(
    conditions: FilterQuery<T>,
    findOptions?: QueryOptions & { includedSoftDeleted?: boolean },
  ): Promise<number> {
    let query = this.model.find(conditions, null, findOptions).countDocuments();
    if (!findOptions?.includedSoftDeleted) {
      query = this.excludeSoftDeletedFromQuery(query);
    }
    return query.exec();
  }

  async count(
    conditions: FilterQuery<T>,
    options?: { includedSoftDeleted?: boolean; session?: ClientSession },
  ): Promise<number> {
    let query = this.model.countDocuments(conditions);
    if (!options?.includedSoftDeleted) {
      query = this.excludeSoftDeletedFromQuery(query);
    }
    return query.exec();
  }

  async create(doc: Record<string, unknown>, options?: SaveOptions): Promise<T>;
  async create(
    docs: Record<string, unknown>[],
    options?: SaveOptions,
  ): Promise<T[]>;
  async create(
    docs: Record<string, any> | Record<string, any>[],
    options?: SaveOptions,
  ): Promise<T | T[]> {
    if (Array.isArray(docs)) {
      const result: T[] = [];
      for (const doc of docs) {
        result.push(await this.create(doc, options));
      }
      return result;
    }
    return this.save(new this.model(docs as any), options);
  }

  async delete(doc: T, options?: IDeleteOptions): Promise<T>;
  async delete(docs: T[], options?: IDeleteOptions): Promise<T[]>;
  async delete(docs: T | T[], options?: IDeleteOptions): Promise<T | T[]> {
    if (Array.isArray(docs)) {
      const result: T[] = [];
      for (const doc of docs) {
        result.push(await this.delete(doc, options));
      }
      return result;
    }
    if (options && options.session) {
      docs.$session(options.session);
    }
    return docs.remove();
  }

  async deleteById(id: any, options?: QueryOptions): Promise<T | null> {
    if (!isObjectId(id)) return null;
    return this.deleteOne({ _id: id }, options);
  }

  async deleteMany(
    conditions: FilterQuery<T>,
    options?: IDeleteOptions,
  ): Promise<number> {
    let query = this.model.deleteMany(conditions);
    if (options && options.session) {
      query = query.session(options.session);
    }
    const result = await query.exec();
    return result.acknowledged ? result.deletedCount || 0 : 0;
  }

  async deleteOne(
    conditions: FilterQuery<T>,
    options?: QueryOptions,
  ): Promise<T | null> {
    return this.model.findOneAndDelete(conditions, options).exec();
  }

  // soft delete part
  async softDelete(doc: T, options?: SaveOptions): Promise<T | null>;
  async softDelete(docs: T[], options?: SaveOptions): Promise<T[]>;
  async softDelete(
    docs: T | T[],
    options?: SaveOptions,
  ): Promise<(T | null)[] | (T | null)> {
    if (Array.isArray(docs)) {
      const result: (T | null)[] = [];
      for (const doc of docs) {
        result.push(await this.softDelete(doc, options));
      }
      return result;
    }
    docs.set({
      _deleted: true,
      deletedAt: new Date(),
    });
    return docs.save(options);
  }

  async softDeleteAll(options?: SaveOptions): Promise<number> {
    return this.softDeleteMany({}, options);
  }

  async softDeleteById(id: any, options?: SaveOptions): Promise<T | null> {
    if (!isObjectId(id)) return null;
    return this.softDeleteOne({ [this.primaryKey]: id }, options);
  }

  async softDeleteMany(
    conditions: any = {},
    options?: SaveOptions,
  ): Promise<number> {
    return this.updateMany(
      conditions,
      { _deleted: true, deletedAt: new Date() } as any,
      options as any,
    );
  }

  async softDeleteOne(
    conditions: any,
    options?: SaveOptions,
  ): Promise<T | null> {
    return this.updateOne(
      conditions,
      { _deleted: true, deletedAt: new Date() } as any,
      options as any,
    );
  }

  async exists(
    conditions: FilterQuery<T>,
    options?: { includedSoftDeleted?: boolean },
  ): Promise<boolean> {
    let finalCond = conditions;
    if (!options?.includedSoftDeleted) {
      finalCond = {
        ...finalCond,
        _deleted: { $ne: true },
      };
    }
    const count = await this.model.countDocuments(finalCond, options).exec();
    return count > 0;
  }

  async existsById(
    id: any,
    options?: { includedSoftDeleted?: boolean },
  ): Promise<boolean> {
    if (!isObjectId(id)) return false;
    return this.exists({ _id: id }, options);
  }

  async find(
    conditions: FilterQuery<T>,
    options?: QueryOptions & { includedSoftDeleted?: boolean },
    projection: any = null,
  ): Promise<T[]> {
    let query = this.model.find(conditions, projection, options);
    if (!options?.includedSoftDeleted) {
      query = this.excludeSoftDeletedFromQuery(query);
    }
    return query.exec();
  }

  async findById(
    id: any,
    options?: QueryOptions & { includedSoftDeleted?: boolean },
    projection: any = null,
  ): Promise<T | null> {
    if (!isObjectId(id)) return null;
    return this.findOne({ _id: id }, options, projection);
  }

  async findOne(
    conditions: FilterQuery<T>,
    options?: QueryOptions & { includedSoftDeleted?: boolean },
    projection: any = null,
  ): Promise<T | null> {
    let query = this.model.findOne(conditions, projection, options);
    if (!options?.includedSoftDeleted) {
      query = this.excludeSoftDeletedFromQuery(query);
    }
    return query.exec();
  }

  async findOneOrCreate(
    conditions: FilterQuery<T>,
    doc: Record<string, any>,
    options?: QueryOptions & { includedSoftDeleted?: boolean },
  ): Promise<T> {
    let document = await this.findOne(conditions, options);
    if (!document) {
      document = await this.create(merge({}, conditions, doc), options);
    }
    return document;
  }

  async findByIdOrFail(
    id: any,
    options?: QueryOptions & { includedSoftDeleted?: boolean },
    projection: any = null,
  ): Promise<T> {
    if (!isObjectId(id)) {
      return this.throwErrorNotFound();
    }
    const instance = await this.findById(id, options, projection);
    if (!instance) {
      return this.throwErrorNotFound();
    }

    return instance;
  }

  async findOneOrFail(
    conditions: FilterQuery<T>,
    options?: QueryOptions & { includedSoftDeleted?: boolean },
    projection: any = null,
  ): Promise<T> {
    const res = await this.findOne(conditions, options, projection);
    if (!res) {
      return this.throwErrorNotFound();
    }
    return res;
  }

  throwErrorNotFound(): never {
    throw new NotFoundException({ sentryAlertDisabled: true });
  }

  async save(doc: T, options?: SaveOptions): Promise<T>;
  async save(docs: T[], options?: SaveOptions): Promise<T[]>;
  async save(docs: T | T[], options?: SaveOptions): Promise<T | T[]> {
    if (Array.isArray(docs)) {
      const result: T[] = [];
      for (const doc of docs) {
        result.push(await this.save(doc, options));
      }
      return result;
    }
    return docs.save(options);
  }

  async update(
    conditions: FilterQuery<T>,
    doc: UpdateWithAggregationPipeline | UpdateQuery<T>,
    options?: QueryOptions & { includedSoftDeleted?: boolean },
  ): Promise<number> {
    const result = await this.model.updateOne(conditions, doc, options).exec();

    return result.acknowledged ? result.modifiedCount : 0;
  }

  async updateById(
    id: any,
    doc: UpdateWithAggregationPipeline | UpdateQuery<T>,
    options?: QueryOptions & {
      rawResult?: boolean;
      includedSoftDeleted?: boolean;
    },
  ): Promise<T | null> {
    if (!isObjectId(id)) return null;
    return this.updateOne({ _id: id }, doc, options);
  }

  async updateMany(
    conditions: FilterQuery<T>,
    doc: UpdateWithAggregationPipeline | UpdateQuery<T>,
    options?: QueryOptions,
  ): Promise<number> {
    const result = await this.model.updateMany(conditions, doc, options).exec();
    return result.acknowledged ? result.modifiedCount : 0;
  }

  async updateOne(
    conditions: FilterQuery<T>,
    doc: UpdateQuery<T> | UpdateWithAggregationPipeline,
    options?: QueryOptions & {
      rawResult?: boolean;
      includedSoftDeleted?: boolean;
    },
  ): Promise<T | null> {
    let query = this.model.findOneAndUpdate(
      conditions,
      doc,
      merge({ new: true }, options),
    );
    if (!options?.includedSoftDeleted) {
      query = this.excludeSoftDeletedFromQuery(query);
    }
    return query.exec();
  }

  async updateOneOrCreate(
    conditions: FilterQuery<T>,
    doc: UpdateWithAggregationPipeline | UpdateQuery<T>,
    options?: QueryOptions & {
      rawResult: boolean;
      includedSoftDeleted?: boolean;
    },
  ): Promise<T> {
    return this.updateOne(
      conditions,
      doc,
      merge({ new: true, upsert: true, setDefaultsOnInsert: true }, options),
    ) as Promise<T>;
  }

  async withTransaction<U>(
    fn: (session: ClientSession) => Promise<U>,
    options?: TransactionOptions,
  ): Promise<U | null> {
    const session = await this.model.db.startSession();
    let result: U | null = null;
    try {
      await session.withTransaction(async (ses) => {
        result = await fn(ses);
      }, options);
      return result;
    } finally {
      session.endSession();
    }
  }

  excludeSoftDeletedFromQuery<Q extends Query<any, any, any>>(query: Q) {
    if (this.softDeletedSupported) {
      return query.where('_deleted').ne(true);
    }
    return query;
  }

  getCollectionName(): string {
    return this.model.collection.collectionName;
  }

  async createCollection(): Promise<void> {
    if (!(await this.isCollectionExists())) {
      await this.model.createCollection();
    }
  }

  async dropCollection(): Promise<void> {
    if (await this.isCollectionExists()) {
      await this.model.collection.drop();
    }
  }

  getPrimaryKey(): string {
    return this.primaryKey;
  }

  private async isCollectionExists(): Promise<boolean> {
    const result = await this.model.db.db
      .listCollections({ name: this.model.collection.collectionName })
      .next();
    return !!result;
  }
}
