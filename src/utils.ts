/* Start: Util functions taken from string-ts library */

function typeOf(t: unknown) {
  return Object.prototype.toString
    .call(t)
    .replace(/^\[object (.+)\]$/, '$1')
    .toLowerCase() as 'array' | 'object' | (string & {})
}

export function deepTransformKeys<T>(
  obj: T,
  transform: (s: string) => string,
): T {
  if (!['object', 'array'].includes(typeOf(obj))) return obj

  if (Array.isArray(obj)) {
    return obj.map((x) => deepTransformKeys(x, transform)) as T
  }
  const res = {} as T
  for (const key in obj) {
    res[transform(key) as keyof T] = deepTransformKeys(obj[key], transform)
  }
  return res
}

/* Stop: Util functions taken from string-ts library */
