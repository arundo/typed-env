export type NamingConvention = 'camelcase' | 'pascalcase' | 'kebabcase' | 'default';

export type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${Lowercase<T>}${Capitalize<SnakeToCamelCase<U>>}`
  : Lowercase<S>;

export type SnakeToPascalCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${Capitalize<Lowercase<T>>}${SnakeToPascalCase<U>}`
  : Capitalize<Lowercase<S>>;

export type SnakeToKebabCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${Lowercase<T>}-${Lowercase<SnakeToKebabCase<U>>}`
  : Lowercase<S>;

export type ChangeCase<T extends NamingConvention, S extends string> = 'default' extends T
  ? S
  : 'camelcase' extends T
  ? SnakeToCamelCase<S>
  : 'pascalcase' extends T
  ? SnakeToPascalCase<S>
  : 'kebabcase' extends T
  ? SnakeToKebabCase<S>
  : S;
