import { ZodIssue } from 'zod';
import { Replace, CamelKeys, ConstantKeys, KebabKeys, PascalKeys } from 'string-ts';

export type NamingConvention = 'camelcase' | 'pascalcase' | 'kebabcase' | 'constantcase' | 'default';

export type Options<TTransform, TPrefixRemoval> = {
  transform?: TTransform;
  constructErrorFn?: (issues: ZodIssue[]) => Error;
  excludePrefix?: TPrefixRemoval;
};

export type ConditionalType<TTransform extends NamingConvention, TSchema> = 'default' extends TTransform
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

export type PrefixRemoved<TSchema, TPrefixRemoval extends string> = {
  [key in keyof TSchema as key extends string ? Replace<key, TPrefixRemoval, ''> : never]: TSchema[key];
} & {};
