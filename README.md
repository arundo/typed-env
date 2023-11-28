# @arundo/typed-env

Typed environment variables using [Zod](https://zod.dev/).

## Installation

```sh
npm install @arundo/typed-env

# or

yarn add @arundo/typed-env

# or

pnpm add @arundo/typed-env
```

## Usage

Create a environment file with a schema and use `typeEnvironment` to create a typed environment object.

```ts
// environment.ts
import { z } from 'zod';
import { typeEnvironment } from '@arundo/typed-env';

export const environment = typeEnvironment(z.object({
  NODE_ENV: z.enum(['test', 'development', 'production']),
  PORT: z.coerse.number().int().default(3000),
}));
```

Import the environment object and use it.

```ts
// server.ts
import { environment } from './environment';

console.log(environment.NODE_ENV); // 'development' - type string
console.log(environment.PORT); // 3000 - type number
```
