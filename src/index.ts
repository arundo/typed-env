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
  // TTransform extends NamingConvention,
  TPrefixRemoval extends string = '',
>(
  schema: z.Schema<TSchema>,
  {
    transform = 'default' as NamingConvention,
    formatErrorFn = formatError,
    excludePrefix,
  }: Options<NamingConvention, TPrefixRemoval> = {},
  overrideEnv: Record<string, string | undefined> = getEnvironment(),
): typeof transform extends 'camelcase' ? DeepCamelKeys<TSchema> :
  typeof transform extends 'pascalcase' ? DeepPascalKeys<TSchema> :
  typeof transform extends 'kebabcase' ? DeepKebabKeys<TSchema> : never => {
  try {
    const parsed = schema.parse(overrideEnv);
    const prefixRemoved = excludePrefix ? deepTransformKeys(parsed, (str) => removePrefix(str, excludePrefix)) as {
      [key in keyof TSchema as key extends string ? Replace<key , TPrefixRemoval, ''> : never]: unknown;
    }: parsed;

    if (transform === 'camelcase') return deepCamelKeys(parsed);
    if (transform === 'pascalcase') return deepPascalKeys(parsed);
    if (transform === 'kebabcase') return deepKebabKeys(parsed);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(formatErrorFn(error));
    }
    throw new Error('Environment variable validation failed');
  }
};
