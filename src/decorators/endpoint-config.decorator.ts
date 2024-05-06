import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { IEndpointConfiguration } from 'src/shared/types';
import { CommonErrorResponses } from './common-error-responses';

export const EndpointConfig = (config: IEndpointConfiguration) => {
  const decors = [
    ApiOperation({
      operationId: config.operationId,
      summary: config.summary,
      description: config.description,
      deprecated: config.deprecated,
    }),
    CommonErrorResponses(),
    ...(config.contentTypes ? [ApiConsumes(...config.contentTypes)] : []),
    ...(config.body ? [ApiBody(config.body)] : []),
    ...(config.params ? config.params.map((p) => ApiParam(p)) : []),
    ...(config.query ? config.query.map(ApiQuery) : []),
    ...(config.responses ? config.responses.map(ApiResponse) : []),
  ];
  return applyDecorators(...decors);
};
