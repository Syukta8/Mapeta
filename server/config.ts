import path from 'path';

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  dbPath: string;
  allowedOrigins: string[];
  namedTunnel?: string;
  trustProxy: boolean | number;
}

export const config: ServerConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.MAPETA_DB_PATH || path.join(process.cwd(), 'mapeta.sqlite'),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  namedTunnel: process.env.NAMED_TUNNEL || undefined,
  trustProxy: process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 1,
};
