import { ZodError } from 'zod';
import { DeepCamelKeys, DeepPascalKeys, DeepKebabKeys, Replace } from 'string-ts';

export type NamingConvention = 'camelcase' | 'pascalcase' | 'kebabcase' | 'default';

export type BaseSchema = Record<string, unknown>;

export type Options<TTransform, TPrefixRemoval> = {
  transform?: TTransform;
  formatErrorFn?: (error: ZodError) => string;
  excludePrefix?: TPrefixRemoval;
};

export type ConditionalType<
  TTransform extends NamingConvention,
  TSchema extends BaseSchema,
> = TTransform extends 'camelcase'
  ? DeepCamelKeys<TSchema>
  : TTransform extends 'pascalcase'
  ? DeepPascalKeys<TSchema>
  : TTransform extends 'kebabcase'
  ? DeepKebabKeys<TSchema>
  : TSchema;

export type PrefixRemoved<TSchema extends BaseSchema, TPrefixRemoval extends string> = {
  [key in keyof TSchema as key extends string ? Replace<key, TPrefixRemoval, ''> : never]: TSchema[key];
} & {};
