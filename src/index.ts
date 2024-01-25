import { ZodError, Schema } from 'zod';
import { replace, deepCamelKeys, deepPascalKeys, deepKebabKeys, deepConstantKeys } from 'string-ts';
import { deepTransformKeys } from './utils';
import { BaseSchema, ConditionalType, NamingConvention, Options, PrefixRemoved } from './contracts';

const formatError = (error: ZodError) =>
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

const changeCase = <TTransform extends NamingConvention, TSchema extends BaseSchema>(
  transform: TTransform,
  schema: TSchema,
) => {
  switch (transform) {
    case 'camelcase':
      return deepCamelKeys(schema);
    case 'pascalcase':
      return deepPascalKeys(schema);
    case 'kebabcase':
      return deepKebabKeys(schema);
    case 'constantcase':
    default:
      return deepConstantKeys(schema);
  }
};

const removePrefix = (str: string, prefix: string) =>
  prefix ? (prefix.endsWith('_') ? replace(str, prefix, '') : replace(str, `${prefix}_`, '')) : str;

const removePrefixes = <TSchema extends BaseSchema, TPrefixRemoval extends string>(
  schema: TSchema,
  prefix: TPrefixRemoval,
) => {
  if (prefix) {
    return deepTransformKeys(schema, str => removePrefix(str, prefix));
  }
  return schema;
};

export const typeEnvironment = <
  TSchema extends BaseSchema,
  TTransform extends NamingConvention = 'constantcase',
  TPrefixRemoval extends string = '',
>(
  schema: Schema<TSchema>,
  {
    transform = 'constantcase' as TTransform,
    formatErrorFn = formatError,
    excludePrefix = '' as TPrefixRemoval,
  }: Options<TTransform, TPrefixRemoval> = {},
  overrideEnv: Record<string, string | undefined> = getEnvironment(),
) => {
  try {
    const parsed = schema.parse(overrideEnv);
    const prefixRemoved = removePrefixes(parsed, excludePrefix) as PrefixRemoved<TSchema, TPrefixRemoval>;
    return changeCase(transform, prefixRemoved) as ConditionalType<TTransform, typeof prefixRemoved>;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatErrorFn(error));
    }
    throw new Error('Environment variable validation failed');
  }
};
