import { z } from 'zod';

const transformKeys =
  <TSchema extends Record<string, unknown>>(transformFn: (str: string) => string) =>
  (obj: TSchema) =>
    Object.fromEntries(Object.entries(obj).map(([key, value]) => [transformFn(key), value])) as TSchema;

const formatError = (error: z.ZodError) =>
  `Environment variable validation failed:${error.issues
    .map(issue => `\n\t'${issue.path.join(',')}': ${issue.message}`)
    .join(',')}`;

export const typeEnvironment = <TSchema extends Record<string, unknown>>(
  schema: z.Schema<TSchema>,
  transformKeyFn: (key: string) => string = key => key,
  formatErrorFn: (error: z.ZodError) => string = formatError,
) => {
  try {
    return schema.transform(transformKeys<TSchema>(transformKeyFn)).parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(formatErrorFn(error));
    }
    throw new Error('Environment variable validation failed');
  }
};
