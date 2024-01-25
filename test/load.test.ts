import { test, expect } from 'vitest';
import { typeEnvironment } from '../src';
import { z } from 'zod';

const overrideEnv = {
  HOST: 'localhost',
  PORT: '3000',
  BIRTHDAY: '1990-01-01',
  DATABASE_URL_TEST: 'postgres://localhost:5432/test',
  NODE_ENV: 'test',
};

test('zod schema', () => {
  const env = typeEnvironment(
    z.object({
      HOST: z.string(),
    }),
    undefined,
    overrideEnv,
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
    overrideEnv,
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
    overrideEnv,
  );
  expect(env['database-url-test']).toEqual('postgres://localhost:5432/test');
});

test('remove vite prefix (camelcase)', () => {
  const env = typeEnvironment(
    z.object({
      VITE_PORT: z.string(),
      VITE_DATABASE_URL_TEST: z.string(),
    }),
    { transform: 'camelcase', excludePrefix: 'VITE_' },
    {
      VITE_PORT: overrideEnv.PORT,
      VITE_DATABASE_URL_TEST: overrideEnv.DATABASE_URL_TEST,
    },
  );
  expect(env.databaseUrlTest).toEqual('postgres://localhost:5432/test');
  expect(env.port).toEqual('3000');
});

test('coerce', () => {
  const env = typeEnvironment(
    z.object({
      PORT: z.coerce.number().int(),
      BIRTHDAY: z.coerce.date(),
      NODE_ENV: z.enum(['test', 'development', 'production']),
    }),
    undefined,
    overrideEnv,
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
      undefined,
      overrideEnv,
    ),
  ).toThrow(
    "Environment variable validation failed:\n\t'HOST': Expected number, received string,\n\t'KRØLL': Required,\n\t'BALL': Required",
  );
});
