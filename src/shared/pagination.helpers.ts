import { BadRequestException } from '@nestjs/common';
import { isInt, min } from 'class-validator';
import { DEFAULT_PAGINATION } from './constants';
import { IPaginationHeader, IPagination, IPaginationOptions } from './types';

export const getPaginationHeaders = (
  pagination: Partial<IPagination> | null,
  totalCount?: number,
): IPaginationHeader => {
  return {
    'x-pagination-page': pagination?.page || DEFAULT_PAGINATION.page,
    'x-pagination-page-size':
      pagination?.pageSize || DEFAULT_PAGINATION.pageSize,
    'x-pagination-total': totalCount || 0,
  };
};

export const createPagination = (
  page: number,
  pageSize: number,
  options?: IPaginationOptions,
): IPagination => {
  if (!isInt(page) || !min(page, 1) || !isInt(pageSize) || !min(pageSize, 1)) {
    throw new BadRequestException({ message: 'Invalid pagination request' });
  }
  page = +page;
  pageSize = +pageSize;

  if (options?.maxLimit && pageSize > options.maxLimit) {
    throw new BadRequestException({
      message: `Page size cannot be larger than ${options.maxLimit}`,
    });
  }

  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    offset,
  };
};

export const needToGetMore = (total: number, pagination: IPagination) => {
  const { offset, pageSize } = pagination;

  if (offset + pageSize > total) {
    return true;
  }
  return false;
};
