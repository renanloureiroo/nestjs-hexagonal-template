import { type LogLevel } from '@nestjs/common';

/**
 * De onde vem a identidade de quem chama a API.
 *
 * - `gateway`: um gateway na frente (Kong, Traefik, API Gateway) valida o token e grava o sujeito
 *   num header que ele sempre sobrescreve. A API confia no header e não toca no token.
 * - `jwt`: sem gateway, a API valida o JWT do header `Authorization` pelas chaves públicas (JWKS)
 *   do provedor de identidade (Clerk, Auth0, Cognito, Keycloak).
 */
export type IdentityConfig =
  | { readonly mode: 'gateway'; readonly subjectHeader: string }
  | {
      readonly mode: 'jwt';
      readonly jwksUrl: string;
      readonly issuer: string;
      /** `aud` exigido no token; ausente quando o provedor não emite audiência (Clerk). */
      readonly audience: string | null;
      /** Origens aceitas no claim `azp`; vazio aceita qualquer uma. */
      readonly authorizedParties: readonly string[];
      readonly clockToleranceSeconds: number;
    };

export interface Environment {
  readonly port: number;
  readonly databaseUrl: string;
  readonly databasePoolSize: number;
  /** Schema do serviço no Postgres, para dividir um banco entre serviços; null usa o `public`. */
  readonly databaseSchema: string | null;
  readonly migrationsFolder: string;
  readonly apiDocsEnabled: boolean;
  readonly logLevels: LogLevel[];
  /** Versão da imagem em execução (`APP_VERSION`), informada pelo health; `dev` fora do CI. */
  readonly appVersion: string;
  readonly identity: IdentityConfig;
}

const LOG_LEVELS: LogLevel[] = ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  return {
    port: Number(source.PORT ?? 8080),
    databaseUrl: required(source, 'DATABASE_URL'),
    databasePoolSize: Number(source.DATABASE_POOL_SIZE ?? 10),
    databaseSchema: optional(source, 'DATABASE_SCHEMA'),
    migrationsFolder: source.DATABASE_MIGRATIONS_FOLDER ?? 'drizzle',
    apiDocsEnabled: source.API_DOCS_ENABLED === 'true',
    logLevels: logLevelsFrom(source.LOG_LEVEL ?? 'log'),
    appVersion: optional(source, 'APP_VERSION') ?? 'dev',
    identity: identityFrom(source),
  };
}

function identityFrom(source: NodeJS.ProcessEnv): IdentityConfig {
  const mode = optional(source, 'IDENTITY_MODE') ?? 'gateway';
  if (mode === 'gateway') {
    return {
      mode,
      subjectHeader: (
        optional(source, 'IDENTITY_SUBJECT_HEADER') ?? 'x-auth-subject'
      ).toLowerCase(),
    };
  }
  if (mode === 'jwt') {
    return {
      mode,
      jwksUrl: required(source, 'JWT_JWKS_URL'),
      issuer: required(source, 'JWT_ISSUER'),
      audience: optional(source, 'JWT_AUDIENCE'),
      authorizedParties: listFrom(source.JWT_AUTHORIZED_PARTIES),
      clockToleranceSeconds: Number(source.JWT_CLOCK_TOLERANCE_SECONDS ?? 5),
    };
  }
  throw new Error(`IDENTITY_MODE inválido: ${mode} (use gateway ou jwt)`);
}

function required(source: NodeJS.ProcessEnv, name: string): string {
  const value = optional(source, name);
  if (value === null) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

function optional(source: NodeJS.ProcessEnv, name: string): string | null {
  const value = source[name]?.trim();
  return value === undefined || value === '' ? null : value;
}

function listFrom(value: string | undefined): readonly string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

/** LOG_LEVEL=info segue o vocabulário usual; o Nest chama esse nível de "log". */
function logLevelsFrom(level: string): LogLevel[] {
  const normalized = (level === 'info' ? 'log' : level) as LogLevel;
  const index = LOG_LEVELS.indexOf(normalized);
  return LOG_LEVELS.slice(0, index === -1 ? LOG_LEVELS.indexOf('log') + 1 : index + 1);
}
