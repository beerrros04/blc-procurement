import { createHmac, timingSafeEqual } from 'node:crypto';
import type { UserRole } from '../src/types/document';

// shortcut: local HMAC-SHA256 JWT and seeded accounts, upgrade to Microsoft Entra ID OIDC when IT tenant credentials are provisioned
const JWT_SECRET = process.env.BLC_JWT_SECRET || 'blc-local-dev-hmac-secret-2026';
const TOKEN_TTL_SECONDS = 8 * 60 * 60; // 8 hours

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  branch: string;
  branchScope: string; // '*' for all branches or specific branch name
}

export interface JwtClaims extends AuthUser {
  iat: number;
  exp: number;
}

export const SEEDED_USERS: Record<string, AuthUser & { password: string }> = {
  'admin@blc.co.id': {
    id: 'usr-admin-01', email: 'admin@blc.co.id', fullName: 'Admin Lokal', role: 'ADMIN', branch: 'Bekasi', branchScope: '*', password: 'blc2026',
  },
  'pemohon@blc.co.id': {
    id: 'usr-pemohon-01',
    email: 'pemohon@blc.co.id',
    fullName: 'Dewi Lestari (Staff Pemohon)',
    role: 'PEMOHON',
    branch: 'Bekasi',
    branchScope: 'Bekasi',
    password: 'blc2026',
  },
  'atasan@blc.co.id': {
    id: 'usr-atasan-01',
    email: 'atasan@blc.co.id',
    fullName: 'Pak Hendra (Atasan Langsung)',
    role: 'ATASAN',
    branch: 'Surabaya',
    branchScope: '*',
    password: 'blc2026',
  },
  'ayu@blc.co.id': {
    id: 'usr-ayu-01',
    email: 'ayu@blc.co.id',
    fullName: 'Bu Ayu (Verifikator Keuangan)',
    role: 'AYU',
    branch: 'Bekasi',
    branchScope: '*',
    password: 'blc2026',
  },
  'hery@blc.co.id': {
    id: 'usr-bod-hery',
    email: 'hery@blc.co.id',
    fullName: 'Pak Hery (Direksi BoD)',
    role: 'BOD_HERY',
    branch: 'Bekasi',
    branchScope: '*',
    password: 'blc2026',
  },
  'hashimoto@blc.co.id': {
    id: 'usr-bod-hashimoto',
    email: 'hashimoto@blc.co.id',
    fullName: 'Mr. Hashimoto (Direksi BoD)',
    role: 'BOD_HASHIMOTO',
    branch: 'Bekasi',
    branchScope: '*',
    password: 'blc2026',
  },
  'keuangan@blc.co.id': {
    id: 'usr-keuangan-01',
    email: 'keuangan@blc.co.id',
    fullName: 'Tim Keuangan & Treasury',
    role: 'KEUANGAN',
    branch: 'Bekasi',
    branchScope: '*',
    password: 'blc2026',
  },
};

const ROLE_TO_EMAIL: Record<UserRole, string> = {
  ADMIN: 'admin@blc.co.id',
  PEMOHON: 'pemohon@blc.co.id',
  ATASAN: 'atasan@blc.co.id',
  AYU: 'ayu@blc.co.id',
  BOD_HERY: 'hery@blc.co.id',
  BOD_HASHIMOTO: 'hashimoto@blc.co.id',
  KEUANGAN: 'keuangan@blc.co.id',
};

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function signJwt(user: AuthUser, ttlSeconds: number = TOKEN_TTL_SECONDS): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      ...user,
      iat: nowSec,
      exp: nowSec + ttlSeconds,
    } satisfies JwtClaims)
  );
  const signingInput = `${header}.${payload}`;
  const signature = createHmac('sha256', JWT_SECRET).update(signingInput).digest('base64url');
  return `${signingInput}.${signature}`;
}

export function verifyJwt(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const signingInput = `${header}.${payload}`;
  const expectedSig = createHmac('sha256', JWT_SECRET).update(signingInput).digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const claims = JSON.parse(base64UrlDecode(payload)) as JwtClaims;
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== 'number' || claims.exp < nowSec) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

export function authenticateCredentials(input: {
  email?: string;
  password?: string;
  role?: UserRole;
}): { user: AuthUser; token: string } | null {
  const resolvedEmail =
    input.email?.trim().toLowerCase() || (input.role ? ROLE_TO_EMAIL[input.role] : undefined);
  if (!resolvedEmail) return null;

  const account = SEEDED_USERS[resolvedEmail];
  if (!account) return null;

  if (input.password !== account.password) {
    return null;
  }

  const { password: _ignored, ...user } = account;
  return {
    user,
    token: signJwt(user),
  };
}
