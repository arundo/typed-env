import { z } from 'zod';
import { ChangeCase, NamingConvention } from './casings';

type RemovePrefix<P extends string, S extends string> = P extends ''
  ? S
  : P extends `${infer O}_`
  ? S extends `${O}_${infer U}`
    ? U
    : S
  : S extends `${P}_${infer U}`
  ? U
  : S;

type BaseSchema = Record<string, unknown>;

type EnvReturnType<TCase extends NamingConvention, P extends string, S extends BaseSchema> = {
  [K in keyof S as ChangeCase<TCase, RemovePrefix<P, string & K>>]: S[K];
} & {};

const toCamelCase = <TSchema extends BaseSchema>(str: string & keyof TSchema): string =>
  str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

const toPascalCase = <TSchema extends BaseSchema>(str: string & keyof TSchema): string =>
  str.toLowerCase().replace(/(^[a-z]|_[a-z])/g, (_, letter) => {
    return letter.startsWith('_') ? letter.replace('_', '').toUpperCase() : letter.toUpperCase();
  });

const toKebabCase = <TSchema extends BaseSchema>(str: string & keyof TSchema): string =>
  str.toLowerCase().replace(/_/g, '-');

const getTransformFn = <TSchema extends BaseSchema>(transform: NamingConvention) => {
  switch (transform) {
    case 'camelcase':
      return toCamelCase;
    case 'pascalcase':
      return toPascalCase;
    case 'kebabcase':
      return toKebabCase;
    default:
      return (str: string & keyof TSchema) => str;
  }
};

const transformKeys =
  <TSchema extends BaseSchema>(transformFn: (str: keyof TSchema) => keyof TSchema) =>
  (obj: TSchema) =>
    Object.fromEntries(Object.entries(obj).map(([key, value]) => [transformFn(key), value])) as TSchema;

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

const removePrefix =
  (prefix?: string) =>
  <TSchema extends BaseSchema>(str: string & keyof TSchema): string =>
    prefix ? (prefix.endsWith('_') ? str.replace(prefix, '') : str.replace(`${prefix}_`, '')) : str;

const removePrefixDecorator =
  (prefix?: string) =>
  (transform: <TSchema extends BaseSchema>(str: string & keyof TSchema) => string) =>
  <TSchema extends BaseSchema>(str: string & keyof TSchema): string =>
    transform(removePrefix(prefix)(str));

type Options<TTransform, TPrefixRemoval> = {
  transform?: TTransform;
  formatErrorFn?: (error: z.ZodError) => string;
  excludePrefix?: TPrefixRemoval;
};

export const typeEnvironment = <
  TSchema extends BaseSchema,
  TTransform extends NamingConvention = 'default',
  TPrefixRemoval extends string = '',
>(
  schema: z.Schema<TSchema>,
  {
    transform = 'default' as TTransform,
    formatErrorFn = formatError,
    excludePrefix = '' as TPrefixRemoval,
  }: Options<TTransform, TPrefixRemoval>,
  overrideEnv: Record<string, string | undefined> = getEnvironment(),
) => {
  const removePrefixWrapper = removePrefixDecorator(excludePrefix);
  try {
    const returnobj = schema
      .transform((obj: TSchema) => {
        console.log('transform', transform);
        const loff = transformKeys(removePrefixWrapper(getTransformFn(transform)))(obj);
        console.log('loff', loff);
        return loff;
      })
      .parse(overrideEnv) as EnvReturnType<NonNullable<typeof transform>, NonNullable<typeof excludePrefix>, TSchema>;
    console.log('transform', JSON.stringify(transform));
    return returnobj;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(formatErrorFn(error));
    }
    throw new Error('Environment variable validation failed');
  }
};
