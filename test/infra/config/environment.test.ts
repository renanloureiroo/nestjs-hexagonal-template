import { loadEnvironment } from '../../../src/infra/config/environment.js';

const BASE = { DATABASE_URL: 'postgres://u:p@localhost:5432/db' };

describe('loadEnvironment', () => {
  it('usa identidade pelo gateway por padrão, com o header x-auth-subject', () => {
    const environment = loadEnvironment(BASE);

    expect(environment.identity).toEqual({ mode: 'gateway', subjectHeader: 'x-auth-subject' });
    expect(environment.appVersion).toBe('dev');
    expect(environment.databaseSchema).toBeNull();
  });

  it('lê a configuração de JWT por JWKS', () => {
    const environment = loadEnvironment({
      ...BASE,
      IDENTITY_MODE: 'jwt',
      JWT_JWKS_URL: 'https://clerk.example.dev/.well-known/jwks.json',
      JWT_ISSUER: 'https://clerk.example.dev',
      JWT_AUTHORIZED_PARTIES: 'https://app.example.dev, myapp://',
    });

    expect(environment.identity).toEqual({
      mode: 'jwt',
      jwksUrl: 'https://clerk.example.dev/.well-known/jwks.json',
      issuer: 'https://clerk.example.dev',
      audience: null,
      authorizedParties: ['https://app.example.dev', 'myapp://'],
      clockToleranceSeconds: 5,
    });
  });

  it('exige JWKS e emissor no modo jwt', () => {
    expect(() => loadEnvironment({ ...BASE, IDENTITY_MODE: 'jwt' })).toThrow(/JWT_JWKS_URL/);
  });

  it('recusa modo de identidade desconhecido', () => {
    expect(() => loadEnvironment({ ...BASE, IDENTITY_MODE: 'cookie' })).toThrow(/IDENTITY_MODE/);
  });

  it('lê versão e schema do banco', () => {
    const environment = loadEnvironment({
      ...BASE,
      APP_VERSION: 'sha-abc123',
      DATABASE_SCHEMA: 'notes',
    });

    expect(environment.appVersion).toBe('sha-abc123');
    expect(environment.databaseSchema).toBe('notes');
  });
});
