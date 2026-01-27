import { PrismaMariaDb } from "@prisma/adapter-mariadb";

type MariaDbAdapterConfig = ConstructorParameters<typeof PrismaMariaDb>[0];

const DEFAULT_MARIADB_PORT = 3306;

export const parseMariaDbUrl = (databaseUrl: string): MariaDbAdapterConfig => {
  const parsed = new URL(databaseUrl);
  const database = parsed.pathname.startsWith("/")
    ? parsed.pathname.slice(1)
    : parsed.pathname;

  const config: MariaDbAdapterConfig = {
    host: parsed.hostname || undefined,
    port: parsed.port ? Number(parsed.port) : DEFAULT_MARIADB_PORT,
    user: parsed.username || undefined,
    password: parsed.password || undefined,
    database: database || undefined,
    connectionLimit: 5,
  };

  return config;
};

export const createMariaDbAdapter = (databaseUrl: string) => new PrismaMariaDb(parseMariaDbUrl(databaseUrl));
