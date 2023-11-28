import { test, expect } from 'vitest';
import { typeEnvironment } from '../src';
import { z } from 'zod';

process.env.HOST = 'localhost';
process.env.PORT = '3000';
process.env.BIRTHDAY = '1990-01-01';

test('zod schema', () => {
  const env = typeEnvironment(
    z.object({
      HOST: z.string(),
    }),
  );
  expect(env).toEqual({
    HOST: 'localhost',
  });
});

test('transform function', () => {
  const env = typeEnvironment(
    z.object({
      PORT: z.string(),
      HOST: z.string(),
    }),
    key => key.toLowerCase(),
  );
  expect(env).toEqual({
    port: '3000',
    host: 'localhost',
  });
});

test('coerce', () => {
  const env = typeEnvironment(
    z.object({
      PORT: z.coerce.number().int(),
      BIRTHDAY: z.coerce.date(),
      NODE_ENV: z.enum(['test', 'development', 'production']),
    }),
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
    ),
  ).toThrow(
    "Environment variable validation failed:\n\t'HOST': Expected number, received string,\n\t'KRØLL': Required,\n\t'BALL': Required",
  );
});
