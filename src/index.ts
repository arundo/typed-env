import { z } from 'zod';
import { replace, deepCamelKeys, deepPascalKeys, deepKebabKeys, Replace, DeepCamelKeys, DeepPascalKeys, DeepKebabKeys } from 'string-ts';
import { deepTransformKeys } from './utils';
import { NamingConvention } from './contracts';

type BaseSchema = Record<string, unknown>;

const formatError = (error: z.ZodError) =>
  `Environment variable validation failed:${error.issues
    .map(issue => `\n\t'${issue.path.join(',')}': ${issue.message}`)
    .join(',')}`;

const getEnvironment = () => {
  if ((import.meta as any)?.env !== undefined) {
    return (import.meta as any).env;
  }
  if (process.env !== undefined) {
    return process.env;
  }
  throw new Error('Failed to get environment object');
};

type Options<TTransform, TPrefixRemoval> = {
  transform?: TTransform;
  formatErrorFn?: (error: z.ZodError) => string;
  excludePrefix?: TPrefixRemoval;
};

const removePrefix = (str: string, prefix: string) =>  prefix ? (prefix.endsWith('_') ? str.replace(prefix, '') : str.replace(`${prefix}_`, '')) : str


export const typeEnvironment = <
  TSchema extends BaseSchema,
  TTransform extends NamingConvention = 'default',
  TPrefixRemoval extends string = '',
>(
  schema: z.Schema<TSchema>,
  {
    transform = 'default' as TTransform,
    formatErrorFn = formatError,
    excludePrefix,
  }: Options<TTransform, TPrefixRemoval> = {},
  overrideEnv: Record<string, string | undefined> = getEnvironment(),
) => {
  try {
    const parsed = schema.parse(overrideEnv);
    const prefixRemoved = excludePrefix ? deepTransformKeys(parsed, (str) => removePrefix(str, excludePrefix)) as {
      [key in keyof TSchema as key extends string ? Replace<key , TPrefixRemoval, ''> : never]: TSchema[key];
    }: parsed;

    const transformers = {
      camelcase: deepCamelKeys<typeof prefixRemoved>,
      pascalcase: deepPascalKeys<typeof prefixRemoved>,
      kebabcase: deepKebabKeys<typeof prefixRemoved>,
      default: (obj: typeof prefixRemoved) => obj,
    };

    const transformFn = transformers[transform];
    return transformFn(prefixRemoved) as TTransform extends 'camelcase' ? DeepCamelKeys<typeof prefixRemoved> : TTransform extends 'pascalcase' ? DeepPascalKeys<typeof prefixRemoved> : TTransform extends 'kebabcase' ? DeepKebabKeys<typeof prefixRemoved> : typeof prefixRemoved;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(formatErrorFn(error));
    }
    throw new Error('Environment variable validation failed');
  }
};
