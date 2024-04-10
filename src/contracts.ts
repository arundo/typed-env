import { ZodIssue } from 'zod';
import { Replace, CamelKeys, ConstantKeys, KebabKeys, PascalKeys } from 'string-ts';

export type NamingConvention = 'camelcase' | 'pascalcase' | 'kebabcase' | 'constantcase' | 'default';

export type Options<TTransform, TPrefixRemoval> = {
  transform?: TTransform;
  constructErrorFn?: (issues: ZodIssue[]) => Error;
  excludePrefix?: TPrefixRemoval;
  writeBackToEnv?: boolean;
};

export type ConditionalType<TTransform extends NamingConvention | undefined, TSchema> = 'default' extends TTransform
  ? Readonly<TSchema>
  : 'constantcase' extends TTransform
  ? Readonly<ConstantKeys<TSchema>>
  : 'camelcase' extends TTransform
  ? Readonly<CamelKeys<TSchema>>
  : 'pascalcase' extends TTransform
  ? Readonly<PascalKeys<TSchema>>
  : 'kebabcase' extends TTransform
  ? Readonly<KebabKeys<TSchema>>
  : never;

export type PrefixRemoved<TSchema, TPrefixRemoval extends string> = {
  [key in keyof TSchema as key extends string ? Replace<key, TPrefixRemoval, ''> : never]: TSchema[key];
} & {};
