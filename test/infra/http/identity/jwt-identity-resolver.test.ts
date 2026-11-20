import { type Request } from 'express';
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  type JWTPayload,
  type JWTVerifyGetKey,
  type CryptoKey,
  SignJWT,
} from 'jose';
import {
  type JwtIdentityOptions,
  JwtIdentityResolver,
} from '../../../../src/infra/http/identity/jwt-identity-resolver.js';

const ISSUER = 'https://clerk.example.dev';
const KEY_ID = 'test-key';

interface KeyMaterial {
  readonly privateKey: CryptoKey;
  readonly keys: JWTVerifyGetKey;
}

async function keyMaterial(): Promise<KeyMaterial> {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: KEY_ID, alg: 'RS256' };
  return { privateKey, keys: createLocalJWKSet({ keys: [jwk] }) };
}

function requestWithToken(token: string): Request {
  return { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
}

function sign(
  privateKey: CryptoKey,
  payload: JWTPayload,
  expiresIn: string | number = '5m',
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: KEY_ID })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey);
}

const OPTIONS: JwtIdentityOptions = {
  issuer: ISSUER,
  audience: null,
  authorizedParties: [],
  clockToleranceSeconds: 0,
};

describe('JwtIdentityResolver', () => {
  let material: KeyMaterial;

  beforeAll(async () => {
    material = await keyMaterial();
  });

  it('identifica pelo sub de um token válido e guarda os claims', async () => {
    const sut = new JwtIdentityResolver(material.keys, OPTIONS);
    const token = await sign(material.privateKey, { sub: 'user_123', iss: ISSUER, sid: 'sess_1' });

    const identity = await sut.resolve(requestWithToken(token));

    expect(identity?.subject).toBe('user_123');
    expect(identity?.claims).toMatchObject({ sid: 'sess_1', iss: ISSUER });
  });

  it('não identifica sem o header Authorization', async () => {
    const sut = new JwtIdentityResolver(material.keys, OPTIONS);

    expect(await sut.resolve({ headers: {} } as unknown as Request)).toBeNull();
  });

  it('não identifica token de outro emissor', async () => {
    const sut = new JwtIdentityResolver(material.keys, OPTIONS);
    const token = await sign(material.privateKey, { sub: 'user_123', iss: 'https://outro.dev' });

    expect(await sut.resolve(requestWithToken(token))).toBeNull();
  });

  it('não identifica token expirado', async () => {
    const sut = new JwtIdentityResolver(material.keys, OPTIONS);
    const expiredAt = Math.floor(Date.now() / 1000) - 60;
    const token = await sign(material.privateKey, { sub: 'user_123', iss: ISSUER }, expiredAt);

    expect(await sut.resolve(requestWithToken(token))).toBeNull();
  });

  it('não identifica token assinado por outra chave', async () => {
    const sut = new JwtIdentityResolver(material.keys, OPTIONS);
    const other = await keyMaterial();
    const token = await sign(other.privateKey, { sub: 'user_123', iss: ISSUER });

    expect(await sut.resolve(requestWithToken(token))).toBeNull();
  });

  it('exige o azp entre as origens configuradas', async () => {
    const sut = new JwtIdentityResolver(material.keys, {
      ...OPTIONS,
      authorizedParties: ['https://app.example.dev'],
    });
    const allowed = await sign(material.privateKey, {
      sub: 'user_123',
      iss: ISSUER,
      azp: 'https://app.example.dev',
    });
    const other = await sign(material.privateKey, {
      sub: 'user_123',
      iss: ISSUER,
      azp: 'https://malicioso.dev',
    });

    expect((await sut.resolve(requestWithToken(allowed)))?.subject).toBe('user_123');
    expect(await sut.resolve(requestWithToken(other))).toBeNull();
  });

  it('exige a audiência quando configurada', async () => {
    const sut = new JwtIdentityResolver(material.keys, { ...OPTIONS, audience: 'api' });
    const withAudience = await sign(material.privateKey, { sub: 'u', iss: ISSUER, aud: 'api' });
    const without = await sign(material.privateKey, { sub: 'u', iss: ISSUER });

    expect((await sut.resolve(requestWithToken(withAudience)))?.subject).toBe('u');
    expect(await sut.resolve(requestWithToken(without))).toBeNull();
  });

  it('não identifica token sem sub', async () => {
    const sut = new JwtIdentityResolver(material.keys, OPTIONS);
    const token = await sign(material.privateKey, { iss: ISSUER });

    expect(await sut.resolve(requestWithToken(token))).toBeNull();
  });
});
