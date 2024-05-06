import dns from 'dns';
import { Request } from 'express';
import _ from 'lodash';
import minimist from 'minimist';
import { Readable } from 'stream';
import { DEFAULT_PAGINATION } from './constants';
import { errorLog } from './logger/logger.helpers';
import { forOwnRecursive } from './mongoose/helpers';
import { IPagination, PossiblyAsync } from './types';
import config from 'config';

export const convertErrorToLogData = (err: any) => ({
  err,
  errStack: err?.stack,
  errStr: String(err),
});

export const recursivePaginationCall = async <T = any>(
  fn: (pInput: IPagination) => PossiblyAsync<T[]>,
  initialPaginationInput?: Partial<IPagination>,
): Promise<void> => {
  const paginationFilter = {
    ...DEFAULT_PAGINATION,
    ...(initialPaginationInput || {}),
  };
  const result = await fn(paginationFilter);
  if (_.isEmpty(result)) {
    return;
  }
  await recursivePaginationCall(fn, {
    ...paginationFilter,
    page: paginationFilter.page + 1,
    offset: paginationFilter.offset + paginationFilter.pageSize,
  });
};

export const tryParseStringToJson = <T = any>(
  str?: string | null,
): T | string => {
  try {
    const res = JSON.parse(str || '');
    return res;
  } catch (error) {
    return str?.toString() || '';
  }
};

export const parseAndReconstructUrl = (
  urlStr: string,
): string | Promise<string> => {
  const url = new URL(urlStr);
  const protocolMatches = url.protocol.match(/^(.*)\+srv:$/);
  if (!protocolMatches) {
    return urlStr;
  }
  return new Promise((resolve, reject) => {
    dns.resolveSrv(url.hostname, (err, addresses) => {
      if (err) {
        return reject(err);
      }
      const shuffled = _.shuffle(addresses);
      url.hostname = shuffled[0].name;
      url.port = shuffled[0].port.toString();
      url.protocol = `${protocolMatches[1]}:`;
      resolve(url.href);
    });
  });
};

export const retryAction = async (
  action: () => PossiblyAsync<void>,
  metadata?: { errorMessage?: string; previousErr?: any },
  retryCount = 1,
  currentCount = 0,
) => {
  if (currentCount === retryCount) {
    if (metadata?.previousErr) {
      throw metadata?.previousErr;
    }
    return;
  }
  try {
    await action();
  } catch (error) {
    errorLog(
      {
        error: convertErrorToLogData(error),
        cur: currentCount,
        total: retryCount,
      },
      undefined,
      metadata?.errorMessage ||
        'Something wrong happens while we execute this action',
    );
    await retryAction(
      action,
      { ...metadata, previousErr: error },
      retryCount,
      currentCount + 1,
    );
  }
};

export const parseCommandArgs = <T>(
  opts?: minimist.Opts,
  selectKeys?: (keyof T)[],
) => {
  const res = minimist<T>(process.argv.slice(2), opts);
  if (!selectKeys) {
    return res;
  }
  return _.pick(res, selectKeys);
};

export const mask = (text: string, keep = 0) => {
  const regex = new RegExp(`\\S(?=.{${keep}})`, 'g');
  return text.toString().replace(regex, '*');
};

export const maskFieldsInObject = (data: any, fieldsToMask: string[]) => {
  const clonedData = _.cloneDeep(data);
  if (_.isEmpty(fieldsToMask)) {
    return;
  }

  forOwnRecursive(clonedData, (value, paths) => {
    const field = _.last(paths);
    if (field && fieldsToMask.includes(field)) {
      _.set(clonedData, paths.join('.'), mask(value || ''));
    }
  });

  return clonedData;
};

export const readableToBuffer = async (stream: Readable) => {
  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

export const parseS3Uri = (uri: string) => {
  if (!uri) return {};
  const s3UriRe = /^[sS]3:\/\/(.*?)\/(.*)/;

  if (!uri) {
    throw new Error('Expected S3 URL argument');
  }
  const match = uri.match(s3UriRe);
  if (!match) {
    throw new Error(`Not a valid S3 URL: ${uri}`);
  }

  return {
    bucket: match[1],
    key: match[2],
  };
};

export const constructS3Uri = (bucket: string, key: string) => {
  return `s3://${bucket}/${key}`;
};

export const getBearerTokenFromRequest = (req: Request) => {
  if (!req.headers) {
    return undefined;
  }

  const authHeader =
    req.headers['authorization'] || req.headers['proxy-authorization'];

  if (authHeader) {
    const tokens = authHeader.split(' ');
    return tokens[0] === 'Bearer' ? tokens[1] : undefined;
  }
  return undefined;
};

export const getAuthProviderFromHeader = (req: Request) => {
  return req.headers['x-zp-auth-provider'] as string | undefined;
};

export const regExpEscape = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Content-Type: image/png => .png
export const getFileExtensionFromContentType = (contentType: string) => {
  const values = contentType.split('/');
  if (values.length < 2) {
    return '.';
  }
  return `.${values[1]}`;
};

export const getResizableImageUrl = ({ key }: { key: string }) => {
  const paths = key.split('/');
  const filename = paths.pop();
  const originalIndicator = paths.pop();
  if (originalIndicator !== 'original') {
    paths.push(originalIndicator || 'original');
  }
  paths.push(filename || '');
  return `https://${config.get<string>(
    'aws.cloudfront.staticContentDomain',
  )}/${paths.join('/')}`;
};

export const executeSubsequentPromises = (
  promises: (() => Promise<void>)[],
) => {
  return promises.reduce((aggPromise, curPromise) => {
    return aggPromise.then(() => curPromise());
  }, Promise.resolve());
};

export const convertEnumToArray = (enumType: any) => {
  return Object.values(enumType).map((value) => value);
};
