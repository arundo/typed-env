import { z } from 'zod';

type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${Lowercase<T>}${Capitalize<SnakeToCamelCase<U>>}`
  : Lowercase<S>;

type OutputType<InputType> = { [K in keyof InputType as SnakeToCamelCase<string & K>]: InputType[K] } & {};

type NamingConvention = 'camelcase' | 'default';

type BaseSchema = Record<string, unknown>;

type EnvReturnType<T, S extends BaseSchema> = T extends 'camelcase' ? OutputType<S> : S;

const toCamelCase = <TSchema extends BaseSchema>(str: string & keyof TSchema): string =>
  str.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

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
  (prefix: string) =>
  <TSchema extends BaseSchema>(str: string & keyof TSchema): string =>
    str.replace(prefix, '');

const removePrefixDecorator =
  (prefix: string) =>
  (transform: <TSchema extends BaseSchema>(str: string & keyof TSchema) => string) =>
  <TSchema extends BaseSchema>(str: string & keyof TSchema): string =>
    removePrefix(prefix)(transform(str));

export const typeEnvironment = <TSchema extends BaseSchema, TTransform extends NamingConvention = 'default'>(
  schema: z.Schema<TSchema>,
  options: { transform?: TTransform; formatErrorFn?: (error: z.ZodError) => string; excludePrefix?: string } = {
    transform: 'default' as TTransform,
    formatErrorFn: formatError,
    excludePrefix: '',
  },
  overrideEnv: Record<string, string | undefined> = getEnvironment(),
) => {
  const { transform = 'default', formatErrorFn = formatError } = options ?? {};
  const prefix = options?.excludePrefix ?? '';
  const removePrefixWrapper = removePrefixDecorator(prefix);
  try {
    return schema
      .transform((obj: TSchema) => {
        if (transform === 'camelcase') {
          return transformKeys(removePrefixWrapper(toCamelCase))(obj);
        }
        return obj;
      })
      .parse(overrideEnv) as EnvReturnType<typeof options.transform, TSchema>;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(formatErrorFn(error));
    }
    throw new Error('Environment variable validation failed');
  }
};
