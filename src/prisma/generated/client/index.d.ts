
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model TrackPlay
 * 
 */
export type TrackPlay = $Result.DefaultSelection<Prisma.$TrackPlayPayload>
/**
 * Model Track
 * 
 */
export type Track = $Result.DefaultSelection<Prisma.$TrackPayload>
/**
 * Model Artist
 * 
 */
export type Artist = $Result.DefaultSelection<Prisma.$ArtistPayload>
/**
 * Model Album
 * 
 */
export type Album = $Result.DefaultSelection<Prisma.$AlbumPayload>
/**
 * Model Genre
 * 
 */
export type Genre = $Result.DefaultSelection<Prisma.$GenrePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more TrackPlays
 * const trackPlays = await prisma.trackPlay.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more TrackPlays
   * const trackPlays = await prisma.trackPlay.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.trackPlay`: Exposes CRUD operations for the **TrackPlay** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TrackPlays
    * const trackPlays = await prisma.trackPlay.findMany()
    * ```
    */
  get trackPlay(): Prisma.TrackPlayDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.track`: Exposes CRUD operations for the **Track** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Tracks
    * const tracks = await prisma.track.findMany()
    * ```
    */
  get track(): Prisma.TrackDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.artist`: Exposes CRUD operations for the **Artist** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Artists
    * const artists = await prisma.artist.findMany()
    * ```
    */
  get artist(): Prisma.ArtistDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.album`: Exposes CRUD operations for the **Album** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Albums
    * const albums = await prisma.album.findMany()
    * ```
    */
  get album(): Prisma.AlbumDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.genre`: Exposes CRUD operations for the **Genre** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Genres
    * const genres = await prisma.genre.findMany()
    * ```
    */
  get genre(): Prisma.GenreDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.8.2
   * Query Engine version: 2060c79ba17c6bb9f5823312b6f6b7f4a845738e
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    TrackPlay: 'TrackPlay',
    Track: 'Track',
    Artist: 'Artist',
    Album: 'Album',
    Genre: 'Genre'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "trackPlay" | "track" | "artist" | "album" | "genre"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      TrackPlay: {
        payload: Prisma.$TrackPlayPayload<ExtArgs>
        fields: Prisma.TrackPlayFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TrackPlayFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPlayPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TrackPlayFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPlayPayload>
          }
          findFirst: {
            args: Prisma.TrackPlayFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPlayPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TrackPlayFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPlayPayload>
          }
          findMany: {
            args: Prisma.TrackPlayFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPlayPayload>[]
          }
          create: {
            args: Prisma.TrackPlayCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPlayPayload>
          }
          createMany: {
            args: Prisma.TrackPlayCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TrackPlayCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPlayPayload>[]
          }
          delete: {
            args: Prisma.TrackPlayDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPlayPayload>
          }
          update: {
            args: Prisma.TrackPlayUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPlayPayload>
          }
          deleteMany: {
            args: Prisma.TrackPlayDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TrackPlayUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TrackPlayUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPlayPayload>[]
          }
          upsert: {
            args: Prisma.TrackPlayUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPlayPayload>
          }
          aggregate: {
            args: Prisma.TrackPlayAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTrackPlay>
          }
          groupBy: {
            args: Prisma.TrackPlayGroupByArgs<ExtArgs>
            result: $Utils.Optional<TrackPlayGroupByOutputType>[]
          }
          count: {
            args: Prisma.TrackPlayCountArgs<ExtArgs>
            result: $Utils.Optional<TrackPlayCountAggregateOutputType> | number
          }
        }
      }
      Track: {
        payload: Prisma.$TrackPayload<ExtArgs>
        fields: Prisma.TrackFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TrackFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TrackFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>
          }
          findFirst: {
            args: Prisma.TrackFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TrackFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>
          }
          findMany: {
            args: Prisma.TrackFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>[]
          }
          create: {
            args: Prisma.TrackCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>
          }
          createMany: {
            args: Prisma.TrackCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TrackCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>[]
          }
          delete: {
            args: Prisma.TrackDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>
          }
          update: {
            args: Prisma.TrackUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>
          }
          deleteMany: {
            args: Prisma.TrackDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TrackUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TrackUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>[]
          }
          upsert: {
            args: Prisma.TrackUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TrackPayload>
          }
          aggregate: {
            args: Prisma.TrackAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTrack>
          }
          groupBy: {
            args: Prisma.TrackGroupByArgs<ExtArgs>
            result: $Utils.Optional<TrackGroupByOutputType>[]
          }
          count: {
            args: Prisma.TrackCountArgs<ExtArgs>
            result: $Utils.Optional<TrackCountAggregateOutputType> | number
          }
        }
      }
      Artist: {
        payload: Prisma.$ArtistPayload<ExtArgs>
        fields: Prisma.ArtistFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ArtistFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ArtistFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>
          }
          findFirst: {
            args: Prisma.ArtistFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ArtistFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>
          }
          findMany: {
            args: Prisma.ArtistFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>[]
          }
          create: {
            args: Prisma.ArtistCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>
          }
          createMany: {
            args: Prisma.ArtistCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ArtistCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>[]
          }
          delete: {
            args: Prisma.ArtistDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>
          }
          update: {
            args: Prisma.ArtistUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>
          }
          deleteMany: {
            args: Prisma.ArtistDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ArtistUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ArtistUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>[]
          }
          upsert: {
            args: Prisma.ArtistUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ArtistPayload>
          }
          aggregate: {
            args: Prisma.ArtistAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateArtist>
          }
          groupBy: {
            args: Prisma.ArtistGroupByArgs<ExtArgs>
            result: $Utils.Optional<ArtistGroupByOutputType>[]
          }
          count: {
            args: Prisma.ArtistCountArgs<ExtArgs>
            result: $Utils.Optional<ArtistCountAggregateOutputType> | number
          }
        }
      }
      Album: {
        payload: Prisma.$AlbumPayload<ExtArgs>
        fields: Prisma.AlbumFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AlbumFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlbumPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AlbumFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlbumPayload>
          }
          findFirst: {
            args: Prisma.AlbumFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlbumPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AlbumFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlbumPayload>
          }
          findMany: {
            args: Prisma.AlbumFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlbumPayload>[]
          }
          create: {
            args: Prisma.AlbumCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlbumPayload>
          }
          createMany: {
            args: Prisma.AlbumCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AlbumCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlbumPayload>[]
          }
          delete: {
            args: Prisma.AlbumDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlbumPayload>
          }
          update: {
            args: Prisma.AlbumUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlbumPayload>
          }
          deleteMany: {
            args: Prisma.AlbumDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AlbumUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AlbumUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlbumPayload>[]
          }
          upsert: {
            args: Prisma.AlbumUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlbumPayload>
          }
          aggregate: {
            args: Prisma.AlbumAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAlbum>
          }
          groupBy: {
            args: Prisma.AlbumGroupByArgs<ExtArgs>
            result: $Utils.Optional<AlbumGroupByOutputType>[]
          }
          count: {
            args: Prisma.AlbumCountArgs<ExtArgs>
            result: $Utils.Optional<AlbumCountAggregateOutputType> | number
          }
        }
      }
      Genre: {
        payload: Prisma.$GenrePayload<ExtArgs>
        fields: Prisma.GenreFieldRefs
        operations: {
          findUnique: {
            args: Prisma.GenreFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenrePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.GenreFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenrePayload>
          }
          findFirst: {
            args: Prisma.GenreFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenrePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.GenreFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenrePayload>
          }
          findMany: {
            args: Prisma.GenreFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenrePayload>[]
          }
          create: {
            args: Prisma.GenreCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenrePayload>
          }
          createMany: {
            args: Prisma.GenreCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.GenreCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenrePayload>[]
          }
          delete: {
            args: Prisma.GenreDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenrePayload>
          }
          update: {
            args: Prisma.GenreUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenrePayload>
          }
          deleteMany: {
            args: Prisma.GenreDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.GenreUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.GenreUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenrePayload>[]
          }
          upsert: {
            args: Prisma.GenreUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$GenrePayload>
          }
          aggregate: {
            args: Prisma.GenreAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateGenre>
          }
          groupBy: {
            args: Prisma.GenreGroupByArgs<ExtArgs>
            result: $Utils.Optional<GenreGroupByOutputType>[]
          }
          count: {
            args: Prisma.GenreCountArgs<ExtArgs>
            result: $Utils.Optional<GenreCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    trackPlay?: TrackPlayOmit
    track?: TrackOmit
    artist?: ArtistOmit
    album?: AlbumOmit
    genre?: GenreOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type TrackCountOutputType
   */

  export type TrackCountOutputType = {
    artists: number
    TrackPlay: number
  }

  export type TrackCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artists?: boolean | TrackCountOutputTypeCountArtistsArgs
    TrackPlay?: boolean | TrackCountOutputTypeCountTrackPlayArgs
  }

  // Custom InputTypes
  /**
   * TrackCountOutputType without action
   */
  export type TrackCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCountOutputType
     */
    select?: TrackCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * TrackCountOutputType without action
   */
  export type TrackCountOutputTypeCountArtistsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ArtistWhereInput
  }

  /**
   * TrackCountOutputType without action
   */
  export type TrackCountOutputTypeCountTrackPlayArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TrackPlayWhereInput
  }


  /**
   * Count Type ArtistCountOutputType
   */

  export type ArtistCountOutputType = {
    tracks: number
    genres: number
  }

  export type ArtistCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tracks?: boolean | ArtistCountOutputTypeCountTracksArgs
    genres?: boolean | ArtistCountOutputTypeCountGenresArgs
  }

  // Custom InputTypes
  /**
   * ArtistCountOutputType without action
   */
  export type ArtistCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ArtistCountOutputType
     */
    select?: ArtistCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ArtistCountOutputType without action
   */
  export type ArtistCountOutputTypeCountTracksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TrackWhereInput
  }

  /**
   * ArtistCountOutputType without action
   */
  export type ArtistCountOutputTypeCountGenresArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GenreWhereInput
  }


  /**
   * Count Type AlbumCountOutputType
   */

  export type AlbumCountOutputType = {
    tracks: number
  }

  export type AlbumCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tracks?: boolean | AlbumCountOutputTypeCountTracksArgs
  }

  // Custom InputTypes
  /**
   * AlbumCountOutputType without action
   */
  export type AlbumCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlbumCountOutputType
     */
    select?: AlbumCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AlbumCountOutputType without action
   */
  export type AlbumCountOutputTypeCountTracksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TrackWhereInput
  }


  /**
   * Count Type GenreCountOutputType
   */

  export type GenreCountOutputType = {
    artists: number
  }

  export type GenreCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artists?: boolean | GenreCountOutputTypeCountArtistsArgs
  }

  // Custom InputTypes
  /**
   * GenreCountOutputType without action
   */
  export type GenreCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GenreCountOutputType
     */
    select?: GenreCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * GenreCountOutputType without action
   */
  export type GenreCountOutputTypeCountArtistsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ArtistWhereInput
  }


  /**
   * Models
   */

  /**
   * Model TrackPlay
   */

  export type AggregateTrackPlay = {
    _count: TrackPlayCountAggregateOutputType | null
    _min: TrackPlayMinAggregateOutputType | null
    _max: TrackPlayMaxAggregateOutputType | null
  }

  export type TrackPlayMinAggregateOutputType = {
    id: string | null
    trackId: string | null
    playedAt: Date | null
    userId: string | null
  }

  export type TrackPlayMaxAggregateOutputType = {
    id: string | null
    trackId: string | null
    playedAt: Date | null
    userId: string | null
  }

  export type TrackPlayCountAggregateOutputType = {
    id: number
    trackId: number
    playedAt: number
    userId: number
    _all: number
  }


  export type TrackPlayMinAggregateInputType = {
    id?: true
    trackId?: true
    playedAt?: true
    userId?: true
  }

  export type TrackPlayMaxAggregateInputType = {
    id?: true
    trackId?: true
    playedAt?: true
    userId?: true
  }

  export type TrackPlayCountAggregateInputType = {
    id?: true
    trackId?: true
    playedAt?: true
    userId?: true
    _all?: true
  }

  export type TrackPlayAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TrackPlay to aggregate.
     */
    where?: TrackPlayWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrackPlays to fetch.
     */
    orderBy?: TrackPlayOrderByWithRelationInput | TrackPlayOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TrackPlayWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrackPlays from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrackPlays.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TrackPlays
    **/
    _count?: true | TrackPlayCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TrackPlayMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TrackPlayMaxAggregateInputType
  }

  export type GetTrackPlayAggregateType<T extends TrackPlayAggregateArgs> = {
        [P in keyof T & keyof AggregateTrackPlay]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTrackPlay[P]>
      : GetScalarType<T[P], AggregateTrackPlay[P]>
  }




  export type TrackPlayGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TrackPlayWhereInput
    orderBy?: TrackPlayOrderByWithAggregationInput | TrackPlayOrderByWithAggregationInput[]
    by: TrackPlayScalarFieldEnum[] | TrackPlayScalarFieldEnum
    having?: TrackPlayScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TrackPlayCountAggregateInputType | true
    _min?: TrackPlayMinAggregateInputType
    _max?: TrackPlayMaxAggregateInputType
  }

  export type TrackPlayGroupByOutputType = {
    id: string
    trackId: string
    playedAt: Date
    userId: string
    _count: TrackPlayCountAggregateOutputType | null
    _min: TrackPlayMinAggregateOutputType | null
    _max: TrackPlayMaxAggregateOutputType | null
  }

  type GetTrackPlayGroupByPayload<T extends TrackPlayGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TrackPlayGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TrackPlayGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TrackPlayGroupByOutputType[P]>
            : GetScalarType<T[P], TrackPlayGroupByOutputType[P]>
        }
      >
    >


  export type TrackPlaySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    trackId?: boolean
    playedAt?: boolean
    userId?: boolean
    track?: boolean | TrackDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["trackPlay"]>

  export type TrackPlaySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    trackId?: boolean
    playedAt?: boolean
    userId?: boolean
    track?: boolean | TrackDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["trackPlay"]>

  export type TrackPlaySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    trackId?: boolean
    playedAt?: boolean
    userId?: boolean
    track?: boolean | TrackDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["trackPlay"]>

  export type TrackPlaySelectScalar = {
    id?: boolean
    trackId?: boolean
    playedAt?: boolean
    userId?: boolean
  }

  export type TrackPlayOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "trackId" | "playedAt" | "userId", ExtArgs["result"]["trackPlay"]>
  export type TrackPlayInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    track?: boolean | TrackDefaultArgs<ExtArgs>
  }
  export type TrackPlayIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    track?: boolean | TrackDefaultArgs<ExtArgs>
  }
  export type TrackPlayIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    track?: boolean | TrackDefaultArgs<ExtArgs>
  }

  export type $TrackPlayPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TrackPlay"
    objects: {
      track: Prisma.$TrackPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      trackId: string
      playedAt: Date
      userId: string
    }, ExtArgs["result"]["trackPlay"]>
    composites: {}
  }

  type TrackPlayGetPayload<S extends boolean | null | undefined | TrackPlayDefaultArgs> = $Result.GetResult<Prisma.$TrackPlayPayload, S>

  type TrackPlayCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TrackPlayFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TrackPlayCountAggregateInputType | true
    }

  export interface TrackPlayDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TrackPlay'], meta: { name: 'TrackPlay' } }
    /**
     * Find zero or one TrackPlay that matches the filter.
     * @param {TrackPlayFindUniqueArgs} args - Arguments to find a TrackPlay
     * @example
     * // Get one TrackPlay
     * const trackPlay = await prisma.trackPlay.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TrackPlayFindUniqueArgs>(args: SelectSubset<T, TrackPlayFindUniqueArgs<ExtArgs>>): Prisma__TrackPlayClient<$Result.GetResult<Prisma.$TrackPlayPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TrackPlay that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TrackPlayFindUniqueOrThrowArgs} args - Arguments to find a TrackPlay
     * @example
     * // Get one TrackPlay
     * const trackPlay = await prisma.trackPlay.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TrackPlayFindUniqueOrThrowArgs>(args: SelectSubset<T, TrackPlayFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TrackPlayClient<$Result.GetResult<Prisma.$TrackPlayPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TrackPlay that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackPlayFindFirstArgs} args - Arguments to find a TrackPlay
     * @example
     * // Get one TrackPlay
     * const trackPlay = await prisma.trackPlay.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TrackPlayFindFirstArgs>(args?: SelectSubset<T, TrackPlayFindFirstArgs<ExtArgs>>): Prisma__TrackPlayClient<$Result.GetResult<Prisma.$TrackPlayPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TrackPlay that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackPlayFindFirstOrThrowArgs} args - Arguments to find a TrackPlay
     * @example
     * // Get one TrackPlay
     * const trackPlay = await prisma.trackPlay.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TrackPlayFindFirstOrThrowArgs>(args?: SelectSubset<T, TrackPlayFindFirstOrThrowArgs<ExtArgs>>): Prisma__TrackPlayClient<$Result.GetResult<Prisma.$TrackPlayPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TrackPlays that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackPlayFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TrackPlays
     * const trackPlays = await prisma.trackPlay.findMany()
     * 
     * // Get first 10 TrackPlays
     * const trackPlays = await prisma.trackPlay.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const trackPlayWithIdOnly = await prisma.trackPlay.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TrackPlayFindManyArgs>(args?: SelectSubset<T, TrackPlayFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrackPlayPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TrackPlay.
     * @param {TrackPlayCreateArgs} args - Arguments to create a TrackPlay.
     * @example
     * // Create one TrackPlay
     * const TrackPlay = await prisma.trackPlay.create({
     *   data: {
     *     // ... data to create a TrackPlay
     *   }
     * })
     * 
     */
    create<T extends TrackPlayCreateArgs>(args: SelectSubset<T, TrackPlayCreateArgs<ExtArgs>>): Prisma__TrackPlayClient<$Result.GetResult<Prisma.$TrackPlayPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TrackPlays.
     * @param {TrackPlayCreateManyArgs} args - Arguments to create many TrackPlays.
     * @example
     * // Create many TrackPlays
     * const trackPlay = await prisma.trackPlay.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TrackPlayCreateManyArgs>(args?: SelectSubset<T, TrackPlayCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TrackPlays and returns the data saved in the database.
     * @param {TrackPlayCreateManyAndReturnArgs} args - Arguments to create many TrackPlays.
     * @example
     * // Create many TrackPlays
     * const trackPlay = await prisma.trackPlay.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TrackPlays and only return the `id`
     * const trackPlayWithIdOnly = await prisma.trackPlay.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TrackPlayCreateManyAndReturnArgs>(args?: SelectSubset<T, TrackPlayCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrackPlayPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TrackPlay.
     * @param {TrackPlayDeleteArgs} args - Arguments to delete one TrackPlay.
     * @example
     * // Delete one TrackPlay
     * const TrackPlay = await prisma.trackPlay.delete({
     *   where: {
     *     // ... filter to delete one TrackPlay
     *   }
     * })
     * 
     */
    delete<T extends TrackPlayDeleteArgs>(args: SelectSubset<T, TrackPlayDeleteArgs<ExtArgs>>): Prisma__TrackPlayClient<$Result.GetResult<Prisma.$TrackPlayPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TrackPlay.
     * @param {TrackPlayUpdateArgs} args - Arguments to update one TrackPlay.
     * @example
     * // Update one TrackPlay
     * const trackPlay = await prisma.trackPlay.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TrackPlayUpdateArgs>(args: SelectSubset<T, TrackPlayUpdateArgs<ExtArgs>>): Prisma__TrackPlayClient<$Result.GetResult<Prisma.$TrackPlayPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TrackPlays.
     * @param {TrackPlayDeleteManyArgs} args - Arguments to filter TrackPlays to delete.
     * @example
     * // Delete a few TrackPlays
     * const { count } = await prisma.trackPlay.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TrackPlayDeleteManyArgs>(args?: SelectSubset<T, TrackPlayDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TrackPlays.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackPlayUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TrackPlays
     * const trackPlay = await prisma.trackPlay.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TrackPlayUpdateManyArgs>(args: SelectSubset<T, TrackPlayUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TrackPlays and returns the data updated in the database.
     * @param {TrackPlayUpdateManyAndReturnArgs} args - Arguments to update many TrackPlays.
     * @example
     * // Update many TrackPlays
     * const trackPlay = await prisma.trackPlay.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TrackPlays and only return the `id`
     * const trackPlayWithIdOnly = await prisma.trackPlay.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TrackPlayUpdateManyAndReturnArgs>(args: SelectSubset<T, TrackPlayUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrackPlayPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TrackPlay.
     * @param {TrackPlayUpsertArgs} args - Arguments to update or create a TrackPlay.
     * @example
     * // Update or create a TrackPlay
     * const trackPlay = await prisma.trackPlay.upsert({
     *   create: {
     *     // ... data to create a TrackPlay
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TrackPlay we want to update
     *   }
     * })
     */
    upsert<T extends TrackPlayUpsertArgs>(args: SelectSubset<T, TrackPlayUpsertArgs<ExtArgs>>): Prisma__TrackPlayClient<$Result.GetResult<Prisma.$TrackPlayPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TrackPlays.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackPlayCountArgs} args - Arguments to filter TrackPlays to count.
     * @example
     * // Count the number of TrackPlays
     * const count = await prisma.trackPlay.count({
     *   where: {
     *     // ... the filter for the TrackPlays we want to count
     *   }
     * })
    **/
    count<T extends TrackPlayCountArgs>(
      args?: Subset<T, TrackPlayCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TrackPlayCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TrackPlay.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackPlayAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TrackPlayAggregateArgs>(args: Subset<T, TrackPlayAggregateArgs>): Prisma.PrismaPromise<GetTrackPlayAggregateType<T>>

    /**
     * Group by TrackPlay.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackPlayGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TrackPlayGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TrackPlayGroupByArgs['orderBy'] }
        : { orderBy?: TrackPlayGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TrackPlayGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTrackPlayGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TrackPlay model
   */
  readonly fields: TrackPlayFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TrackPlay.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TrackPlayClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    track<T extends TrackDefaultArgs<ExtArgs> = {}>(args?: Subset<T, TrackDefaultArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TrackPlay model
   */
  interface TrackPlayFieldRefs {
    readonly id: FieldRef<"TrackPlay", 'String'>
    readonly trackId: FieldRef<"TrackPlay", 'String'>
    readonly playedAt: FieldRef<"TrackPlay", 'DateTime'>
    readonly userId: FieldRef<"TrackPlay", 'String'>
  }
    

  // Custom InputTypes
  /**
   * TrackPlay findUnique
   */
  export type TrackPlayFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayInclude<ExtArgs> | null
    /**
     * Filter, which TrackPlay to fetch.
     */
    where: TrackPlayWhereUniqueInput
  }

  /**
   * TrackPlay findUniqueOrThrow
   */
  export type TrackPlayFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayInclude<ExtArgs> | null
    /**
     * Filter, which TrackPlay to fetch.
     */
    where: TrackPlayWhereUniqueInput
  }

  /**
   * TrackPlay findFirst
   */
  export type TrackPlayFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayInclude<ExtArgs> | null
    /**
     * Filter, which TrackPlay to fetch.
     */
    where?: TrackPlayWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrackPlays to fetch.
     */
    orderBy?: TrackPlayOrderByWithRelationInput | TrackPlayOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TrackPlays.
     */
    cursor?: TrackPlayWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrackPlays from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrackPlays.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TrackPlays.
     */
    distinct?: TrackPlayScalarFieldEnum | TrackPlayScalarFieldEnum[]
  }

  /**
   * TrackPlay findFirstOrThrow
   */
  export type TrackPlayFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayInclude<ExtArgs> | null
    /**
     * Filter, which TrackPlay to fetch.
     */
    where?: TrackPlayWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrackPlays to fetch.
     */
    orderBy?: TrackPlayOrderByWithRelationInput | TrackPlayOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TrackPlays.
     */
    cursor?: TrackPlayWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrackPlays from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrackPlays.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TrackPlays.
     */
    distinct?: TrackPlayScalarFieldEnum | TrackPlayScalarFieldEnum[]
  }

  /**
   * TrackPlay findMany
   */
  export type TrackPlayFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayInclude<ExtArgs> | null
    /**
     * Filter, which TrackPlays to fetch.
     */
    where?: TrackPlayWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TrackPlays to fetch.
     */
    orderBy?: TrackPlayOrderByWithRelationInput | TrackPlayOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TrackPlays.
     */
    cursor?: TrackPlayWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TrackPlays from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TrackPlays.
     */
    skip?: number
    distinct?: TrackPlayScalarFieldEnum | TrackPlayScalarFieldEnum[]
  }

  /**
   * TrackPlay create
   */
  export type TrackPlayCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayInclude<ExtArgs> | null
    /**
     * The data needed to create a TrackPlay.
     */
    data: XOR<TrackPlayCreateInput, TrackPlayUncheckedCreateInput>
  }

  /**
   * TrackPlay createMany
   */
  export type TrackPlayCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TrackPlays.
     */
    data: TrackPlayCreateManyInput | TrackPlayCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TrackPlay createManyAndReturn
   */
  export type TrackPlayCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * The data used to create many TrackPlays.
     */
    data: TrackPlayCreateManyInput | TrackPlayCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * TrackPlay update
   */
  export type TrackPlayUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayInclude<ExtArgs> | null
    /**
     * The data needed to update a TrackPlay.
     */
    data: XOR<TrackPlayUpdateInput, TrackPlayUncheckedUpdateInput>
    /**
     * Choose, which TrackPlay to update.
     */
    where: TrackPlayWhereUniqueInput
  }

  /**
   * TrackPlay updateMany
   */
  export type TrackPlayUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TrackPlays.
     */
    data: XOR<TrackPlayUpdateManyMutationInput, TrackPlayUncheckedUpdateManyInput>
    /**
     * Filter which TrackPlays to update
     */
    where?: TrackPlayWhereInput
    /**
     * Limit how many TrackPlays to update.
     */
    limit?: number
  }

  /**
   * TrackPlay updateManyAndReturn
   */
  export type TrackPlayUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * The data used to update TrackPlays.
     */
    data: XOR<TrackPlayUpdateManyMutationInput, TrackPlayUncheckedUpdateManyInput>
    /**
     * Filter which TrackPlays to update
     */
    where?: TrackPlayWhereInput
    /**
     * Limit how many TrackPlays to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * TrackPlay upsert
   */
  export type TrackPlayUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayInclude<ExtArgs> | null
    /**
     * The filter to search for the TrackPlay to update in case it exists.
     */
    where: TrackPlayWhereUniqueInput
    /**
     * In case the TrackPlay found by the `where` argument doesn't exist, create a new TrackPlay with this data.
     */
    create: XOR<TrackPlayCreateInput, TrackPlayUncheckedCreateInput>
    /**
     * In case the TrackPlay was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TrackPlayUpdateInput, TrackPlayUncheckedUpdateInput>
  }

  /**
   * TrackPlay delete
   */
  export type TrackPlayDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayInclude<ExtArgs> | null
    /**
     * Filter which TrackPlay to delete.
     */
    where: TrackPlayWhereUniqueInput
  }

  /**
   * TrackPlay deleteMany
   */
  export type TrackPlayDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TrackPlays to delete
     */
    where?: TrackPlayWhereInput
    /**
     * Limit how many TrackPlays to delete.
     */
    limit?: number
  }

  /**
   * TrackPlay without action
   */
  export type TrackPlayDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayInclude<ExtArgs> | null
  }


  /**
   * Model Track
   */

  export type AggregateTrack = {
    _count: TrackCountAggregateOutputType | null
    _avg: TrackAvgAggregateOutputType | null
    _sum: TrackSumAggregateOutputType | null
    _min: TrackMinAggregateOutputType | null
    _max: TrackMaxAggregateOutputType | null
  }

  export type TrackAvgAggregateOutputType = {
    duration: number | null
  }

  export type TrackSumAggregateOutputType = {
    duration: number | null
  }

  export type TrackMinAggregateOutputType = {
    id: string | null
    name: string | null
    duration: number | null
    url: string | null
    image: string | null
    albumId: string | null
  }

  export type TrackMaxAggregateOutputType = {
    id: string | null
    name: string | null
    duration: number | null
    url: string | null
    image: string | null
    albumId: string | null
  }

  export type TrackCountAggregateOutputType = {
    id: number
    name: number
    duration: number
    url: number
    image: number
    albumId: number
    _all: number
  }


  export type TrackAvgAggregateInputType = {
    duration?: true
  }

  export type TrackSumAggregateInputType = {
    duration?: true
  }

  export type TrackMinAggregateInputType = {
    id?: true
    name?: true
    duration?: true
    url?: true
    image?: true
    albumId?: true
  }

  export type TrackMaxAggregateInputType = {
    id?: true
    name?: true
    duration?: true
    url?: true
    image?: true
    albumId?: true
  }

  export type TrackCountAggregateInputType = {
    id?: true
    name?: true
    duration?: true
    url?: true
    image?: true
    albumId?: true
    _all?: true
  }

  export type TrackAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Track to aggregate.
     */
    where?: TrackWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tracks to fetch.
     */
    orderBy?: TrackOrderByWithRelationInput | TrackOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TrackWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tracks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tracks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Tracks
    **/
    _count?: true | TrackCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TrackAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TrackSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TrackMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TrackMaxAggregateInputType
  }

  export type GetTrackAggregateType<T extends TrackAggregateArgs> = {
        [P in keyof T & keyof AggregateTrack]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTrack[P]>
      : GetScalarType<T[P], AggregateTrack[P]>
  }




  export type TrackGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TrackWhereInput
    orderBy?: TrackOrderByWithAggregationInput | TrackOrderByWithAggregationInput[]
    by: TrackScalarFieldEnum[] | TrackScalarFieldEnum
    having?: TrackScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TrackCountAggregateInputType | true
    _avg?: TrackAvgAggregateInputType
    _sum?: TrackSumAggregateInputType
    _min?: TrackMinAggregateInputType
    _max?: TrackMaxAggregateInputType
  }

  export type TrackGroupByOutputType = {
    id: string
    name: string
    duration: number
    url: string
    image: string | null
    albumId: string
    _count: TrackCountAggregateOutputType | null
    _avg: TrackAvgAggregateOutputType | null
    _sum: TrackSumAggregateOutputType | null
    _min: TrackMinAggregateOutputType | null
    _max: TrackMaxAggregateOutputType | null
  }

  type GetTrackGroupByPayload<T extends TrackGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TrackGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TrackGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TrackGroupByOutputType[P]>
            : GetScalarType<T[P], TrackGroupByOutputType[P]>
        }
      >
    >


  export type TrackSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    duration?: boolean
    url?: boolean
    image?: boolean
    albumId?: boolean
    album?: boolean | AlbumDefaultArgs<ExtArgs>
    artists?: boolean | Track$artistsArgs<ExtArgs>
    TrackPlay?: boolean | Track$TrackPlayArgs<ExtArgs>
    _count?: boolean | TrackCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["track"]>

  export type TrackSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    duration?: boolean
    url?: boolean
    image?: boolean
    albumId?: boolean
    album?: boolean | AlbumDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["track"]>

  export type TrackSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    duration?: boolean
    url?: boolean
    image?: boolean
    albumId?: boolean
    album?: boolean | AlbumDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["track"]>

  export type TrackSelectScalar = {
    id?: boolean
    name?: boolean
    duration?: boolean
    url?: boolean
    image?: boolean
    albumId?: boolean
  }

  export type TrackOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "duration" | "url" | "image" | "albumId", ExtArgs["result"]["track"]>
  export type TrackInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    album?: boolean | AlbumDefaultArgs<ExtArgs>
    artists?: boolean | Track$artistsArgs<ExtArgs>
    TrackPlay?: boolean | Track$TrackPlayArgs<ExtArgs>
    _count?: boolean | TrackCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type TrackIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    album?: boolean | AlbumDefaultArgs<ExtArgs>
  }
  export type TrackIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    album?: boolean | AlbumDefaultArgs<ExtArgs>
  }

  export type $TrackPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Track"
    objects: {
      album: Prisma.$AlbumPayload<ExtArgs>
      artists: Prisma.$ArtistPayload<ExtArgs>[]
      TrackPlay: Prisma.$TrackPlayPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      duration: number
      url: string
      image: string | null
      albumId: string
    }, ExtArgs["result"]["track"]>
    composites: {}
  }

  type TrackGetPayload<S extends boolean | null | undefined | TrackDefaultArgs> = $Result.GetResult<Prisma.$TrackPayload, S>

  type TrackCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TrackFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TrackCountAggregateInputType | true
    }

  export interface TrackDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Track'], meta: { name: 'Track' } }
    /**
     * Find zero or one Track that matches the filter.
     * @param {TrackFindUniqueArgs} args - Arguments to find a Track
     * @example
     * // Get one Track
     * const track = await prisma.track.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TrackFindUniqueArgs>(args: SelectSubset<T, TrackFindUniqueArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Track that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TrackFindUniqueOrThrowArgs} args - Arguments to find a Track
     * @example
     * // Get one Track
     * const track = await prisma.track.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TrackFindUniqueOrThrowArgs>(args: SelectSubset<T, TrackFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Track that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackFindFirstArgs} args - Arguments to find a Track
     * @example
     * // Get one Track
     * const track = await prisma.track.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TrackFindFirstArgs>(args?: SelectSubset<T, TrackFindFirstArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Track that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackFindFirstOrThrowArgs} args - Arguments to find a Track
     * @example
     * // Get one Track
     * const track = await prisma.track.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TrackFindFirstOrThrowArgs>(args?: SelectSubset<T, TrackFindFirstOrThrowArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Tracks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Tracks
     * const tracks = await prisma.track.findMany()
     * 
     * // Get first 10 Tracks
     * const tracks = await prisma.track.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const trackWithIdOnly = await prisma.track.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TrackFindManyArgs>(args?: SelectSubset<T, TrackFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Track.
     * @param {TrackCreateArgs} args - Arguments to create a Track.
     * @example
     * // Create one Track
     * const Track = await prisma.track.create({
     *   data: {
     *     // ... data to create a Track
     *   }
     * })
     * 
     */
    create<T extends TrackCreateArgs>(args: SelectSubset<T, TrackCreateArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Tracks.
     * @param {TrackCreateManyArgs} args - Arguments to create many Tracks.
     * @example
     * // Create many Tracks
     * const track = await prisma.track.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TrackCreateManyArgs>(args?: SelectSubset<T, TrackCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Tracks and returns the data saved in the database.
     * @param {TrackCreateManyAndReturnArgs} args - Arguments to create many Tracks.
     * @example
     * // Create many Tracks
     * const track = await prisma.track.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Tracks and only return the `id`
     * const trackWithIdOnly = await prisma.track.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TrackCreateManyAndReturnArgs>(args?: SelectSubset<T, TrackCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Track.
     * @param {TrackDeleteArgs} args - Arguments to delete one Track.
     * @example
     * // Delete one Track
     * const Track = await prisma.track.delete({
     *   where: {
     *     // ... filter to delete one Track
     *   }
     * })
     * 
     */
    delete<T extends TrackDeleteArgs>(args: SelectSubset<T, TrackDeleteArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Track.
     * @param {TrackUpdateArgs} args - Arguments to update one Track.
     * @example
     * // Update one Track
     * const track = await prisma.track.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TrackUpdateArgs>(args: SelectSubset<T, TrackUpdateArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Tracks.
     * @param {TrackDeleteManyArgs} args - Arguments to filter Tracks to delete.
     * @example
     * // Delete a few Tracks
     * const { count } = await prisma.track.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TrackDeleteManyArgs>(args?: SelectSubset<T, TrackDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tracks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Tracks
     * const track = await prisma.track.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TrackUpdateManyArgs>(args: SelectSubset<T, TrackUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Tracks and returns the data updated in the database.
     * @param {TrackUpdateManyAndReturnArgs} args - Arguments to update many Tracks.
     * @example
     * // Update many Tracks
     * const track = await prisma.track.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Tracks and only return the `id`
     * const trackWithIdOnly = await prisma.track.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TrackUpdateManyAndReturnArgs>(args: SelectSubset<T, TrackUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Track.
     * @param {TrackUpsertArgs} args - Arguments to update or create a Track.
     * @example
     * // Update or create a Track
     * const track = await prisma.track.upsert({
     *   create: {
     *     // ... data to create a Track
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Track we want to update
     *   }
     * })
     */
    upsert<T extends TrackUpsertArgs>(args: SelectSubset<T, TrackUpsertArgs<ExtArgs>>): Prisma__TrackClient<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Tracks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackCountArgs} args - Arguments to filter Tracks to count.
     * @example
     * // Count the number of Tracks
     * const count = await prisma.track.count({
     *   where: {
     *     // ... the filter for the Tracks we want to count
     *   }
     * })
    **/
    count<T extends TrackCountArgs>(
      args?: Subset<T, TrackCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TrackCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Track.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TrackAggregateArgs>(args: Subset<T, TrackAggregateArgs>): Prisma.PrismaPromise<GetTrackAggregateType<T>>

    /**
     * Group by Track.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TrackGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TrackGroupByArgs['orderBy'] }
        : { orderBy?: TrackGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TrackGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTrackGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Track model
   */
  readonly fields: TrackFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Track.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TrackClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    album<T extends AlbumDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AlbumDefaultArgs<ExtArgs>>): Prisma__AlbumClient<$Result.GetResult<Prisma.$AlbumPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    artists<T extends Track$artistsArgs<ExtArgs> = {}>(args?: Subset<T, Track$artistsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    TrackPlay<T extends Track$TrackPlayArgs<ExtArgs> = {}>(args?: Subset<T, Track$TrackPlayArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrackPlayPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Track model
   */
  interface TrackFieldRefs {
    readonly id: FieldRef<"Track", 'String'>
    readonly name: FieldRef<"Track", 'String'>
    readonly duration: FieldRef<"Track", 'Int'>
    readonly url: FieldRef<"Track", 'String'>
    readonly image: FieldRef<"Track", 'String'>
    readonly albumId: FieldRef<"Track", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Track findUnique
   */
  export type TrackFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * Filter, which Track to fetch.
     */
    where: TrackWhereUniqueInput
  }

  /**
   * Track findUniqueOrThrow
   */
  export type TrackFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * Filter, which Track to fetch.
     */
    where: TrackWhereUniqueInput
  }

  /**
   * Track findFirst
   */
  export type TrackFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * Filter, which Track to fetch.
     */
    where?: TrackWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tracks to fetch.
     */
    orderBy?: TrackOrderByWithRelationInput | TrackOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tracks.
     */
    cursor?: TrackWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tracks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tracks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tracks.
     */
    distinct?: TrackScalarFieldEnum | TrackScalarFieldEnum[]
  }

  /**
   * Track findFirstOrThrow
   */
  export type TrackFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * Filter, which Track to fetch.
     */
    where?: TrackWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tracks to fetch.
     */
    orderBy?: TrackOrderByWithRelationInput | TrackOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Tracks.
     */
    cursor?: TrackWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tracks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tracks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Tracks.
     */
    distinct?: TrackScalarFieldEnum | TrackScalarFieldEnum[]
  }

  /**
   * Track findMany
   */
  export type TrackFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * Filter, which Tracks to fetch.
     */
    where?: TrackWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Tracks to fetch.
     */
    orderBy?: TrackOrderByWithRelationInput | TrackOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Tracks.
     */
    cursor?: TrackWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Tracks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Tracks.
     */
    skip?: number
    distinct?: TrackScalarFieldEnum | TrackScalarFieldEnum[]
  }

  /**
   * Track create
   */
  export type TrackCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * The data needed to create a Track.
     */
    data: XOR<TrackCreateInput, TrackUncheckedCreateInput>
  }

  /**
   * Track createMany
   */
  export type TrackCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Tracks.
     */
    data: TrackCreateManyInput | TrackCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Track createManyAndReturn
   */
  export type TrackCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * The data used to create many Tracks.
     */
    data: TrackCreateManyInput | TrackCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Track update
   */
  export type TrackUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * The data needed to update a Track.
     */
    data: XOR<TrackUpdateInput, TrackUncheckedUpdateInput>
    /**
     * Choose, which Track to update.
     */
    where: TrackWhereUniqueInput
  }

  /**
   * Track updateMany
   */
  export type TrackUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Tracks.
     */
    data: XOR<TrackUpdateManyMutationInput, TrackUncheckedUpdateManyInput>
    /**
     * Filter which Tracks to update
     */
    where?: TrackWhereInput
    /**
     * Limit how many Tracks to update.
     */
    limit?: number
  }

  /**
   * Track updateManyAndReturn
   */
  export type TrackUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * The data used to update Tracks.
     */
    data: XOR<TrackUpdateManyMutationInput, TrackUncheckedUpdateManyInput>
    /**
     * Filter which Tracks to update
     */
    where?: TrackWhereInput
    /**
     * Limit how many Tracks to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Track upsert
   */
  export type TrackUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * The filter to search for the Track to update in case it exists.
     */
    where: TrackWhereUniqueInput
    /**
     * In case the Track found by the `where` argument doesn't exist, create a new Track with this data.
     */
    create: XOR<TrackCreateInput, TrackUncheckedCreateInput>
    /**
     * In case the Track was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TrackUpdateInput, TrackUncheckedUpdateInput>
  }

  /**
   * Track delete
   */
  export type TrackDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    /**
     * Filter which Track to delete.
     */
    where: TrackWhereUniqueInput
  }

  /**
   * Track deleteMany
   */
  export type TrackDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Tracks to delete
     */
    where?: TrackWhereInput
    /**
     * Limit how many Tracks to delete.
     */
    limit?: number
  }

  /**
   * Track.artists
   */
  export type Track$artistsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    where?: ArtistWhereInput
    orderBy?: ArtistOrderByWithRelationInput | ArtistOrderByWithRelationInput[]
    cursor?: ArtistWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ArtistScalarFieldEnum | ArtistScalarFieldEnum[]
  }

  /**
   * Track.TrackPlay
   */
  export type Track$TrackPlayArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackPlay
     */
    select?: TrackPlaySelect<ExtArgs> | null
    /**
     * Omit specific fields from the TrackPlay
     */
    omit?: TrackPlayOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackPlayInclude<ExtArgs> | null
    where?: TrackPlayWhereInput
    orderBy?: TrackPlayOrderByWithRelationInput | TrackPlayOrderByWithRelationInput[]
    cursor?: TrackPlayWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TrackPlayScalarFieldEnum | TrackPlayScalarFieldEnum[]
  }

  /**
   * Track without action
   */
  export type TrackDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
  }


  /**
   * Model Artist
   */

  export type AggregateArtist = {
    _count: ArtistCountAggregateOutputType | null
    _min: ArtistMinAggregateOutputType | null
    _max: ArtistMaxAggregateOutputType | null
  }

  export type ArtistMinAggregateOutputType = {
    id: string | null
    name: string | null
    url: string | null
    image: string | null
  }

  export type ArtistMaxAggregateOutputType = {
    id: string | null
    name: string | null
    url: string | null
    image: string | null
  }

  export type ArtistCountAggregateOutputType = {
    id: number
    name: number
    url: number
    image: number
    _all: number
  }


  export type ArtistMinAggregateInputType = {
    id?: true
    name?: true
    url?: true
    image?: true
  }

  export type ArtistMaxAggregateInputType = {
    id?: true
    name?: true
    url?: true
    image?: true
  }

  export type ArtistCountAggregateInputType = {
    id?: true
    name?: true
    url?: true
    image?: true
    _all?: true
  }

  export type ArtistAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Artist to aggregate.
     */
    where?: ArtistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artists to fetch.
     */
    orderBy?: ArtistOrderByWithRelationInput | ArtistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ArtistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Artists
    **/
    _count?: true | ArtistCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ArtistMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ArtistMaxAggregateInputType
  }

  export type GetArtistAggregateType<T extends ArtistAggregateArgs> = {
        [P in keyof T & keyof AggregateArtist]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateArtist[P]>
      : GetScalarType<T[P], AggregateArtist[P]>
  }




  export type ArtistGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ArtistWhereInput
    orderBy?: ArtistOrderByWithAggregationInput | ArtistOrderByWithAggregationInput[]
    by: ArtistScalarFieldEnum[] | ArtistScalarFieldEnum
    having?: ArtistScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ArtistCountAggregateInputType | true
    _min?: ArtistMinAggregateInputType
    _max?: ArtistMaxAggregateInputType
  }

  export type ArtistGroupByOutputType = {
    id: string
    name: string
    url: string
    image: string | null
    _count: ArtistCountAggregateOutputType | null
    _min: ArtistMinAggregateOutputType | null
    _max: ArtistMaxAggregateOutputType | null
  }

  type GetArtistGroupByPayload<T extends ArtistGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ArtistGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ArtistGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ArtistGroupByOutputType[P]>
            : GetScalarType<T[P], ArtistGroupByOutputType[P]>
        }
      >
    >


  export type ArtistSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    url?: boolean
    image?: boolean
    tracks?: boolean | Artist$tracksArgs<ExtArgs>
    genres?: boolean | Artist$genresArgs<ExtArgs>
    _count?: boolean | ArtistCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["artist"]>

  export type ArtistSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    url?: boolean
    image?: boolean
  }, ExtArgs["result"]["artist"]>

  export type ArtistSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    url?: boolean
    image?: boolean
  }, ExtArgs["result"]["artist"]>

  export type ArtistSelectScalar = {
    id?: boolean
    name?: boolean
    url?: boolean
    image?: boolean
  }

  export type ArtistOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "url" | "image", ExtArgs["result"]["artist"]>
  export type ArtistInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tracks?: boolean | Artist$tracksArgs<ExtArgs>
    genres?: boolean | Artist$genresArgs<ExtArgs>
    _count?: boolean | ArtistCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ArtistIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ArtistIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ArtistPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Artist"
    objects: {
      tracks: Prisma.$TrackPayload<ExtArgs>[]
      genres: Prisma.$GenrePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      url: string
      image: string | null
    }, ExtArgs["result"]["artist"]>
    composites: {}
  }

  type ArtistGetPayload<S extends boolean | null | undefined | ArtistDefaultArgs> = $Result.GetResult<Prisma.$ArtistPayload, S>

  type ArtistCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ArtistFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ArtistCountAggregateInputType | true
    }

  export interface ArtistDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Artist'], meta: { name: 'Artist' } }
    /**
     * Find zero or one Artist that matches the filter.
     * @param {ArtistFindUniqueArgs} args - Arguments to find a Artist
     * @example
     * // Get one Artist
     * const artist = await prisma.artist.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ArtistFindUniqueArgs>(args: SelectSubset<T, ArtistFindUniqueArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Artist that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ArtistFindUniqueOrThrowArgs} args - Arguments to find a Artist
     * @example
     * // Get one Artist
     * const artist = await prisma.artist.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ArtistFindUniqueOrThrowArgs>(args: SelectSubset<T, ArtistFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Artist that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistFindFirstArgs} args - Arguments to find a Artist
     * @example
     * // Get one Artist
     * const artist = await prisma.artist.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ArtistFindFirstArgs>(args?: SelectSubset<T, ArtistFindFirstArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Artist that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistFindFirstOrThrowArgs} args - Arguments to find a Artist
     * @example
     * // Get one Artist
     * const artist = await prisma.artist.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ArtistFindFirstOrThrowArgs>(args?: SelectSubset<T, ArtistFindFirstOrThrowArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Artists that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Artists
     * const artists = await prisma.artist.findMany()
     * 
     * // Get first 10 Artists
     * const artists = await prisma.artist.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const artistWithIdOnly = await prisma.artist.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ArtistFindManyArgs>(args?: SelectSubset<T, ArtistFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Artist.
     * @param {ArtistCreateArgs} args - Arguments to create a Artist.
     * @example
     * // Create one Artist
     * const Artist = await prisma.artist.create({
     *   data: {
     *     // ... data to create a Artist
     *   }
     * })
     * 
     */
    create<T extends ArtistCreateArgs>(args: SelectSubset<T, ArtistCreateArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Artists.
     * @param {ArtistCreateManyArgs} args - Arguments to create many Artists.
     * @example
     * // Create many Artists
     * const artist = await prisma.artist.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ArtistCreateManyArgs>(args?: SelectSubset<T, ArtistCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Artists and returns the data saved in the database.
     * @param {ArtistCreateManyAndReturnArgs} args - Arguments to create many Artists.
     * @example
     * // Create many Artists
     * const artist = await prisma.artist.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Artists and only return the `id`
     * const artistWithIdOnly = await prisma.artist.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ArtistCreateManyAndReturnArgs>(args?: SelectSubset<T, ArtistCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Artist.
     * @param {ArtistDeleteArgs} args - Arguments to delete one Artist.
     * @example
     * // Delete one Artist
     * const Artist = await prisma.artist.delete({
     *   where: {
     *     // ... filter to delete one Artist
     *   }
     * })
     * 
     */
    delete<T extends ArtistDeleteArgs>(args: SelectSubset<T, ArtistDeleteArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Artist.
     * @param {ArtistUpdateArgs} args - Arguments to update one Artist.
     * @example
     * // Update one Artist
     * const artist = await prisma.artist.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ArtistUpdateArgs>(args: SelectSubset<T, ArtistUpdateArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Artists.
     * @param {ArtistDeleteManyArgs} args - Arguments to filter Artists to delete.
     * @example
     * // Delete a few Artists
     * const { count } = await prisma.artist.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ArtistDeleteManyArgs>(args?: SelectSubset<T, ArtistDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Artists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Artists
     * const artist = await prisma.artist.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ArtistUpdateManyArgs>(args: SelectSubset<T, ArtistUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Artists and returns the data updated in the database.
     * @param {ArtistUpdateManyAndReturnArgs} args - Arguments to update many Artists.
     * @example
     * // Update many Artists
     * const artist = await prisma.artist.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Artists and only return the `id`
     * const artistWithIdOnly = await prisma.artist.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ArtistUpdateManyAndReturnArgs>(args: SelectSubset<T, ArtistUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Artist.
     * @param {ArtistUpsertArgs} args - Arguments to update or create a Artist.
     * @example
     * // Update or create a Artist
     * const artist = await prisma.artist.upsert({
     *   create: {
     *     // ... data to create a Artist
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Artist we want to update
     *   }
     * })
     */
    upsert<T extends ArtistUpsertArgs>(args: SelectSubset<T, ArtistUpsertArgs<ExtArgs>>): Prisma__ArtistClient<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Artists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistCountArgs} args - Arguments to filter Artists to count.
     * @example
     * // Count the number of Artists
     * const count = await prisma.artist.count({
     *   where: {
     *     // ... the filter for the Artists we want to count
     *   }
     * })
    **/
    count<T extends ArtistCountArgs>(
      args?: Subset<T, ArtistCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ArtistCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Artist.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ArtistAggregateArgs>(args: Subset<T, ArtistAggregateArgs>): Prisma.PrismaPromise<GetArtistAggregateType<T>>

    /**
     * Group by Artist.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ArtistGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ArtistGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ArtistGroupByArgs['orderBy'] }
        : { orderBy?: ArtistGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ArtistGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetArtistGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Artist model
   */
  readonly fields: ArtistFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Artist.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ArtistClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tracks<T extends Artist$tracksArgs<ExtArgs> = {}>(args?: Subset<T, Artist$tracksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    genres<T extends Artist$genresArgs<ExtArgs> = {}>(args?: Subset<T, Artist$genresArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GenrePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Artist model
   */
  interface ArtistFieldRefs {
    readonly id: FieldRef<"Artist", 'String'>
    readonly name: FieldRef<"Artist", 'String'>
    readonly url: FieldRef<"Artist", 'String'>
    readonly image: FieldRef<"Artist", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Artist findUnique
   */
  export type ArtistFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * Filter, which Artist to fetch.
     */
    where: ArtistWhereUniqueInput
  }

  /**
   * Artist findUniqueOrThrow
   */
  export type ArtistFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * Filter, which Artist to fetch.
     */
    where: ArtistWhereUniqueInput
  }

  /**
   * Artist findFirst
   */
  export type ArtistFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * Filter, which Artist to fetch.
     */
    where?: ArtistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artists to fetch.
     */
    orderBy?: ArtistOrderByWithRelationInput | ArtistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Artists.
     */
    cursor?: ArtistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Artists.
     */
    distinct?: ArtistScalarFieldEnum | ArtistScalarFieldEnum[]
  }

  /**
   * Artist findFirstOrThrow
   */
  export type ArtistFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * Filter, which Artist to fetch.
     */
    where?: ArtistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artists to fetch.
     */
    orderBy?: ArtistOrderByWithRelationInput | ArtistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Artists.
     */
    cursor?: ArtistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artists.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Artists.
     */
    distinct?: ArtistScalarFieldEnum | ArtistScalarFieldEnum[]
  }

  /**
   * Artist findMany
   */
  export type ArtistFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * Filter, which Artists to fetch.
     */
    where?: ArtistWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Artists to fetch.
     */
    orderBy?: ArtistOrderByWithRelationInput | ArtistOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Artists.
     */
    cursor?: ArtistWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Artists from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Artists.
     */
    skip?: number
    distinct?: ArtistScalarFieldEnum | ArtistScalarFieldEnum[]
  }

  /**
   * Artist create
   */
  export type ArtistCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * The data needed to create a Artist.
     */
    data: XOR<ArtistCreateInput, ArtistUncheckedCreateInput>
  }

  /**
   * Artist createMany
   */
  export type ArtistCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Artists.
     */
    data: ArtistCreateManyInput | ArtistCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Artist createManyAndReturn
   */
  export type ArtistCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * The data used to create many Artists.
     */
    data: ArtistCreateManyInput | ArtistCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Artist update
   */
  export type ArtistUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * The data needed to update a Artist.
     */
    data: XOR<ArtistUpdateInput, ArtistUncheckedUpdateInput>
    /**
     * Choose, which Artist to update.
     */
    where: ArtistWhereUniqueInput
  }

  /**
   * Artist updateMany
   */
  export type ArtistUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Artists.
     */
    data: XOR<ArtistUpdateManyMutationInput, ArtistUncheckedUpdateManyInput>
    /**
     * Filter which Artists to update
     */
    where?: ArtistWhereInput
    /**
     * Limit how many Artists to update.
     */
    limit?: number
  }

  /**
   * Artist updateManyAndReturn
   */
  export type ArtistUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * The data used to update Artists.
     */
    data: XOR<ArtistUpdateManyMutationInput, ArtistUncheckedUpdateManyInput>
    /**
     * Filter which Artists to update
     */
    where?: ArtistWhereInput
    /**
     * Limit how many Artists to update.
     */
    limit?: number
  }

  /**
   * Artist upsert
   */
  export type ArtistUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * The filter to search for the Artist to update in case it exists.
     */
    where: ArtistWhereUniqueInput
    /**
     * In case the Artist found by the `where` argument doesn't exist, create a new Artist with this data.
     */
    create: XOR<ArtistCreateInput, ArtistUncheckedCreateInput>
    /**
     * In case the Artist was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ArtistUpdateInput, ArtistUncheckedUpdateInput>
  }

  /**
   * Artist delete
   */
  export type ArtistDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    /**
     * Filter which Artist to delete.
     */
    where: ArtistWhereUniqueInput
  }

  /**
   * Artist deleteMany
   */
  export type ArtistDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Artists to delete
     */
    where?: ArtistWhereInput
    /**
     * Limit how many Artists to delete.
     */
    limit?: number
  }

  /**
   * Artist.tracks
   */
  export type Artist$tracksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    where?: TrackWhereInput
    orderBy?: TrackOrderByWithRelationInput | TrackOrderByWithRelationInput[]
    cursor?: TrackWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TrackScalarFieldEnum | TrackScalarFieldEnum[]
  }

  /**
   * Artist.genres
   */
  export type Artist$genresArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenreInclude<ExtArgs> | null
    where?: GenreWhereInput
    orderBy?: GenreOrderByWithRelationInput | GenreOrderByWithRelationInput[]
    cursor?: GenreWhereUniqueInput
    take?: number
    skip?: number
    distinct?: GenreScalarFieldEnum | GenreScalarFieldEnum[]
  }

  /**
   * Artist without action
   */
  export type ArtistDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
  }


  /**
   * Model Album
   */

  export type AggregateAlbum = {
    _count: AlbumCountAggregateOutputType | null
    _min: AlbumMinAggregateOutputType | null
    _max: AlbumMaxAggregateOutputType | null
  }

  export type AlbumMinAggregateOutputType = {
    id: string | null
    name: string | null
    url: string | null
    image: string | null
  }

  export type AlbumMaxAggregateOutputType = {
    id: string | null
    name: string | null
    url: string | null
    image: string | null
  }

  export type AlbumCountAggregateOutputType = {
    id: number
    name: number
    url: number
    image: number
    _all: number
  }


  export type AlbumMinAggregateInputType = {
    id?: true
    name?: true
    url?: true
    image?: true
  }

  export type AlbumMaxAggregateInputType = {
    id?: true
    name?: true
    url?: true
    image?: true
  }

  export type AlbumCountAggregateInputType = {
    id?: true
    name?: true
    url?: true
    image?: true
    _all?: true
  }

  export type AlbumAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Album to aggregate.
     */
    where?: AlbumWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Albums to fetch.
     */
    orderBy?: AlbumOrderByWithRelationInput | AlbumOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AlbumWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Albums from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Albums.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Albums
    **/
    _count?: true | AlbumCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AlbumMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AlbumMaxAggregateInputType
  }

  export type GetAlbumAggregateType<T extends AlbumAggregateArgs> = {
        [P in keyof T & keyof AggregateAlbum]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAlbum[P]>
      : GetScalarType<T[P], AggregateAlbum[P]>
  }




  export type AlbumGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AlbumWhereInput
    orderBy?: AlbumOrderByWithAggregationInput | AlbumOrderByWithAggregationInput[]
    by: AlbumScalarFieldEnum[] | AlbumScalarFieldEnum
    having?: AlbumScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AlbumCountAggregateInputType | true
    _min?: AlbumMinAggregateInputType
    _max?: AlbumMaxAggregateInputType
  }

  export type AlbumGroupByOutputType = {
    id: string
    name: string
    url: string
    image: string | null
    _count: AlbumCountAggregateOutputType | null
    _min: AlbumMinAggregateOutputType | null
    _max: AlbumMaxAggregateOutputType | null
  }

  type GetAlbumGroupByPayload<T extends AlbumGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AlbumGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AlbumGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AlbumGroupByOutputType[P]>
            : GetScalarType<T[P], AlbumGroupByOutputType[P]>
        }
      >
    >


  export type AlbumSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    url?: boolean
    image?: boolean
    tracks?: boolean | Album$tracksArgs<ExtArgs>
    _count?: boolean | AlbumCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["album"]>

  export type AlbumSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    url?: boolean
    image?: boolean
  }, ExtArgs["result"]["album"]>

  export type AlbumSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    url?: boolean
    image?: boolean
  }, ExtArgs["result"]["album"]>

  export type AlbumSelectScalar = {
    id?: boolean
    name?: boolean
    url?: boolean
    image?: boolean
  }

  export type AlbumOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "url" | "image", ExtArgs["result"]["album"]>
  export type AlbumInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tracks?: boolean | Album$tracksArgs<ExtArgs>
    _count?: boolean | AlbumCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AlbumIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type AlbumIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $AlbumPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Album"
    objects: {
      tracks: Prisma.$TrackPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      url: string
      image: string | null
    }, ExtArgs["result"]["album"]>
    composites: {}
  }

  type AlbumGetPayload<S extends boolean | null | undefined | AlbumDefaultArgs> = $Result.GetResult<Prisma.$AlbumPayload, S>

  type AlbumCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AlbumFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AlbumCountAggregateInputType | true
    }

  export interface AlbumDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Album'], meta: { name: 'Album' } }
    /**
     * Find zero or one Album that matches the filter.
     * @param {AlbumFindUniqueArgs} args - Arguments to find a Album
     * @example
     * // Get one Album
     * const album = await prisma.album.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AlbumFindUniqueArgs>(args: SelectSubset<T, AlbumFindUniqueArgs<ExtArgs>>): Prisma__AlbumClient<$Result.GetResult<Prisma.$AlbumPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Album that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AlbumFindUniqueOrThrowArgs} args - Arguments to find a Album
     * @example
     * // Get one Album
     * const album = await prisma.album.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AlbumFindUniqueOrThrowArgs>(args: SelectSubset<T, AlbumFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AlbumClient<$Result.GetResult<Prisma.$AlbumPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Album that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlbumFindFirstArgs} args - Arguments to find a Album
     * @example
     * // Get one Album
     * const album = await prisma.album.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AlbumFindFirstArgs>(args?: SelectSubset<T, AlbumFindFirstArgs<ExtArgs>>): Prisma__AlbumClient<$Result.GetResult<Prisma.$AlbumPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Album that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlbumFindFirstOrThrowArgs} args - Arguments to find a Album
     * @example
     * // Get one Album
     * const album = await prisma.album.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AlbumFindFirstOrThrowArgs>(args?: SelectSubset<T, AlbumFindFirstOrThrowArgs<ExtArgs>>): Prisma__AlbumClient<$Result.GetResult<Prisma.$AlbumPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Albums that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlbumFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Albums
     * const albums = await prisma.album.findMany()
     * 
     * // Get first 10 Albums
     * const albums = await prisma.album.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const albumWithIdOnly = await prisma.album.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AlbumFindManyArgs>(args?: SelectSubset<T, AlbumFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlbumPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Album.
     * @param {AlbumCreateArgs} args - Arguments to create a Album.
     * @example
     * // Create one Album
     * const Album = await prisma.album.create({
     *   data: {
     *     // ... data to create a Album
     *   }
     * })
     * 
     */
    create<T extends AlbumCreateArgs>(args: SelectSubset<T, AlbumCreateArgs<ExtArgs>>): Prisma__AlbumClient<$Result.GetResult<Prisma.$AlbumPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Albums.
     * @param {AlbumCreateManyArgs} args - Arguments to create many Albums.
     * @example
     * // Create many Albums
     * const album = await prisma.album.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AlbumCreateManyArgs>(args?: SelectSubset<T, AlbumCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Albums and returns the data saved in the database.
     * @param {AlbumCreateManyAndReturnArgs} args - Arguments to create many Albums.
     * @example
     * // Create many Albums
     * const album = await prisma.album.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Albums and only return the `id`
     * const albumWithIdOnly = await prisma.album.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AlbumCreateManyAndReturnArgs>(args?: SelectSubset<T, AlbumCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlbumPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Album.
     * @param {AlbumDeleteArgs} args - Arguments to delete one Album.
     * @example
     * // Delete one Album
     * const Album = await prisma.album.delete({
     *   where: {
     *     // ... filter to delete one Album
     *   }
     * })
     * 
     */
    delete<T extends AlbumDeleteArgs>(args: SelectSubset<T, AlbumDeleteArgs<ExtArgs>>): Prisma__AlbumClient<$Result.GetResult<Prisma.$AlbumPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Album.
     * @param {AlbumUpdateArgs} args - Arguments to update one Album.
     * @example
     * // Update one Album
     * const album = await prisma.album.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AlbumUpdateArgs>(args: SelectSubset<T, AlbumUpdateArgs<ExtArgs>>): Prisma__AlbumClient<$Result.GetResult<Prisma.$AlbumPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Albums.
     * @param {AlbumDeleteManyArgs} args - Arguments to filter Albums to delete.
     * @example
     * // Delete a few Albums
     * const { count } = await prisma.album.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AlbumDeleteManyArgs>(args?: SelectSubset<T, AlbumDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Albums.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlbumUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Albums
     * const album = await prisma.album.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AlbumUpdateManyArgs>(args: SelectSubset<T, AlbumUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Albums and returns the data updated in the database.
     * @param {AlbumUpdateManyAndReturnArgs} args - Arguments to update many Albums.
     * @example
     * // Update many Albums
     * const album = await prisma.album.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Albums and only return the `id`
     * const albumWithIdOnly = await prisma.album.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AlbumUpdateManyAndReturnArgs>(args: SelectSubset<T, AlbumUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlbumPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Album.
     * @param {AlbumUpsertArgs} args - Arguments to update or create a Album.
     * @example
     * // Update or create a Album
     * const album = await prisma.album.upsert({
     *   create: {
     *     // ... data to create a Album
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Album we want to update
     *   }
     * })
     */
    upsert<T extends AlbumUpsertArgs>(args: SelectSubset<T, AlbumUpsertArgs<ExtArgs>>): Prisma__AlbumClient<$Result.GetResult<Prisma.$AlbumPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Albums.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlbumCountArgs} args - Arguments to filter Albums to count.
     * @example
     * // Count the number of Albums
     * const count = await prisma.album.count({
     *   where: {
     *     // ... the filter for the Albums we want to count
     *   }
     * })
    **/
    count<T extends AlbumCountArgs>(
      args?: Subset<T, AlbumCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AlbumCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Album.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlbumAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AlbumAggregateArgs>(args: Subset<T, AlbumAggregateArgs>): Prisma.PrismaPromise<GetAlbumAggregateType<T>>

    /**
     * Group by Album.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlbumGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AlbumGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AlbumGroupByArgs['orderBy'] }
        : { orderBy?: AlbumGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AlbumGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAlbumGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Album model
   */
  readonly fields: AlbumFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Album.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AlbumClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    tracks<T extends Album$tracksArgs<ExtArgs> = {}>(args?: Subset<T, Album$tracksArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrackPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Album model
   */
  interface AlbumFieldRefs {
    readonly id: FieldRef<"Album", 'String'>
    readonly name: FieldRef<"Album", 'String'>
    readonly url: FieldRef<"Album", 'String'>
    readonly image: FieldRef<"Album", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Album findUnique
   */
  export type AlbumFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Album
     */
    select?: AlbumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Album
     */
    omit?: AlbumOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AlbumInclude<ExtArgs> | null
    /**
     * Filter, which Album to fetch.
     */
    where: AlbumWhereUniqueInput
  }

  /**
   * Album findUniqueOrThrow
   */
  export type AlbumFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Album
     */
    select?: AlbumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Album
     */
    omit?: AlbumOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AlbumInclude<ExtArgs> | null
    /**
     * Filter, which Album to fetch.
     */
    where: AlbumWhereUniqueInput
  }

  /**
   * Album findFirst
   */
  export type AlbumFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Album
     */
    select?: AlbumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Album
     */
    omit?: AlbumOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AlbumInclude<ExtArgs> | null
    /**
     * Filter, which Album to fetch.
     */
    where?: AlbumWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Albums to fetch.
     */
    orderBy?: AlbumOrderByWithRelationInput | AlbumOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Albums.
     */
    cursor?: AlbumWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Albums from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Albums.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Albums.
     */
    distinct?: AlbumScalarFieldEnum | AlbumScalarFieldEnum[]
  }

  /**
   * Album findFirstOrThrow
   */
  export type AlbumFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Album
     */
    select?: AlbumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Album
     */
    omit?: AlbumOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AlbumInclude<ExtArgs> | null
    /**
     * Filter, which Album to fetch.
     */
    where?: AlbumWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Albums to fetch.
     */
    orderBy?: AlbumOrderByWithRelationInput | AlbumOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Albums.
     */
    cursor?: AlbumWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Albums from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Albums.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Albums.
     */
    distinct?: AlbumScalarFieldEnum | AlbumScalarFieldEnum[]
  }

  /**
   * Album findMany
   */
  export type AlbumFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Album
     */
    select?: AlbumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Album
     */
    omit?: AlbumOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AlbumInclude<ExtArgs> | null
    /**
     * Filter, which Albums to fetch.
     */
    where?: AlbumWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Albums to fetch.
     */
    orderBy?: AlbumOrderByWithRelationInput | AlbumOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Albums.
     */
    cursor?: AlbumWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Albums from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Albums.
     */
    skip?: number
    distinct?: AlbumScalarFieldEnum | AlbumScalarFieldEnum[]
  }

  /**
   * Album create
   */
  export type AlbumCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Album
     */
    select?: AlbumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Album
     */
    omit?: AlbumOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AlbumInclude<ExtArgs> | null
    /**
     * The data needed to create a Album.
     */
    data: XOR<AlbumCreateInput, AlbumUncheckedCreateInput>
  }

  /**
   * Album createMany
   */
  export type AlbumCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Albums.
     */
    data: AlbumCreateManyInput | AlbumCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Album createManyAndReturn
   */
  export type AlbumCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Album
     */
    select?: AlbumSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Album
     */
    omit?: AlbumOmit<ExtArgs> | null
    /**
     * The data used to create many Albums.
     */
    data: AlbumCreateManyInput | AlbumCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Album update
   */
  export type AlbumUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Album
     */
    select?: AlbumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Album
     */
    omit?: AlbumOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AlbumInclude<ExtArgs> | null
    /**
     * The data needed to update a Album.
     */
    data: XOR<AlbumUpdateInput, AlbumUncheckedUpdateInput>
    /**
     * Choose, which Album to update.
     */
    where: AlbumWhereUniqueInput
  }

  /**
   * Album updateMany
   */
  export type AlbumUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Albums.
     */
    data: XOR<AlbumUpdateManyMutationInput, AlbumUncheckedUpdateManyInput>
    /**
     * Filter which Albums to update
     */
    where?: AlbumWhereInput
    /**
     * Limit how many Albums to update.
     */
    limit?: number
  }

  /**
   * Album updateManyAndReturn
   */
  export type AlbumUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Album
     */
    select?: AlbumSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Album
     */
    omit?: AlbumOmit<ExtArgs> | null
    /**
     * The data used to update Albums.
     */
    data: XOR<AlbumUpdateManyMutationInput, AlbumUncheckedUpdateManyInput>
    /**
     * Filter which Albums to update
     */
    where?: AlbumWhereInput
    /**
     * Limit how many Albums to update.
     */
    limit?: number
  }

  /**
   * Album upsert
   */
  export type AlbumUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Album
     */
    select?: AlbumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Album
     */
    omit?: AlbumOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AlbumInclude<ExtArgs> | null
    /**
     * The filter to search for the Album to update in case it exists.
     */
    where: AlbumWhereUniqueInput
    /**
     * In case the Album found by the `where` argument doesn't exist, create a new Album with this data.
     */
    create: XOR<AlbumCreateInput, AlbumUncheckedCreateInput>
    /**
     * In case the Album was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AlbumUpdateInput, AlbumUncheckedUpdateInput>
  }

  /**
   * Album delete
   */
  export type AlbumDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Album
     */
    select?: AlbumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Album
     */
    omit?: AlbumOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AlbumInclude<ExtArgs> | null
    /**
     * Filter which Album to delete.
     */
    where: AlbumWhereUniqueInput
  }

  /**
   * Album deleteMany
   */
  export type AlbumDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Albums to delete
     */
    where?: AlbumWhereInput
    /**
     * Limit how many Albums to delete.
     */
    limit?: number
  }

  /**
   * Album.tracks
   */
  export type Album$tracksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Track
     */
    select?: TrackSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Track
     */
    omit?: TrackOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TrackInclude<ExtArgs> | null
    where?: TrackWhereInput
    orderBy?: TrackOrderByWithRelationInput | TrackOrderByWithRelationInput[]
    cursor?: TrackWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TrackScalarFieldEnum | TrackScalarFieldEnum[]
  }

  /**
   * Album without action
   */
  export type AlbumDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Album
     */
    select?: AlbumSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Album
     */
    omit?: AlbumOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AlbumInclude<ExtArgs> | null
  }


  /**
   * Model Genre
   */

  export type AggregateGenre = {
    _count: GenreCountAggregateOutputType | null
    _min: GenreMinAggregateOutputType | null
    _max: GenreMaxAggregateOutputType | null
  }

  export type GenreMinAggregateOutputType = {
    name: string | null
  }

  export type GenreMaxAggregateOutputType = {
    name: string | null
  }

  export type GenreCountAggregateOutputType = {
    name: number
    _all: number
  }


  export type GenreMinAggregateInputType = {
    name?: true
  }

  export type GenreMaxAggregateInputType = {
    name?: true
  }

  export type GenreCountAggregateInputType = {
    name?: true
    _all?: true
  }

  export type GenreAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Genre to aggregate.
     */
    where?: GenreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Genres to fetch.
     */
    orderBy?: GenreOrderByWithRelationInput | GenreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: GenreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Genres from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Genres.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Genres
    **/
    _count?: true | GenreCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: GenreMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: GenreMaxAggregateInputType
  }

  export type GetGenreAggregateType<T extends GenreAggregateArgs> = {
        [P in keyof T & keyof AggregateGenre]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGenre[P]>
      : GetScalarType<T[P], AggregateGenre[P]>
  }




  export type GenreGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GenreWhereInput
    orderBy?: GenreOrderByWithAggregationInput | GenreOrderByWithAggregationInput[]
    by: GenreScalarFieldEnum[] | GenreScalarFieldEnum
    having?: GenreScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: GenreCountAggregateInputType | true
    _min?: GenreMinAggregateInputType
    _max?: GenreMaxAggregateInputType
  }

  export type GenreGroupByOutputType = {
    name: string
    _count: GenreCountAggregateOutputType | null
    _min: GenreMinAggregateOutputType | null
    _max: GenreMaxAggregateOutputType | null
  }

  type GetGenreGroupByPayload<T extends GenreGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GenreGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof GenreGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], GenreGroupByOutputType[P]>
            : GetScalarType<T[P], GenreGroupByOutputType[P]>
        }
      >
    >


  export type GenreSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    name?: boolean
    artists?: boolean | Genre$artistsArgs<ExtArgs>
    _count?: boolean | GenreCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["genre"]>

  export type GenreSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    name?: boolean
  }, ExtArgs["result"]["genre"]>

  export type GenreSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    name?: boolean
  }, ExtArgs["result"]["genre"]>

  export type GenreSelectScalar = {
    name?: boolean
  }

  export type GenreOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"name", ExtArgs["result"]["genre"]>
  export type GenreInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    artists?: boolean | Genre$artistsArgs<ExtArgs>
    _count?: boolean | GenreCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type GenreIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type GenreIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $GenrePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Genre"
    objects: {
      artists: Prisma.$ArtistPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      name: string
    }, ExtArgs["result"]["genre"]>
    composites: {}
  }

  type GenreGetPayload<S extends boolean | null | undefined | GenreDefaultArgs> = $Result.GetResult<Prisma.$GenrePayload, S>

  type GenreCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<GenreFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: GenreCountAggregateInputType | true
    }

  export interface GenreDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Genre'], meta: { name: 'Genre' } }
    /**
     * Find zero or one Genre that matches the filter.
     * @param {GenreFindUniqueArgs} args - Arguments to find a Genre
     * @example
     * // Get one Genre
     * const genre = await prisma.genre.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GenreFindUniqueArgs>(args: SelectSubset<T, GenreFindUniqueArgs<ExtArgs>>): Prisma__GenreClient<$Result.GetResult<Prisma.$GenrePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Genre that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GenreFindUniqueOrThrowArgs} args - Arguments to find a Genre
     * @example
     * // Get one Genre
     * const genre = await prisma.genre.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GenreFindUniqueOrThrowArgs>(args: SelectSubset<T, GenreFindUniqueOrThrowArgs<ExtArgs>>): Prisma__GenreClient<$Result.GetResult<Prisma.$GenrePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Genre that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenreFindFirstArgs} args - Arguments to find a Genre
     * @example
     * // Get one Genre
     * const genre = await prisma.genre.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GenreFindFirstArgs>(args?: SelectSubset<T, GenreFindFirstArgs<ExtArgs>>): Prisma__GenreClient<$Result.GetResult<Prisma.$GenrePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Genre that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenreFindFirstOrThrowArgs} args - Arguments to find a Genre
     * @example
     * // Get one Genre
     * const genre = await prisma.genre.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GenreFindFirstOrThrowArgs>(args?: SelectSubset<T, GenreFindFirstOrThrowArgs<ExtArgs>>): Prisma__GenreClient<$Result.GetResult<Prisma.$GenrePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Genres that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenreFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Genres
     * const genres = await prisma.genre.findMany()
     * 
     * // Get first 10 Genres
     * const genres = await prisma.genre.findMany({ take: 10 })
     * 
     * // Only select the `name`
     * const genreWithNameOnly = await prisma.genre.findMany({ select: { name: true } })
     * 
     */
    findMany<T extends GenreFindManyArgs>(args?: SelectSubset<T, GenreFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GenrePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Genre.
     * @param {GenreCreateArgs} args - Arguments to create a Genre.
     * @example
     * // Create one Genre
     * const Genre = await prisma.genre.create({
     *   data: {
     *     // ... data to create a Genre
     *   }
     * })
     * 
     */
    create<T extends GenreCreateArgs>(args: SelectSubset<T, GenreCreateArgs<ExtArgs>>): Prisma__GenreClient<$Result.GetResult<Prisma.$GenrePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Genres.
     * @param {GenreCreateManyArgs} args - Arguments to create many Genres.
     * @example
     * // Create many Genres
     * const genre = await prisma.genre.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends GenreCreateManyArgs>(args?: SelectSubset<T, GenreCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Genres and returns the data saved in the database.
     * @param {GenreCreateManyAndReturnArgs} args - Arguments to create many Genres.
     * @example
     * // Create many Genres
     * const genre = await prisma.genre.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Genres and only return the `name`
     * const genreWithNameOnly = await prisma.genre.createManyAndReturn({
     *   select: { name: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends GenreCreateManyAndReturnArgs>(args?: SelectSubset<T, GenreCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GenrePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Genre.
     * @param {GenreDeleteArgs} args - Arguments to delete one Genre.
     * @example
     * // Delete one Genre
     * const Genre = await prisma.genre.delete({
     *   where: {
     *     // ... filter to delete one Genre
     *   }
     * })
     * 
     */
    delete<T extends GenreDeleteArgs>(args: SelectSubset<T, GenreDeleteArgs<ExtArgs>>): Prisma__GenreClient<$Result.GetResult<Prisma.$GenrePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Genre.
     * @param {GenreUpdateArgs} args - Arguments to update one Genre.
     * @example
     * // Update one Genre
     * const genre = await prisma.genre.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends GenreUpdateArgs>(args: SelectSubset<T, GenreUpdateArgs<ExtArgs>>): Prisma__GenreClient<$Result.GetResult<Prisma.$GenrePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Genres.
     * @param {GenreDeleteManyArgs} args - Arguments to filter Genres to delete.
     * @example
     * // Delete a few Genres
     * const { count } = await prisma.genre.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends GenreDeleteManyArgs>(args?: SelectSubset<T, GenreDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Genres.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenreUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Genres
     * const genre = await prisma.genre.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends GenreUpdateManyArgs>(args: SelectSubset<T, GenreUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Genres and returns the data updated in the database.
     * @param {GenreUpdateManyAndReturnArgs} args - Arguments to update many Genres.
     * @example
     * // Update many Genres
     * const genre = await prisma.genre.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Genres and only return the `name`
     * const genreWithNameOnly = await prisma.genre.updateManyAndReturn({
     *   select: { name: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends GenreUpdateManyAndReturnArgs>(args: SelectSubset<T, GenreUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GenrePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Genre.
     * @param {GenreUpsertArgs} args - Arguments to update or create a Genre.
     * @example
     * // Update or create a Genre
     * const genre = await prisma.genre.upsert({
     *   create: {
     *     // ... data to create a Genre
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Genre we want to update
     *   }
     * })
     */
    upsert<T extends GenreUpsertArgs>(args: SelectSubset<T, GenreUpsertArgs<ExtArgs>>): Prisma__GenreClient<$Result.GetResult<Prisma.$GenrePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Genres.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenreCountArgs} args - Arguments to filter Genres to count.
     * @example
     * // Count the number of Genres
     * const count = await prisma.genre.count({
     *   where: {
     *     // ... the filter for the Genres we want to count
     *   }
     * })
    **/
    count<T extends GenreCountArgs>(
      args?: Subset<T, GenreCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GenreCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Genre.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenreAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends GenreAggregateArgs>(args: Subset<T, GenreAggregateArgs>): Prisma.PrismaPromise<GetGenreAggregateType<T>>

    /**
     * Group by Genre.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GenreGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends GenreGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GenreGroupByArgs['orderBy'] }
        : { orderBy?: GenreGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, GenreGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetGenreGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Genre model
   */
  readonly fields: GenreFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Genre.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GenreClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    artists<T extends Genre$artistsArgs<ExtArgs> = {}>(args?: Subset<T, Genre$artistsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ArtistPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Genre model
   */
  interface GenreFieldRefs {
    readonly name: FieldRef<"Genre", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Genre findUnique
   */
  export type GenreFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenreInclude<ExtArgs> | null
    /**
     * Filter, which Genre to fetch.
     */
    where: GenreWhereUniqueInput
  }

  /**
   * Genre findUniqueOrThrow
   */
  export type GenreFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenreInclude<ExtArgs> | null
    /**
     * Filter, which Genre to fetch.
     */
    where: GenreWhereUniqueInput
  }

  /**
   * Genre findFirst
   */
  export type GenreFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenreInclude<ExtArgs> | null
    /**
     * Filter, which Genre to fetch.
     */
    where?: GenreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Genres to fetch.
     */
    orderBy?: GenreOrderByWithRelationInput | GenreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Genres.
     */
    cursor?: GenreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Genres from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Genres.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Genres.
     */
    distinct?: GenreScalarFieldEnum | GenreScalarFieldEnum[]
  }

  /**
   * Genre findFirstOrThrow
   */
  export type GenreFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenreInclude<ExtArgs> | null
    /**
     * Filter, which Genre to fetch.
     */
    where?: GenreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Genres to fetch.
     */
    orderBy?: GenreOrderByWithRelationInput | GenreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Genres.
     */
    cursor?: GenreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Genres from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Genres.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Genres.
     */
    distinct?: GenreScalarFieldEnum | GenreScalarFieldEnum[]
  }

  /**
   * Genre findMany
   */
  export type GenreFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenreInclude<ExtArgs> | null
    /**
     * Filter, which Genres to fetch.
     */
    where?: GenreWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Genres to fetch.
     */
    orderBy?: GenreOrderByWithRelationInput | GenreOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Genres.
     */
    cursor?: GenreWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Genres from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Genres.
     */
    skip?: number
    distinct?: GenreScalarFieldEnum | GenreScalarFieldEnum[]
  }

  /**
   * Genre create
   */
  export type GenreCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenreInclude<ExtArgs> | null
    /**
     * The data needed to create a Genre.
     */
    data: XOR<GenreCreateInput, GenreUncheckedCreateInput>
  }

  /**
   * Genre createMany
   */
  export type GenreCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Genres.
     */
    data: GenreCreateManyInput | GenreCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Genre createManyAndReturn
   */
  export type GenreCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * The data used to create many Genres.
     */
    data: GenreCreateManyInput | GenreCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Genre update
   */
  export type GenreUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenreInclude<ExtArgs> | null
    /**
     * The data needed to update a Genre.
     */
    data: XOR<GenreUpdateInput, GenreUncheckedUpdateInput>
    /**
     * Choose, which Genre to update.
     */
    where: GenreWhereUniqueInput
  }

  /**
   * Genre updateMany
   */
  export type GenreUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Genres.
     */
    data: XOR<GenreUpdateManyMutationInput, GenreUncheckedUpdateManyInput>
    /**
     * Filter which Genres to update
     */
    where?: GenreWhereInput
    /**
     * Limit how many Genres to update.
     */
    limit?: number
  }

  /**
   * Genre updateManyAndReturn
   */
  export type GenreUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * The data used to update Genres.
     */
    data: XOR<GenreUpdateManyMutationInput, GenreUncheckedUpdateManyInput>
    /**
     * Filter which Genres to update
     */
    where?: GenreWhereInput
    /**
     * Limit how many Genres to update.
     */
    limit?: number
  }

  /**
   * Genre upsert
   */
  export type GenreUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenreInclude<ExtArgs> | null
    /**
     * The filter to search for the Genre to update in case it exists.
     */
    where: GenreWhereUniqueInput
    /**
     * In case the Genre found by the `where` argument doesn't exist, create a new Genre with this data.
     */
    create: XOR<GenreCreateInput, GenreUncheckedCreateInput>
    /**
     * In case the Genre was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GenreUpdateInput, GenreUncheckedUpdateInput>
  }

  /**
   * Genre delete
   */
  export type GenreDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenreInclude<ExtArgs> | null
    /**
     * Filter which Genre to delete.
     */
    where: GenreWhereUniqueInput
  }

  /**
   * Genre deleteMany
   */
  export type GenreDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Genres to delete
     */
    where?: GenreWhereInput
    /**
     * Limit how many Genres to delete.
     */
    limit?: number
  }

  /**
   * Genre.artists
   */
  export type Genre$artistsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Artist
     */
    select?: ArtistSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Artist
     */
    omit?: ArtistOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ArtistInclude<ExtArgs> | null
    where?: ArtistWhereInput
    orderBy?: ArtistOrderByWithRelationInput | ArtistOrderByWithRelationInput[]
    cursor?: ArtistWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ArtistScalarFieldEnum | ArtistScalarFieldEnum[]
  }

  /**
   * Genre without action
   */
  export type GenreDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Genre
     */
    select?: GenreSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Genre
     */
    omit?: GenreOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GenreInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const TrackPlayScalarFieldEnum: {
    id: 'id',
    trackId: 'trackId',
    playedAt: 'playedAt',
    userId: 'userId'
  };

  export type TrackPlayScalarFieldEnum = (typeof TrackPlayScalarFieldEnum)[keyof typeof TrackPlayScalarFieldEnum]


  export const TrackScalarFieldEnum: {
    id: 'id',
    name: 'name',
    duration: 'duration',
    url: 'url',
    image: 'image',
    albumId: 'albumId'
  };

  export type TrackScalarFieldEnum = (typeof TrackScalarFieldEnum)[keyof typeof TrackScalarFieldEnum]


  export const ArtistScalarFieldEnum: {
    id: 'id',
    name: 'name',
    url: 'url',
    image: 'image'
  };

  export type ArtistScalarFieldEnum = (typeof ArtistScalarFieldEnum)[keyof typeof ArtistScalarFieldEnum]


  export const AlbumScalarFieldEnum: {
    id: 'id',
    name: 'name',
    url: 'url',
    image: 'image'
  };

  export type AlbumScalarFieldEnum = (typeof AlbumScalarFieldEnum)[keyof typeof AlbumScalarFieldEnum]


  export const GenreScalarFieldEnum: {
    name: 'name'
  };

  export type GenreScalarFieldEnum = (typeof GenreScalarFieldEnum)[keyof typeof GenreScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type TrackPlayWhereInput = {
    AND?: TrackPlayWhereInput | TrackPlayWhereInput[]
    OR?: TrackPlayWhereInput[]
    NOT?: TrackPlayWhereInput | TrackPlayWhereInput[]
    id?: StringFilter<"TrackPlay"> | string
    trackId?: StringFilter<"TrackPlay"> | string
    playedAt?: DateTimeFilter<"TrackPlay"> | Date | string
    userId?: StringFilter<"TrackPlay"> | string
    track?: XOR<TrackScalarRelationFilter, TrackWhereInput>
  }

  export type TrackPlayOrderByWithRelationInput = {
    id?: SortOrder
    trackId?: SortOrder
    playedAt?: SortOrder
    userId?: SortOrder
    track?: TrackOrderByWithRelationInput
  }

  export type TrackPlayWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TrackPlayWhereInput | TrackPlayWhereInput[]
    OR?: TrackPlayWhereInput[]
    NOT?: TrackPlayWhereInput | TrackPlayWhereInput[]
    trackId?: StringFilter<"TrackPlay"> | string
    playedAt?: DateTimeFilter<"TrackPlay"> | Date | string
    userId?: StringFilter<"TrackPlay"> | string
    track?: XOR<TrackScalarRelationFilter, TrackWhereInput>
  }, "id">

  export type TrackPlayOrderByWithAggregationInput = {
    id?: SortOrder
    trackId?: SortOrder
    playedAt?: SortOrder
    userId?: SortOrder
    _count?: TrackPlayCountOrderByAggregateInput
    _max?: TrackPlayMaxOrderByAggregateInput
    _min?: TrackPlayMinOrderByAggregateInput
  }

  export type TrackPlayScalarWhereWithAggregatesInput = {
    AND?: TrackPlayScalarWhereWithAggregatesInput | TrackPlayScalarWhereWithAggregatesInput[]
    OR?: TrackPlayScalarWhereWithAggregatesInput[]
    NOT?: TrackPlayScalarWhereWithAggregatesInput | TrackPlayScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TrackPlay"> | string
    trackId?: StringWithAggregatesFilter<"TrackPlay"> | string
    playedAt?: DateTimeWithAggregatesFilter<"TrackPlay"> | Date | string
    userId?: StringWithAggregatesFilter<"TrackPlay"> | string
  }

  export type TrackWhereInput = {
    AND?: TrackWhereInput | TrackWhereInput[]
    OR?: TrackWhereInput[]
    NOT?: TrackWhereInput | TrackWhereInput[]
    id?: StringFilter<"Track"> | string
    name?: StringFilter<"Track"> | string
    duration?: IntFilter<"Track"> | number
    url?: StringFilter<"Track"> | string
    image?: StringNullableFilter<"Track"> | string | null
    albumId?: StringFilter<"Track"> | string
    album?: XOR<AlbumScalarRelationFilter, AlbumWhereInput>
    artists?: ArtistListRelationFilter
    TrackPlay?: TrackPlayListRelationFilter
  }

  export type TrackOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    duration?: SortOrder
    url?: SortOrder
    image?: SortOrderInput | SortOrder
    albumId?: SortOrder
    album?: AlbumOrderByWithRelationInput
    artists?: ArtistOrderByRelationAggregateInput
    TrackPlay?: TrackPlayOrderByRelationAggregateInput
  }

  export type TrackWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TrackWhereInput | TrackWhereInput[]
    OR?: TrackWhereInput[]
    NOT?: TrackWhereInput | TrackWhereInput[]
    name?: StringFilter<"Track"> | string
    duration?: IntFilter<"Track"> | number
    url?: StringFilter<"Track"> | string
    image?: StringNullableFilter<"Track"> | string | null
    albumId?: StringFilter<"Track"> | string
    album?: XOR<AlbumScalarRelationFilter, AlbumWhereInput>
    artists?: ArtistListRelationFilter
    TrackPlay?: TrackPlayListRelationFilter
  }, "id">

  export type TrackOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    duration?: SortOrder
    url?: SortOrder
    image?: SortOrderInput | SortOrder
    albumId?: SortOrder
    _count?: TrackCountOrderByAggregateInput
    _avg?: TrackAvgOrderByAggregateInput
    _max?: TrackMaxOrderByAggregateInput
    _min?: TrackMinOrderByAggregateInput
    _sum?: TrackSumOrderByAggregateInput
  }

  export type TrackScalarWhereWithAggregatesInput = {
    AND?: TrackScalarWhereWithAggregatesInput | TrackScalarWhereWithAggregatesInput[]
    OR?: TrackScalarWhereWithAggregatesInput[]
    NOT?: TrackScalarWhereWithAggregatesInput | TrackScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Track"> | string
    name?: StringWithAggregatesFilter<"Track"> | string
    duration?: IntWithAggregatesFilter<"Track"> | number
    url?: StringWithAggregatesFilter<"Track"> | string
    image?: StringNullableWithAggregatesFilter<"Track"> | string | null
    albumId?: StringWithAggregatesFilter<"Track"> | string
  }

  export type ArtistWhereInput = {
    AND?: ArtistWhereInput | ArtistWhereInput[]
    OR?: ArtistWhereInput[]
    NOT?: ArtistWhereInput | ArtistWhereInput[]
    id?: StringFilter<"Artist"> | string
    name?: StringFilter<"Artist"> | string
    url?: StringFilter<"Artist"> | string
    image?: StringNullableFilter<"Artist"> | string | null
    tracks?: TrackListRelationFilter
    genres?: GenreListRelationFilter
  }

  export type ArtistOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    url?: SortOrder
    image?: SortOrderInput | SortOrder
    tracks?: TrackOrderByRelationAggregateInput
    genres?: GenreOrderByRelationAggregateInput
  }

  export type ArtistWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ArtistWhereInput | ArtistWhereInput[]
    OR?: ArtistWhereInput[]
    NOT?: ArtistWhereInput | ArtistWhereInput[]
    name?: StringFilter<"Artist"> | string
    url?: StringFilter<"Artist"> | string
    image?: StringNullableFilter<"Artist"> | string | null
    tracks?: TrackListRelationFilter
    genres?: GenreListRelationFilter
  }, "id">

  export type ArtistOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    url?: SortOrder
    image?: SortOrderInput | SortOrder
    _count?: ArtistCountOrderByAggregateInput
    _max?: ArtistMaxOrderByAggregateInput
    _min?: ArtistMinOrderByAggregateInput
  }

  export type ArtistScalarWhereWithAggregatesInput = {
    AND?: ArtistScalarWhereWithAggregatesInput | ArtistScalarWhereWithAggregatesInput[]
    OR?: ArtistScalarWhereWithAggregatesInput[]
    NOT?: ArtistScalarWhereWithAggregatesInput | ArtistScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Artist"> | string
    name?: StringWithAggregatesFilter<"Artist"> | string
    url?: StringWithAggregatesFilter<"Artist"> | string
    image?: StringNullableWithAggregatesFilter<"Artist"> | string | null
  }

  export type AlbumWhereInput = {
    AND?: AlbumWhereInput | AlbumWhereInput[]
    OR?: AlbumWhereInput[]
    NOT?: AlbumWhereInput | AlbumWhereInput[]
    id?: StringFilter<"Album"> | string
    name?: StringFilter<"Album"> | string
    url?: StringFilter<"Album"> | string
    image?: StringNullableFilter<"Album"> | string | null
    tracks?: TrackListRelationFilter
  }

  export type AlbumOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    url?: SortOrder
    image?: SortOrderInput | SortOrder
    tracks?: TrackOrderByRelationAggregateInput
  }

  export type AlbumWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AlbumWhereInput | AlbumWhereInput[]
    OR?: AlbumWhereInput[]
    NOT?: AlbumWhereInput | AlbumWhereInput[]
    name?: StringFilter<"Album"> | string
    url?: StringFilter<"Album"> | string
    image?: StringNullableFilter<"Album"> | string | null
    tracks?: TrackListRelationFilter
  }, "id">

  export type AlbumOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    url?: SortOrder
    image?: SortOrderInput | SortOrder
    _count?: AlbumCountOrderByAggregateInput
    _max?: AlbumMaxOrderByAggregateInput
    _min?: AlbumMinOrderByAggregateInput
  }

  export type AlbumScalarWhereWithAggregatesInput = {
    AND?: AlbumScalarWhereWithAggregatesInput | AlbumScalarWhereWithAggregatesInput[]
    OR?: AlbumScalarWhereWithAggregatesInput[]
    NOT?: AlbumScalarWhereWithAggregatesInput | AlbumScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Album"> | string
    name?: StringWithAggregatesFilter<"Album"> | string
    url?: StringWithAggregatesFilter<"Album"> | string
    image?: StringNullableWithAggregatesFilter<"Album"> | string | null
  }

  export type GenreWhereInput = {
    AND?: GenreWhereInput | GenreWhereInput[]
    OR?: GenreWhereInput[]
    NOT?: GenreWhereInput | GenreWhereInput[]
    name?: StringFilter<"Genre"> | string
    artists?: ArtistListRelationFilter
  }

  export type GenreOrderByWithRelationInput = {
    name?: SortOrder
    artists?: ArtistOrderByRelationAggregateInput
  }

  export type GenreWhereUniqueInput = Prisma.AtLeast<{
    name?: string
    AND?: GenreWhereInput | GenreWhereInput[]
    OR?: GenreWhereInput[]
    NOT?: GenreWhereInput | GenreWhereInput[]
    artists?: ArtistListRelationFilter
  }, "name">

  export type GenreOrderByWithAggregationInput = {
    name?: SortOrder
    _count?: GenreCountOrderByAggregateInput
    _max?: GenreMaxOrderByAggregateInput
    _min?: GenreMinOrderByAggregateInput
  }

  export type GenreScalarWhereWithAggregatesInput = {
    AND?: GenreScalarWhereWithAggregatesInput | GenreScalarWhereWithAggregatesInput[]
    OR?: GenreScalarWhereWithAggregatesInput[]
    NOT?: GenreScalarWhereWithAggregatesInput | GenreScalarWhereWithAggregatesInput[]
    name?: StringWithAggregatesFilter<"Genre"> | string
  }

  export type TrackPlayCreateInput = {
    id: string
    playedAt: Date | string
    userId: string
    track: TrackCreateNestedOneWithoutTrackPlayInput
  }

  export type TrackPlayUncheckedCreateInput = {
    id: string
    trackId: string
    playedAt: Date | string
    userId: string
  }

  export type TrackPlayUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: StringFieldUpdateOperationsInput | string
    track?: TrackUpdateOneRequiredWithoutTrackPlayNestedInput
  }

  export type TrackPlayUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: StringFieldUpdateOperationsInput | string
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type TrackPlayCreateManyInput = {
    id: string
    trackId: string
    playedAt: Date | string
    userId: string
  }

  export type TrackPlayUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type TrackPlayUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    trackId?: StringFieldUpdateOperationsInput | string
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type TrackCreateInput = {
    id: string
    name: string
    duration: number
    url: string
    image?: string | null
    album: AlbumCreateNestedOneWithoutTracksInput
    artists?: ArtistCreateNestedManyWithoutTracksInput
    TrackPlay?: TrackPlayCreateNestedManyWithoutTrackInput
  }

  export type TrackUncheckedCreateInput = {
    id: string
    name: string
    duration: number
    url: string
    image?: string | null
    albumId: string
    artists?: ArtistUncheckedCreateNestedManyWithoutTracksInput
    TrackPlay?: TrackPlayUncheckedCreateNestedManyWithoutTrackInput
  }

  export type TrackUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    duration?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    album?: AlbumUpdateOneRequiredWithoutTracksNestedInput
    artists?: ArtistUpdateManyWithoutTracksNestedInput
    TrackPlay?: TrackPlayUpdateManyWithoutTrackNestedInput
  }

  export type TrackUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    duration?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    albumId?: StringFieldUpdateOperationsInput | string
    artists?: ArtistUncheckedUpdateManyWithoutTracksNestedInput
    TrackPlay?: TrackPlayUncheckedUpdateManyWithoutTrackNestedInput
  }

  export type TrackCreateManyInput = {
    id: string
    name: string
    duration: number
    url: string
    image?: string | null
    albumId: string
  }

  export type TrackUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    duration?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TrackUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    duration?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    albumId?: StringFieldUpdateOperationsInput | string
  }

  export type ArtistCreateInput = {
    id: string
    name: string
    url: string
    image?: string | null
    tracks?: TrackCreateNestedManyWithoutArtistsInput
    genres?: GenreCreateNestedManyWithoutArtistsInput
  }

  export type ArtistUncheckedCreateInput = {
    id: string
    name: string
    url: string
    image?: string | null
    tracks?: TrackUncheckedCreateNestedManyWithoutArtistsInput
    genres?: GenreUncheckedCreateNestedManyWithoutArtistsInput
  }

  export type ArtistUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    tracks?: TrackUpdateManyWithoutArtistsNestedInput
    genres?: GenreUpdateManyWithoutArtistsNestedInput
  }

  export type ArtistUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    tracks?: TrackUncheckedUpdateManyWithoutArtistsNestedInput
    genres?: GenreUncheckedUpdateManyWithoutArtistsNestedInput
  }

  export type ArtistCreateManyInput = {
    id: string
    name: string
    url: string
    image?: string | null
  }

  export type ArtistUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ArtistUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AlbumCreateInput = {
    id: string
    name: string
    url: string
    image?: string | null
    tracks?: TrackCreateNestedManyWithoutAlbumInput
  }

  export type AlbumUncheckedCreateInput = {
    id: string
    name: string
    url: string
    image?: string | null
    tracks?: TrackUncheckedCreateNestedManyWithoutAlbumInput
  }

  export type AlbumUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    tracks?: TrackUpdateManyWithoutAlbumNestedInput
  }

  export type AlbumUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    tracks?: TrackUncheckedUpdateManyWithoutAlbumNestedInput
  }

  export type AlbumCreateManyInput = {
    id: string
    name: string
    url: string
    image?: string | null
  }

  export type AlbumUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AlbumUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type GenreCreateInput = {
    name: string
    artists?: ArtistCreateNestedManyWithoutGenresInput
  }

  export type GenreUncheckedCreateInput = {
    name: string
    artists?: ArtistUncheckedCreateNestedManyWithoutGenresInput
  }

  export type GenreUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    artists?: ArtistUpdateManyWithoutGenresNestedInput
  }

  export type GenreUncheckedUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    artists?: ArtistUncheckedUpdateManyWithoutGenresNestedInput
  }

  export type GenreCreateManyInput = {
    name: string
  }

  export type GenreUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
  }

  export type GenreUncheckedUpdateManyInput = {
    name?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type TrackScalarRelationFilter = {
    is?: TrackWhereInput
    isNot?: TrackWhereInput
  }

  export type TrackPlayCountOrderByAggregateInput = {
    id?: SortOrder
    trackId?: SortOrder
    playedAt?: SortOrder
    userId?: SortOrder
  }

  export type TrackPlayMaxOrderByAggregateInput = {
    id?: SortOrder
    trackId?: SortOrder
    playedAt?: SortOrder
    userId?: SortOrder
  }

  export type TrackPlayMinOrderByAggregateInput = {
    id?: SortOrder
    trackId?: SortOrder
    playedAt?: SortOrder
    userId?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type AlbumScalarRelationFilter = {
    is?: AlbumWhereInput
    isNot?: AlbumWhereInput
  }

  export type ArtistListRelationFilter = {
    every?: ArtistWhereInput
    some?: ArtistWhereInput
    none?: ArtistWhereInput
  }

  export type TrackPlayListRelationFilter = {
    every?: TrackPlayWhereInput
    some?: TrackPlayWhereInput
    none?: TrackPlayWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ArtistOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TrackPlayOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TrackCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    duration?: SortOrder
    url?: SortOrder
    image?: SortOrder
    albumId?: SortOrder
  }

  export type TrackAvgOrderByAggregateInput = {
    duration?: SortOrder
  }

  export type TrackMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    duration?: SortOrder
    url?: SortOrder
    image?: SortOrder
    albumId?: SortOrder
  }

  export type TrackMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    duration?: SortOrder
    url?: SortOrder
    image?: SortOrder
    albumId?: SortOrder
  }

  export type TrackSumOrderByAggregateInput = {
    duration?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type TrackListRelationFilter = {
    every?: TrackWhereInput
    some?: TrackWhereInput
    none?: TrackWhereInput
  }

  export type GenreListRelationFilter = {
    every?: GenreWhereInput
    some?: GenreWhereInput
    none?: GenreWhereInput
  }

  export type TrackOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type GenreOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ArtistCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    url?: SortOrder
    image?: SortOrder
  }

  export type ArtistMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    url?: SortOrder
    image?: SortOrder
  }

  export type ArtistMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    url?: SortOrder
    image?: SortOrder
  }

  export type AlbumCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    url?: SortOrder
    image?: SortOrder
  }

  export type AlbumMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    url?: SortOrder
    image?: SortOrder
  }

  export type AlbumMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    url?: SortOrder
    image?: SortOrder
  }

  export type GenreCountOrderByAggregateInput = {
    name?: SortOrder
  }

  export type GenreMaxOrderByAggregateInput = {
    name?: SortOrder
  }

  export type GenreMinOrderByAggregateInput = {
    name?: SortOrder
  }

  export type TrackCreateNestedOneWithoutTrackPlayInput = {
    create?: XOR<TrackCreateWithoutTrackPlayInput, TrackUncheckedCreateWithoutTrackPlayInput>
    connectOrCreate?: TrackCreateOrConnectWithoutTrackPlayInput
    connect?: TrackWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type TrackUpdateOneRequiredWithoutTrackPlayNestedInput = {
    create?: XOR<TrackCreateWithoutTrackPlayInput, TrackUncheckedCreateWithoutTrackPlayInput>
    connectOrCreate?: TrackCreateOrConnectWithoutTrackPlayInput
    upsert?: TrackUpsertWithoutTrackPlayInput
    connect?: TrackWhereUniqueInput
    update?: XOR<XOR<TrackUpdateToOneWithWhereWithoutTrackPlayInput, TrackUpdateWithoutTrackPlayInput>, TrackUncheckedUpdateWithoutTrackPlayInput>
  }

  export type AlbumCreateNestedOneWithoutTracksInput = {
    create?: XOR<AlbumCreateWithoutTracksInput, AlbumUncheckedCreateWithoutTracksInput>
    connectOrCreate?: AlbumCreateOrConnectWithoutTracksInput
    connect?: AlbumWhereUniqueInput
  }

  export type ArtistCreateNestedManyWithoutTracksInput = {
    create?: XOR<ArtistCreateWithoutTracksInput, ArtistUncheckedCreateWithoutTracksInput> | ArtistCreateWithoutTracksInput[] | ArtistUncheckedCreateWithoutTracksInput[]
    connectOrCreate?: ArtistCreateOrConnectWithoutTracksInput | ArtistCreateOrConnectWithoutTracksInput[]
    connect?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
  }

  export type TrackPlayCreateNestedManyWithoutTrackInput = {
    create?: XOR<TrackPlayCreateWithoutTrackInput, TrackPlayUncheckedCreateWithoutTrackInput> | TrackPlayCreateWithoutTrackInput[] | TrackPlayUncheckedCreateWithoutTrackInput[]
    connectOrCreate?: TrackPlayCreateOrConnectWithoutTrackInput | TrackPlayCreateOrConnectWithoutTrackInput[]
    createMany?: TrackPlayCreateManyTrackInputEnvelope
    connect?: TrackPlayWhereUniqueInput | TrackPlayWhereUniqueInput[]
  }

  export type ArtistUncheckedCreateNestedManyWithoutTracksInput = {
    create?: XOR<ArtistCreateWithoutTracksInput, ArtistUncheckedCreateWithoutTracksInput> | ArtistCreateWithoutTracksInput[] | ArtistUncheckedCreateWithoutTracksInput[]
    connectOrCreate?: ArtistCreateOrConnectWithoutTracksInput | ArtistCreateOrConnectWithoutTracksInput[]
    connect?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
  }

  export type TrackPlayUncheckedCreateNestedManyWithoutTrackInput = {
    create?: XOR<TrackPlayCreateWithoutTrackInput, TrackPlayUncheckedCreateWithoutTrackInput> | TrackPlayCreateWithoutTrackInput[] | TrackPlayUncheckedCreateWithoutTrackInput[]
    connectOrCreate?: TrackPlayCreateOrConnectWithoutTrackInput | TrackPlayCreateOrConnectWithoutTrackInput[]
    createMany?: TrackPlayCreateManyTrackInputEnvelope
    connect?: TrackPlayWhereUniqueInput | TrackPlayWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type AlbumUpdateOneRequiredWithoutTracksNestedInput = {
    create?: XOR<AlbumCreateWithoutTracksInput, AlbumUncheckedCreateWithoutTracksInput>
    connectOrCreate?: AlbumCreateOrConnectWithoutTracksInput
    upsert?: AlbumUpsertWithoutTracksInput
    connect?: AlbumWhereUniqueInput
    update?: XOR<XOR<AlbumUpdateToOneWithWhereWithoutTracksInput, AlbumUpdateWithoutTracksInput>, AlbumUncheckedUpdateWithoutTracksInput>
  }

  export type ArtistUpdateManyWithoutTracksNestedInput = {
    create?: XOR<ArtistCreateWithoutTracksInput, ArtistUncheckedCreateWithoutTracksInput> | ArtistCreateWithoutTracksInput[] | ArtistUncheckedCreateWithoutTracksInput[]
    connectOrCreate?: ArtistCreateOrConnectWithoutTracksInput | ArtistCreateOrConnectWithoutTracksInput[]
    upsert?: ArtistUpsertWithWhereUniqueWithoutTracksInput | ArtistUpsertWithWhereUniqueWithoutTracksInput[]
    set?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    disconnect?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    delete?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    connect?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    update?: ArtistUpdateWithWhereUniqueWithoutTracksInput | ArtistUpdateWithWhereUniqueWithoutTracksInput[]
    updateMany?: ArtistUpdateManyWithWhereWithoutTracksInput | ArtistUpdateManyWithWhereWithoutTracksInput[]
    deleteMany?: ArtistScalarWhereInput | ArtistScalarWhereInput[]
  }

  export type TrackPlayUpdateManyWithoutTrackNestedInput = {
    create?: XOR<TrackPlayCreateWithoutTrackInput, TrackPlayUncheckedCreateWithoutTrackInput> | TrackPlayCreateWithoutTrackInput[] | TrackPlayUncheckedCreateWithoutTrackInput[]
    connectOrCreate?: TrackPlayCreateOrConnectWithoutTrackInput | TrackPlayCreateOrConnectWithoutTrackInput[]
    upsert?: TrackPlayUpsertWithWhereUniqueWithoutTrackInput | TrackPlayUpsertWithWhereUniqueWithoutTrackInput[]
    createMany?: TrackPlayCreateManyTrackInputEnvelope
    set?: TrackPlayWhereUniqueInput | TrackPlayWhereUniqueInput[]
    disconnect?: TrackPlayWhereUniqueInput | TrackPlayWhereUniqueInput[]
    delete?: TrackPlayWhereUniqueInput | TrackPlayWhereUniqueInput[]
    connect?: TrackPlayWhereUniqueInput | TrackPlayWhereUniqueInput[]
    update?: TrackPlayUpdateWithWhereUniqueWithoutTrackInput | TrackPlayUpdateWithWhereUniqueWithoutTrackInput[]
    updateMany?: TrackPlayUpdateManyWithWhereWithoutTrackInput | TrackPlayUpdateManyWithWhereWithoutTrackInput[]
    deleteMany?: TrackPlayScalarWhereInput | TrackPlayScalarWhereInput[]
  }

  export type ArtistUncheckedUpdateManyWithoutTracksNestedInput = {
    create?: XOR<ArtistCreateWithoutTracksInput, ArtistUncheckedCreateWithoutTracksInput> | ArtistCreateWithoutTracksInput[] | ArtistUncheckedCreateWithoutTracksInput[]
    connectOrCreate?: ArtistCreateOrConnectWithoutTracksInput | ArtistCreateOrConnectWithoutTracksInput[]
    upsert?: ArtistUpsertWithWhereUniqueWithoutTracksInput | ArtistUpsertWithWhereUniqueWithoutTracksInput[]
    set?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    disconnect?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    delete?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    connect?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    update?: ArtistUpdateWithWhereUniqueWithoutTracksInput | ArtistUpdateWithWhereUniqueWithoutTracksInput[]
    updateMany?: ArtistUpdateManyWithWhereWithoutTracksInput | ArtistUpdateManyWithWhereWithoutTracksInput[]
    deleteMany?: ArtistScalarWhereInput | ArtistScalarWhereInput[]
  }

  export type TrackPlayUncheckedUpdateManyWithoutTrackNestedInput = {
    create?: XOR<TrackPlayCreateWithoutTrackInput, TrackPlayUncheckedCreateWithoutTrackInput> | TrackPlayCreateWithoutTrackInput[] | TrackPlayUncheckedCreateWithoutTrackInput[]
    connectOrCreate?: TrackPlayCreateOrConnectWithoutTrackInput | TrackPlayCreateOrConnectWithoutTrackInput[]
    upsert?: TrackPlayUpsertWithWhereUniqueWithoutTrackInput | TrackPlayUpsertWithWhereUniqueWithoutTrackInput[]
    createMany?: TrackPlayCreateManyTrackInputEnvelope
    set?: TrackPlayWhereUniqueInput | TrackPlayWhereUniqueInput[]
    disconnect?: TrackPlayWhereUniqueInput | TrackPlayWhereUniqueInput[]
    delete?: TrackPlayWhereUniqueInput | TrackPlayWhereUniqueInput[]
    connect?: TrackPlayWhereUniqueInput | TrackPlayWhereUniqueInput[]
    update?: TrackPlayUpdateWithWhereUniqueWithoutTrackInput | TrackPlayUpdateWithWhereUniqueWithoutTrackInput[]
    updateMany?: TrackPlayUpdateManyWithWhereWithoutTrackInput | TrackPlayUpdateManyWithWhereWithoutTrackInput[]
    deleteMany?: TrackPlayScalarWhereInput | TrackPlayScalarWhereInput[]
  }

  export type TrackCreateNestedManyWithoutArtistsInput = {
    create?: XOR<TrackCreateWithoutArtistsInput, TrackUncheckedCreateWithoutArtistsInput> | TrackCreateWithoutArtistsInput[] | TrackUncheckedCreateWithoutArtistsInput[]
    connectOrCreate?: TrackCreateOrConnectWithoutArtistsInput | TrackCreateOrConnectWithoutArtistsInput[]
    connect?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
  }

  export type GenreCreateNestedManyWithoutArtistsInput = {
    create?: XOR<GenreCreateWithoutArtistsInput, GenreUncheckedCreateWithoutArtistsInput> | GenreCreateWithoutArtistsInput[] | GenreUncheckedCreateWithoutArtistsInput[]
    connectOrCreate?: GenreCreateOrConnectWithoutArtistsInput | GenreCreateOrConnectWithoutArtistsInput[]
    connect?: GenreWhereUniqueInput | GenreWhereUniqueInput[]
  }

  export type TrackUncheckedCreateNestedManyWithoutArtistsInput = {
    create?: XOR<TrackCreateWithoutArtistsInput, TrackUncheckedCreateWithoutArtistsInput> | TrackCreateWithoutArtistsInput[] | TrackUncheckedCreateWithoutArtistsInput[]
    connectOrCreate?: TrackCreateOrConnectWithoutArtistsInput | TrackCreateOrConnectWithoutArtistsInput[]
    connect?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
  }

  export type GenreUncheckedCreateNestedManyWithoutArtistsInput = {
    create?: XOR<GenreCreateWithoutArtistsInput, GenreUncheckedCreateWithoutArtistsInput> | GenreCreateWithoutArtistsInput[] | GenreUncheckedCreateWithoutArtistsInput[]
    connectOrCreate?: GenreCreateOrConnectWithoutArtistsInput | GenreCreateOrConnectWithoutArtistsInput[]
    connect?: GenreWhereUniqueInput | GenreWhereUniqueInput[]
  }

  export type TrackUpdateManyWithoutArtistsNestedInput = {
    create?: XOR<TrackCreateWithoutArtistsInput, TrackUncheckedCreateWithoutArtistsInput> | TrackCreateWithoutArtistsInput[] | TrackUncheckedCreateWithoutArtistsInput[]
    connectOrCreate?: TrackCreateOrConnectWithoutArtistsInput | TrackCreateOrConnectWithoutArtistsInput[]
    upsert?: TrackUpsertWithWhereUniqueWithoutArtistsInput | TrackUpsertWithWhereUniqueWithoutArtistsInput[]
    set?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    disconnect?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    delete?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    connect?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    update?: TrackUpdateWithWhereUniqueWithoutArtistsInput | TrackUpdateWithWhereUniqueWithoutArtistsInput[]
    updateMany?: TrackUpdateManyWithWhereWithoutArtistsInput | TrackUpdateManyWithWhereWithoutArtistsInput[]
    deleteMany?: TrackScalarWhereInput | TrackScalarWhereInput[]
  }

  export type GenreUpdateManyWithoutArtistsNestedInput = {
    create?: XOR<GenreCreateWithoutArtistsInput, GenreUncheckedCreateWithoutArtistsInput> | GenreCreateWithoutArtistsInput[] | GenreUncheckedCreateWithoutArtistsInput[]
    connectOrCreate?: GenreCreateOrConnectWithoutArtistsInput | GenreCreateOrConnectWithoutArtistsInput[]
    upsert?: GenreUpsertWithWhereUniqueWithoutArtistsInput | GenreUpsertWithWhereUniqueWithoutArtistsInput[]
    set?: GenreWhereUniqueInput | GenreWhereUniqueInput[]
    disconnect?: GenreWhereUniqueInput | GenreWhereUniqueInput[]
    delete?: GenreWhereUniqueInput | GenreWhereUniqueInput[]
    connect?: GenreWhereUniqueInput | GenreWhereUniqueInput[]
    update?: GenreUpdateWithWhereUniqueWithoutArtistsInput | GenreUpdateWithWhereUniqueWithoutArtistsInput[]
    updateMany?: GenreUpdateManyWithWhereWithoutArtistsInput | GenreUpdateManyWithWhereWithoutArtistsInput[]
    deleteMany?: GenreScalarWhereInput | GenreScalarWhereInput[]
  }

  export type TrackUncheckedUpdateManyWithoutArtistsNestedInput = {
    create?: XOR<TrackCreateWithoutArtistsInput, TrackUncheckedCreateWithoutArtistsInput> | TrackCreateWithoutArtistsInput[] | TrackUncheckedCreateWithoutArtistsInput[]
    connectOrCreate?: TrackCreateOrConnectWithoutArtistsInput | TrackCreateOrConnectWithoutArtistsInput[]
    upsert?: TrackUpsertWithWhereUniqueWithoutArtistsInput | TrackUpsertWithWhereUniqueWithoutArtistsInput[]
    set?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    disconnect?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    delete?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    connect?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    update?: TrackUpdateWithWhereUniqueWithoutArtistsInput | TrackUpdateWithWhereUniqueWithoutArtistsInput[]
    updateMany?: TrackUpdateManyWithWhereWithoutArtistsInput | TrackUpdateManyWithWhereWithoutArtistsInput[]
    deleteMany?: TrackScalarWhereInput | TrackScalarWhereInput[]
  }

  export type GenreUncheckedUpdateManyWithoutArtistsNestedInput = {
    create?: XOR<GenreCreateWithoutArtistsInput, GenreUncheckedCreateWithoutArtistsInput> | GenreCreateWithoutArtistsInput[] | GenreUncheckedCreateWithoutArtistsInput[]
    connectOrCreate?: GenreCreateOrConnectWithoutArtistsInput | GenreCreateOrConnectWithoutArtistsInput[]
    upsert?: GenreUpsertWithWhereUniqueWithoutArtistsInput | GenreUpsertWithWhereUniqueWithoutArtistsInput[]
    set?: GenreWhereUniqueInput | GenreWhereUniqueInput[]
    disconnect?: GenreWhereUniqueInput | GenreWhereUniqueInput[]
    delete?: GenreWhereUniqueInput | GenreWhereUniqueInput[]
    connect?: GenreWhereUniqueInput | GenreWhereUniqueInput[]
    update?: GenreUpdateWithWhereUniqueWithoutArtistsInput | GenreUpdateWithWhereUniqueWithoutArtistsInput[]
    updateMany?: GenreUpdateManyWithWhereWithoutArtistsInput | GenreUpdateManyWithWhereWithoutArtistsInput[]
    deleteMany?: GenreScalarWhereInput | GenreScalarWhereInput[]
  }

  export type TrackCreateNestedManyWithoutAlbumInput = {
    create?: XOR<TrackCreateWithoutAlbumInput, TrackUncheckedCreateWithoutAlbumInput> | TrackCreateWithoutAlbumInput[] | TrackUncheckedCreateWithoutAlbumInput[]
    connectOrCreate?: TrackCreateOrConnectWithoutAlbumInput | TrackCreateOrConnectWithoutAlbumInput[]
    createMany?: TrackCreateManyAlbumInputEnvelope
    connect?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
  }

  export type TrackUncheckedCreateNestedManyWithoutAlbumInput = {
    create?: XOR<TrackCreateWithoutAlbumInput, TrackUncheckedCreateWithoutAlbumInput> | TrackCreateWithoutAlbumInput[] | TrackUncheckedCreateWithoutAlbumInput[]
    connectOrCreate?: TrackCreateOrConnectWithoutAlbumInput | TrackCreateOrConnectWithoutAlbumInput[]
    createMany?: TrackCreateManyAlbumInputEnvelope
    connect?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
  }

  export type TrackUpdateManyWithoutAlbumNestedInput = {
    create?: XOR<TrackCreateWithoutAlbumInput, TrackUncheckedCreateWithoutAlbumInput> | TrackCreateWithoutAlbumInput[] | TrackUncheckedCreateWithoutAlbumInput[]
    connectOrCreate?: TrackCreateOrConnectWithoutAlbumInput | TrackCreateOrConnectWithoutAlbumInput[]
    upsert?: TrackUpsertWithWhereUniqueWithoutAlbumInput | TrackUpsertWithWhereUniqueWithoutAlbumInput[]
    createMany?: TrackCreateManyAlbumInputEnvelope
    set?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    disconnect?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    delete?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    connect?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    update?: TrackUpdateWithWhereUniqueWithoutAlbumInput | TrackUpdateWithWhereUniqueWithoutAlbumInput[]
    updateMany?: TrackUpdateManyWithWhereWithoutAlbumInput | TrackUpdateManyWithWhereWithoutAlbumInput[]
    deleteMany?: TrackScalarWhereInput | TrackScalarWhereInput[]
  }

  export type TrackUncheckedUpdateManyWithoutAlbumNestedInput = {
    create?: XOR<TrackCreateWithoutAlbumInput, TrackUncheckedCreateWithoutAlbumInput> | TrackCreateWithoutAlbumInput[] | TrackUncheckedCreateWithoutAlbumInput[]
    connectOrCreate?: TrackCreateOrConnectWithoutAlbumInput | TrackCreateOrConnectWithoutAlbumInput[]
    upsert?: TrackUpsertWithWhereUniqueWithoutAlbumInput | TrackUpsertWithWhereUniqueWithoutAlbumInput[]
    createMany?: TrackCreateManyAlbumInputEnvelope
    set?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    disconnect?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    delete?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    connect?: TrackWhereUniqueInput | TrackWhereUniqueInput[]
    update?: TrackUpdateWithWhereUniqueWithoutAlbumInput | TrackUpdateWithWhereUniqueWithoutAlbumInput[]
    updateMany?: TrackUpdateManyWithWhereWithoutAlbumInput | TrackUpdateManyWithWhereWithoutAlbumInput[]
    deleteMany?: TrackScalarWhereInput | TrackScalarWhereInput[]
  }

  export type ArtistCreateNestedManyWithoutGenresInput = {
    create?: XOR<ArtistCreateWithoutGenresInput, ArtistUncheckedCreateWithoutGenresInput> | ArtistCreateWithoutGenresInput[] | ArtistUncheckedCreateWithoutGenresInput[]
    connectOrCreate?: ArtistCreateOrConnectWithoutGenresInput | ArtistCreateOrConnectWithoutGenresInput[]
    connect?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
  }

  export type ArtistUncheckedCreateNestedManyWithoutGenresInput = {
    create?: XOR<ArtistCreateWithoutGenresInput, ArtistUncheckedCreateWithoutGenresInput> | ArtistCreateWithoutGenresInput[] | ArtistUncheckedCreateWithoutGenresInput[]
    connectOrCreate?: ArtistCreateOrConnectWithoutGenresInput | ArtistCreateOrConnectWithoutGenresInput[]
    connect?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
  }

  export type ArtistUpdateManyWithoutGenresNestedInput = {
    create?: XOR<ArtistCreateWithoutGenresInput, ArtistUncheckedCreateWithoutGenresInput> | ArtistCreateWithoutGenresInput[] | ArtistUncheckedCreateWithoutGenresInput[]
    connectOrCreate?: ArtistCreateOrConnectWithoutGenresInput | ArtistCreateOrConnectWithoutGenresInput[]
    upsert?: ArtistUpsertWithWhereUniqueWithoutGenresInput | ArtistUpsertWithWhereUniqueWithoutGenresInput[]
    set?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    disconnect?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    delete?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    connect?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    update?: ArtistUpdateWithWhereUniqueWithoutGenresInput | ArtistUpdateWithWhereUniqueWithoutGenresInput[]
    updateMany?: ArtistUpdateManyWithWhereWithoutGenresInput | ArtistUpdateManyWithWhereWithoutGenresInput[]
    deleteMany?: ArtistScalarWhereInput | ArtistScalarWhereInput[]
  }

  export type ArtistUncheckedUpdateManyWithoutGenresNestedInput = {
    create?: XOR<ArtistCreateWithoutGenresInput, ArtistUncheckedCreateWithoutGenresInput> | ArtistCreateWithoutGenresInput[] | ArtistUncheckedCreateWithoutGenresInput[]
    connectOrCreate?: ArtistCreateOrConnectWithoutGenresInput | ArtistCreateOrConnectWithoutGenresInput[]
    upsert?: ArtistUpsertWithWhereUniqueWithoutGenresInput | ArtistUpsertWithWhereUniqueWithoutGenresInput[]
    set?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    disconnect?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    delete?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    connect?: ArtistWhereUniqueInput | ArtistWhereUniqueInput[]
    update?: ArtistUpdateWithWhereUniqueWithoutGenresInput | ArtistUpdateWithWhereUniqueWithoutGenresInput[]
    updateMany?: ArtistUpdateManyWithWhereWithoutGenresInput | ArtistUpdateManyWithWhereWithoutGenresInput[]
    deleteMany?: ArtistScalarWhereInput | ArtistScalarWhereInput[]
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type TrackCreateWithoutTrackPlayInput = {
    id: string
    name: string
    duration: number
    url: string
    image?: string | null
    album: AlbumCreateNestedOneWithoutTracksInput
    artists?: ArtistCreateNestedManyWithoutTracksInput
  }

  export type TrackUncheckedCreateWithoutTrackPlayInput = {
    id: string
    name: string
    duration: number
    url: string
    image?: string | null
    albumId: string
    artists?: ArtistUncheckedCreateNestedManyWithoutTracksInput
  }

  export type TrackCreateOrConnectWithoutTrackPlayInput = {
    where: TrackWhereUniqueInput
    create: XOR<TrackCreateWithoutTrackPlayInput, TrackUncheckedCreateWithoutTrackPlayInput>
  }

  export type TrackUpsertWithoutTrackPlayInput = {
    update: XOR<TrackUpdateWithoutTrackPlayInput, TrackUncheckedUpdateWithoutTrackPlayInput>
    create: XOR<TrackCreateWithoutTrackPlayInput, TrackUncheckedCreateWithoutTrackPlayInput>
    where?: TrackWhereInput
  }

  export type TrackUpdateToOneWithWhereWithoutTrackPlayInput = {
    where?: TrackWhereInput
    data: XOR<TrackUpdateWithoutTrackPlayInput, TrackUncheckedUpdateWithoutTrackPlayInput>
  }

  export type TrackUpdateWithoutTrackPlayInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    duration?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    album?: AlbumUpdateOneRequiredWithoutTracksNestedInput
    artists?: ArtistUpdateManyWithoutTracksNestedInput
  }

  export type TrackUncheckedUpdateWithoutTrackPlayInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    duration?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    albumId?: StringFieldUpdateOperationsInput | string
    artists?: ArtistUncheckedUpdateManyWithoutTracksNestedInput
  }

  export type AlbumCreateWithoutTracksInput = {
    id: string
    name: string
    url: string
    image?: string | null
  }

  export type AlbumUncheckedCreateWithoutTracksInput = {
    id: string
    name: string
    url: string
    image?: string | null
  }

  export type AlbumCreateOrConnectWithoutTracksInput = {
    where: AlbumWhereUniqueInput
    create: XOR<AlbumCreateWithoutTracksInput, AlbumUncheckedCreateWithoutTracksInput>
  }

  export type ArtistCreateWithoutTracksInput = {
    id: string
    name: string
    url: string
    image?: string | null
    genres?: GenreCreateNestedManyWithoutArtistsInput
  }

  export type ArtistUncheckedCreateWithoutTracksInput = {
    id: string
    name: string
    url: string
    image?: string | null
    genres?: GenreUncheckedCreateNestedManyWithoutArtistsInput
  }

  export type ArtistCreateOrConnectWithoutTracksInput = {
    where: ArtistWhereUniqueInput
    create: XOR<ArtistCreateWithoutTracksInput, ArtistUncheckedCreateWithoutTracksInput>
  }

  export type TrackPlayCreateWithoutTrackInput = {
    id: string
    playedAt: Date | string
    userId: string
  }

  export type TrackPlayUncheckedCreateWithoutTrackInput = {
    id: string
    playedAt: Date | string
    userId: string
  }

  export type TrackPlayCreateOrConnectWithoutTrackInput = {
    where: TrackPlayWhereUniqueInput
    create: XOR<TrackPlayCreateWithoutTrackInput, TrackPlayUncheckedCreateWithoutTrackInput>
  }

  export type TrackPlayCreateManyTrackInputEnvelope = {
    data: TrackPlayCreateManyTrackInput | TrackPlayCreateManyTrackInput[]
    skipDuplicates?: boolean
  }

  export type AlbumUpsertWithoutTracksInput = {
    update: XOR<AlbumUpdateWithoutTracksInput, AlbumUncheckedUpdateWithoutTracksInput>
    create: XOR<AlbumCreateWithoutTracksInput, AlbumUncheckedCreateWithoutTracksInput>
    where?: AlbumWhereInput
  }

  export type AlbumUpdateToOneWithWhereWithoutTracksInput = {
    where?: AlbumWhereInput
    data: XOR<AlbumUpdateWithoutTracksInput, AlbumUncheckedUpdateWithoutTracksInput>
  }

  export type AlbumUpdateWithoutTracksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AlbumUncheckedUpdateWithoutTracksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ArtistUpsertWithWhereUniqueWithoutTracksInput = {
    where: ArtistWhereUniqueInput
    update: XOR<ArtistUpdateWithoutTracksInput, ArtistUncheckedUpdateWithoutTracksInput>
    create: XOR<ArtistCreateWithoutTracksInput, ArtistUncheckedCreateWithoutTracksInput>
  }

  export type ArtistUpdateWithWhereUniqueWithoutTracksInput = {
    where: ArtistWhereUniqueInput
    data: XOR<ArtistUpdateWithoutTracksInput, ArtistUncheckedUpdateWithoutTracksInput>
  }

  export type ArtistUpdateManyWithWhereWithoutTracksInput = {
    where: ArtistScalarWhereInput
    data: XOR<ArtistUpdateManyMutationInput, ArtistUncheckedUpdateManyWithoutTracksInput>
  }

  export type ArtistScalarWhereInput = {
    AND?: ArtistScalarWhereInput | ArtistScalarWhereInput[]
    OR?: ArtistScalarWhereInput[]
    NOT?: ArtistScalarWhereInput | ArtistScalarWhereInput[]
    id?: StringFilter<"Artist"> | string
    name?: StringFilter<"Artist"> | string
    url?: StringFilter<"Artist"> | string
    image?: StringNullableFilter<"Artist"> | string | null
  }

  export type TrackPlayUpsertWithWhereUniqueWithoutTrackInput = {
    where: TrackPlayWhereUniqueInput
    update: XOR<TrackPlayUpdateWithoutTrackInput, TrackPlayUncheckedUpdateWithoutTrackInput>
    create: XOR<TrackPlayCreateWithoutTrackInput, TrackPlayUncheckedCreateWithoutTrackInput>
  }

  export type TrackPlayUpdateWithWhereUniqueWithoutTrackInput = {
    where: TrackPlayWhereUniqueInput
    data: XOR<TrackPlayUpdateWithoutTrackInput, TrackPlayUncheckedUpdateWithoutTrackInput>
  }

  export type TrackPlayUpdateManyWithWhereWithoutTrackInput = {
    where: TrackPlayScalarWhereInput
    data: XOR<TrackPlayUpdateManyMutationInput, TrackPlayUncheckedUpdateManyWithoutTrackInput>
  }

  export type TrackPlayScalarWhereInput = {
    AND?: TrackPlayScalarWhereInput | TrackPlayScalarWhereInput[]
    OR?: TrackPlayScalarWhereInput[]
    NOT?: TrackPlayScalarWhereInput | TrackPlayScalarWhereInput[]
    id?: StringFilter<"TrackPlay"> | string
    trackId?: StringFilter<"TrackPlay"> | string
    playedAt?: DateTimeFilter<"TrackPlay"> | Date | string
    userId?: StringFilter<"TrackPlay"> | string
  }

  export type TrackCreateWithoutArtistsInput = {
    id: string
    name: string
    duration: number
    url: string
    image?: string | null
    album: AlbumCreateNestedOneWithoutTracksInput
    TrackPlay?: TrackPlayCreateNestedManyWithoutTrackInput
  }

  export type TrackUncheckedCreateWithoutArtistsInput = {
    id: string
    name: string
    duration: number
    url: string
    image?: string | null
    albumId: string
    TrackPlay?: TrackPlayUncheckedCreateNestedManyWithoutTrackInput
  }

  export type TrackCreateOrConnectWithoutArtistsInput = {
    where: TrackWhereUniqueInput
    create: XOR<TrackCreateWithoutArtistsInput, TrackUncheckedCreateWithoutArtistsInput>
  }

  export type GenreCreateWithoutArtistsInput = {
    name: string
  }

  export type GenreUncheckedCreateWithoutArtistsInput = {
    name: string
  }

  export type GenreCreateOrConnectWithoutArtistsInput = {
    where: GenreWhereUniqueInput
    create: XOR<GenreCreateWithoutArtistsInput, GenreUncheckedCreateWithoutArtistsInput>
  }

  export type TrackUpsertWithWhereUniqueWithoutArtistsInput = {
    where: TrackWhereUniqueInput
    update: XOR<TrackUpdateWithoutArtistsInput, TrackUncheckedUpdateWithoutArtistsInput>
    create: XOR<TrackCreateWithoutArtistsInput, TrackUncheckedCreateWithoutArtistsInput>
  }

  export type TrackUpdateWithWhereUniqueWithoutArtistsInput = {
    where: TrackWhereUniqueInput
    data: XOR<TrackUpdateWithoutArtistsInput, TrackUncheckedUpdateWithoutArtistsInput>
  }

  export type TrackUpdateManyWithWhereWithoutArtistsInput = {
    where: TrackScalarWhereInput
    data: XOR<TrackUpdateManyMutationInput, TrackUncheckedUpdateManyWithoutArtistsInput>
  }

  export type TrackScalarWhereInput = {
    AND?: TrackScalarWhereInput | TrackScalarWhereInput[]
    OR?: TrackScalarWhereInput[]
    NOT?: TrackScalarWhereInput | TrackScalarWhereInput[]
    id?: StringFilter<"Track"> | string
    name?: StringFilter<"Track"> | string
    duration?: IntFilter<"Track"> | number
    url?: StringFilter<"Track"> | string
    image?: StringNullableFilter<"Track"> | string | null
    albumId?: StringFilter<"Track"> | string
  }

  export type GenreUpsertWithWhereUniqueWithoutArtistsInput = {
    where: GenreWhereUniqueInput
    update: XOR<GenreUpdateWithoutArtistsInput, GenreUncheckedUpdateWithoutArtistsInput>
    create: XOR<GenreCreateWithoutArtistsInput, GenreUncheckedCreateWithoutArtistsInput>
  }

  export type GenreUpdateWithWhereUniqueWithoutArtistsInput = {
    where: GenreWhereUniqueInput
    data: XOR<GenreUpdateWithoutArtistsInput, GenreUncheckedUpdateWithoutArtistsInput>
  }

  export type GenreUpdateManyWithWhereWithoutArtistsInput = {
    where: GenreScalarWhereInput
    data: XOR<GenreUpdateManyMutationInput, GenreUncheckedUpdateManyWithoutArtistsInput>
  }

  export type GenreScalarWhereInput = {
    AND?: GenreScalarWhereInput | GenreScalarWhereInput[]
    OR?: GenreScalarWhereInput[]
    NOT?: GenreScalarWhereInput | GenreScalarWhereInput[]
    name?: StringFilter<"Genre"> | string
  }

  export type TrackCreateWithoutAlbumInput = {
    id: string
    name: string
    duration: number
    url: string
    image?: string | null
    artists?: ArtistCreateNestedManyWithoutTracksInput
    TrackPlay?: TrackPlayCreateNestedManyWithoutTrackInput
  }

  export type TrackUncheckedCreateWithoutAlbumInput = {
    id: string
    name: string
    duration: number
    url: string
    image?: string | null
    artists?: ArtistUncheckedCreateNestedManyWithoutTracksInput
    TrackPlay?: TrackPlayUncheckedCreateNestedManyWithoutTrackInput
  }

  export type TrackCreateOrConnectWithoutAlbumInput = {
    where: TrackWhereUniqueInput
    create: XOR<TrackCreateWithoutAlbumInput, TrackUncheckedCreateWithoutAlbumInput>
  }

  export type TrackCreateManyAlbumInputEnvelope = {
    data: TrackCreateManyAlbumInput | TrackCreateManyAlbumInput[]
    skipDuplicates?: boolean
  }

  export type TrackUpsertWithWhereUniqueWithoutAlbumInput = {
    where: TrackWhereUniqueInput
    update: XOR<TrackUpdateWithoutAlbumInput, TrackUncheckedUpdateWithoutAlbumInput>
    create: XOR<TrackCreateWithoutAlbumInput, TrackUncheckedCreateWithoutAlbumInput>
  }

  export type TrackUpdateWithWhereUniqueWithoutAlbumInput = {
    where: TrackWhereUniqueInput
    data: XOR<TrackUpdateWithoutAlbumInput, TrackUncheckedUpdateWithoutAlbumInput>
  }

  export type TrackUpdateManyWithWhereWithoutAlbumInput = {
    where: TrackScalarWhereInput
    data: XOR<TrackUpdateManyMutationInput, TrackUncheckedUpdateManyWithoutAlbumInput>
  }

  export type ArtistCreateWithoutGenresInput = {
    id: string
    name: string
    url: string
    image?: string | null
    tracks?: TrackCreateNestedManyWithoutArtistsInput
  }

  export type ArtistUncheckedCreateWithoutGenresInput = {
    id: string
    name: string
    url: string
    image?: string | null
    tracks?: TrackUncheckedCreateNestedManyWithoutArtistsInput
  }

  export type ArtistCreateOrConnectWithoutGenresInput = {
    where: ArtistWhereUniqueInput
    create: XOR<ArtistCreateWithoutGenresInput, ArtistUncheckedCreateWithoutGenresInput>
  }

  export type ArtistUpsertWithWhereUniqueWithoutGenresInput = {
    where: ArtistWhereUniqueInput
    update: XOR<ArtistUpdateWithoutGenresInput, ArtistUncheckedUpdateWithoutGenresInput>
    create: XOR<ArtistCreateWithoutGenresInput, ArtistUncheckedCreateWithoutGenresInput>
  }

  export type ArtistUpdateWithWhereUniqueWithoutGenresInput = {
    where: ArtistWhereUniqueInput
    data: XOR<ArtistUpdateWithoutGenresInput, ArtistUncheckedUpdateWithoutGenresInput>
  }

  export type ArtistUpdateManyWithWhereWithoutGenresInput = {
    where: ArtistScalarWhereInput
    data: XOR<ArtistUpdateManyMutationInput, ArtistUncheckedUpdateManyWithoutGenresInput>
  }

  export type TrackPlayCreateManyTrackInput = {
    id: string
    playedAt: Date | string
    userId: string
  }

  export type ArtistUpdateWithoutTracksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    genres?: GenreUpdateManyWithoutArtistsNestedInput
  }

  export type ArtistUncheckedUpdateWithoutTracksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    genres?: GenreUncheckedUpdateManyWithoutArtistsNestedInput
  }

  export type ArtistUncheckedUpdateManyWithoutTracksInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type TrackPlayUpdateWithoutTrackInput = {
    id?: StringFieldUpdateOperationsInput | string
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type TrackPlayUncheckedUpdateWithoutTrackInput = {
    id?: StringFieldUpdateOperationsInput | string
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type TrackPlayUncheckedUpdateManyWithoutTrackInput = {
    id?: StringFieldUpdateOperationsInput | string
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type TrackUpdateWithoutArtistsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    duration?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    album?: AlbumUpdateOneRequiredWithoutTracksNestedInput
    TrackPlay?: TrackPlayUpdateManyWithoutTrackNestedInput
  }

  export type TrackUncheckedUpdateWithoutArtistsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    duration?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    albumId?: StringFieldUpdateOperationsInput | string
    TrackPlay?: TrackPlayUncheckedUpdateManyWithoutTrackNestedInput
  }

  export type TrackUncheckedUpdateManyWithoutArtistsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    duration?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    albumId?: StringFieldUpdateOperationsInput | string
  }

  export type GenreUpdateWithoutArtistsInput = {
    name?: StringFieldUpdateOperationsInput | string
  }

  export type GenreUncheckedUpdateWithoutArtistsInput = {
    name?: StringFieldUpdateOperationsInput | string
  }

  export type GenreUncheckedUpdateManyWithoutArtistsInput = {
    name?: StringFieldUpdateOperationsInput | string
  }

  export type TrackCreateManyAlbumInput = {
    id: string
    name: string
    duration: number
    url: string
    image?: string | null
  }

  export type TrackUpdateWithoutAlbumInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    duration?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    artists?: ArtistUpdateManyWithoutTracksNestedInput
    TrackPlay?: TrackPlayUpdateManyWithoutTrackNestedInput
  }

  export type TrackUncheckedUpdateWithoutAlbumInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    duration?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    artists?: ArtistUncheckedUpdateManyWithoutTracksNestedInput
    TrackPlay?: TrackPlayUncheckedUpdateManyWithoutTrackNestedInput
  }

  export type TrackUncheckedUpdateManyWithoutAlbumInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    duration?: IntFieldUpdateOperationsInput | number
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ArtistUpdateWithoutGenresInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    tracks?: TrackUpdateManyWithoutArtistsNestedInput
  }

  export type ArtistUncheckedUpdateWithoutGenresInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
    tracks?: TrackUncheckedUpdateManyWithoutArtistsNestedInput
  }

  export type ArtistUncheckedUpdateManyWithoutGenresInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    image?: NullableStringFieldUpdateOperationsInput | string | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}