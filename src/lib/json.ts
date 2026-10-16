declare const parsesTo: unique symbol;

/** A JSON string that `parseJson` turns back into a `T`. */
export type Json<T> = string & { readonly [parsesTo]?: T };

export function parseJson<T>(json: Json<T>): T {
  return JSON.parse(json) as T;
}
