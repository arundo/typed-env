import { test, expect } from 'vitest';
import { typeEnvironment } from '../src';
import { z } from 'zod';

process.env.HOST = 'localhost';
process.env.PORT = '3000';
process.env.BIRTHDAY = '1990-01-01';
process.env.DATABASE_URL_TEST = 'postgres://localhost:5432/test';

test('zod schema', () => {
  const env = typeEnvironment(
    z.object({
      HOST: z.string(),
    }),
    {},
    process.env,
  );
  expect(env).toEqual({
    HOST: 'localhost',
  });
});

test('transform camelcase', () => {
  const env = typeEnvironment(
    z.object({
      PORT: z.string(),
      DATABASE_URL_TEST: z.string(),
    }),
    { transform: 'camelcase' },
    {
      HOST: 'localhost',
      PORT: '3000',
      BIRTHDAY: '1990-01-01',
      DATABASE_URL_TEST: 'postgres://localhost:5432/test',
    },
  );
  expect(env.databaseUrlTest).toEqual('postgres://localhost:5432/test');
});

test('transform kebab case', () => {
  const env = typeEnvironment(
    z.object({
      PORT: z.string(),
      DATABASE_URL_TEST: z.string(),
    }),
    { transform: 'kebabcase' },
    {
      HOST: 'localhost',
      PORT: '3000',
      BIRTHDAY: '1990-01-01',
      DATABASE_URL_TEST: 'postgres://localhost:5432/test',
    },
  );
  expect(env['database-url-test']).toEqual('postgres://localhost:5432/test');
});

test('remove vite prefix (pascalcase)', () => {
  const env = typeEnvironment(
    z.object({
      VITE_PORT: z.coerce.number(),
      VITE_DATABASE_URL_TEST: z.string(),
    }),
    { transform: 'pascalcase', excludePrefix: 'VITE' },
    {
      VITE_PORT: '4000',
      VITE_DATABASE_URL_TEST: 'postgres://localhost:5432/test',
    },
  );
  expect(env.DatabaseUrlTest).toEqual('postgres://localhost:5432/test');
});

test('coerce', () => {
  const env = typeEnvironment(
    z.object({
      PORT: z.coerce.number().int(),
      BIRTHDAY: z.coerce.date(),
      NODE_ENV: z.enum(['test', 'development', 'production']),
    }),
    {},
    process.env,
  );
  expect(env).toEqual({
    PORT: 3000,
    BIRTHDAY: new Date('1990-01-01'),
    NODE_ENV: 'test',
  });
});

test('validation failed', () => {
  expect(() =>
    typeEnvironment(
      z.object({
        HOST: z.number(),
        KRØLL: z.number(),
        BALL: z.number(),
      }),
      {},
      process.env,
    ),
  ).toThrow(
    "Environment variable validation failed:\n\t'HOST': Expected number, received string,\n\t'KRØLL': Required,\n\t'BALL': Required",
  );
});
