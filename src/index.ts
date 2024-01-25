import { ZodError, Schema } from 'zod';
import { replace, camelKeys, pascalKeys, kebabKeys, constantKeys, Replace } from 'string-ts';
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

export function removePrefix<T extends Record<string, unknown>, L extends string>(obj: T, prefix: L) {
  if (!prefix) {
    return obj;
  }

  const res: Record<string, unknown> = {};

  for (const key in obj) {
    const transformedKey = prefix
      ? prefix.endsWith('_')
        ? replace(key, prefix, '')
        : replace(key, `${prefix}_`, '')
      : key;
    res[transformedKey] = obj[key];
  }
  return res as {
    [K in Extract<keyof T, string> as Replace<Extract<keyof T, string>, L, ''>]: T[K];
  };
}

const changeCase = <TTransform extends NamingConvention | undefined, TSchema extends BaseSchema>(
  transform: TTransform,
  schema: TSchema,
) => {
  switch (transform) {
    case 'camelcase':
      return camelKeys(schema);
    case 'pascalcase':
      return pascalKeys(schema);
    case 'kebabcase':
      return kebabKeys(schema);
    case 'constantcase':
    default:
      return constantKeys(schema);
  }
};

export const typeEnvironment = <
  TSchema extends BaseSchema,
  TTransform extends NamingConvention,
  TPrefixRemoval extends string = '',
>(
  schema: Schema<TSchema>,
  options: Options<TTransform, TPrefixRemoval> = {},
  overrideEnv: Record<string, string | undefined> = getEnvironment(),
) => {
  const { transform = 'default', formatErrorFn = formatError, excludePrefix = '' as TPrefixRemoval } = options;

  try {
    const parsed = schema.parse(overrideEnv);
    const prefixRemoved = removePrefix(parsed, excludePrefix) as PrefixRemoved<TSchema, TPrefixRemoval>;
    return changeCase(transform, prefixRemoved) as ConditionalType<TTransform, typeof prefixRemoved>;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatErrorFn ? formatErrorFn(error) : formatError(error));
    }
    throw new Error('Environment variable validation failed');
  }
};
