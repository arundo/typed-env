import { ZodTypeAny, ZodError, ZodIssue } from 'zod';
import {
  replace,
  camelKeys,
  pascalKeys,
  kebabKeys,
  constantKeys,
  Replace,
  CamelKeys,
  PascalKeys,
  KebabKeys,
  ConstantKeys,
} from 'string-ts';
import { ConditionalType, NamingConvention, Options, PrefixRemoved } from './contracts';

const constructError = (issues: ZodIssue[]) =>
  new Error(
    `Environment variable validation failed:${issues
      .map(issue => `\n\t'${issue.path.join(',')}': ${issue.message}`)
      .join(',')}`,
  );

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

const changeCase = <TTransform extends NamingConvention | undefined, TSchema>(
  transform: TTransform,
  schema: TSchema,
) => {
  switch (transform) {
    case 'camelcase':
      return camelKeys<TSchema>(schema) as Readonly<CamelKeys<TSchema>>;
    case 'pascalcase':
      return pascalKeys<TSchema>(schema) as Readonly<PascalKeys<TSchema>>;
    case 'kebabcase':
      return kebabKeys<TSchema>(schema) as Readonly<KebabKeys<TSchema>>;
    case 'constantcase':
    default:
      return constantKeys<TSchema>(schema) as Readonly<ConstantKeys<TSchema>>;
  }
};

export const typeEnvironment = <
  TSchema extends ZodTypeAny,
  TTransform extends NamingConvention,
  TPrefixRemoval extends string = '',
>(
  schema: TSchema,
  options: Options<TTransform, TPrefixRemoval> = {},
  overrideEnv: Record<string, string | undefined> = getEnvironment(),
) => {
  const {
    transform = 'default',
    constructErrorFn: constructErrorFn = constructError,
    excludePrefix = '' as TPrefixRemoval,
  } = options;

  try {
    const parsed = schema.parse(overrideEnv);
    type TSchemaOutput = TSchema['_output'];
    const prefixRemoved = removePrefix(parsed, excludePrefix) as PrefixRemoved<TSchemaOutput, TPrefixRemoval>;
    return changeCase(transform, prefixRemoved) as ConditionalType<
      TTransform,
      PrefixRemoved<TSchemaOutput, TPrefixRemoval>
    >;
  } catch (error) {
    const zodErrors = (error as ZodError)?.issues || (error as ZodError)?.errors || [];
    if (zodErrors.length > 0) {
      throw constructErrorFn ? constructErrorFn(zodErrors) : constructError(zodErrors);
    }
    throw new Error('Environment variable validation failed');
  }
};
