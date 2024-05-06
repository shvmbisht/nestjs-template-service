import {
  ApiBodyOptions,
  ApiParamOptions,
  ApiQueryOptions,
  ApiResponseOptions,
} from '@nestjs/swagger';
import { Request } from 'express';

export enum CollectionName {}
// CONVERSATIONS = 'conversations',
// MESSAGES = 'messages',
// ACCOUNTS = 'accounts',
// EVENTS = 'events',

export type Emptyable<T> = T | undefined | null;
export type NonEmptyable<T> = Exclude<T, undefined | null>;
export type MakeEmptyable<From, To> = null extends From
  ? undefined extends From
    ? To | null | undefined
    : To | null
  : To;

export interface IEndpointConfiguration {
  operationId: string;
  description?: string;
  deprecated?: boolean;
  summary?: string;
  params?: ApiParamOptions[];
  body?: ApiBodyOptions;
  query?: ApiQueryOptions[];
  contentTypes?: string[];
  responses?: ApiResponseOptions[];
}

export interface IPagination {
  page: number;
  pageSize: number;
  offset: number;
}

export interface IPaginationHeader {
  'x-pagination-page': number;
  'x-pagination-page-size': number;
  'x-pagination-total': number;
}

export interface IPaginationResponse<T> {
  items: T[];
  headers: IPaginationHeader;
}

export interface IPaginationOptions {
  maxLimit?: number;
}

export type PossiblyAsync<T> = T | Promise<T>;

export interface IRequestWithRawBody extends Request {
  rawBody: Buffer;
}

export enum EHeadersContentType {
  APPLICATION_JSON = 'application/json',
}

export enum ELinkType {
  REDIRECTION = 'redirection',
}
