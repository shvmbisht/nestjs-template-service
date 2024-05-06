import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { DEFAULT_PAGINATION } from 'src/shared/constants';
import { createPagination } from 'src/shared/pagination.helpers';
import { IPaginationOptions } from 'src/shared/types';

export const Pagination = createParamDecorator(
  (data: IPaginationOptions | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return createPagination(
      Number(request.query.page || DEFAULT_PAGINATION.page),
      Number(request.query.pageSize || DEFAULT_PAGINATION.pageSize),
      data,
    );
  },
);

export const PaginationSwaggerQuery = () => {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      type: Number,
      required: false,
    }),
    ApiQuery({
      name: 'pageSize',
      type: Number,
      required: false,
    }),
  );
};
