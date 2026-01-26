import { PrismaMariaDb } from "@prisma/adapter-mariadb";

type MariaDbAdapterConfig = ConstructorParameters<typeof PrismaMariaDb>[0];

const DEFAULT_MARIADB_PORT = 3306;

const decode = (value: string) => (value ? decodeURIComponent(value) : "");

export const parseMariaDbUrl = (databaseUrl: string): MariaDbAdapterConfig => {
  const parsed = new URL(databaseUrl);
  const database = parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;

  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : DEFAULT_MARIADB_PORT,
    user: decode(parsed.username),
    password: decode(parsed.password),
    database: decode(database),
  };
};

export const createMariaDbAdapter = (databaseUrl: string) => new PrismaMariaDb(parseMariaDbUrl(databaseUrl));
