import { createAppServer } from './app';
import { ProcurementRepository } from './repository';
import { join } from 'node:path';
import { OrganizationRepository } from './organization';

const port = Number(process.env.PORT) || 3002;
const host = process.env.HOST || '0.0.0.0';

const server = createAppServer({ repository: new ProcurementRepository({ sqlitePath: join(process.cwd(), '.data', 'blc-local.sqlite') }), organization: process.env.BLC_ORGANIZATION_DB ? new OrganizationRepository(process.env.BLC_ORGANIZATION_DB) : undefined });

server.listen(port, host, () => {
  console.log(`[BLC Backend API] Server aktif di http://${host}:${port}`);
  console.log(`[BLC Backend API] REST API v1 siap melayani di http://${host}:${port}/api/v1`);
});
