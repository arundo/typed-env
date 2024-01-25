import { ZodError } from 'zod';
import { Replace, CamelKeys, ConstantKeys, KebabKeys, PascalKeys } from 'string-ts';

export type NamingConvention = 'camelcase' | 'pascalcase' | 'kebabcase' | 'constantcase' | 'default';

export type BaseSchema = Record<string, unknown>;

export type Options<TTransform, TPrefixRemoval> = {
  transform?: TTransform;
  formatErrorFn?: (error: ZodError) => string;
  excludePrefix?: TPrefixRemoval;
};

export type ConditionalType<
  TTransform extends NamingConvention,
  TSchema extends BaseSchema,
> = 'default' extends TTransform
  ? TSchema
  : 'constantcase' extends TTransform
  ? ConstantKeys<TSchema>
  : 'camelcase' extends TTransform
  ? CamelKeys<TSchema>
  : 'pascalcase' extends TTransform
  ? PascalKeys<TSchema>
  : 'kebabcase' extends TTransform
  ? KebabKeys<TSchema>
  : never;

export type PrefixRemoved<TSchema extends BaseSchema, TPrefixRemoval extends string> = {
  [key in keyof TSchema as key extends string ? Replace<key, TPrefixRemoval, ''> : never]: TSchema[key];
} & {};
