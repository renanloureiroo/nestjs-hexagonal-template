import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { getContainerRuntimeClient } from 'testcontainers';
import { type TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    dockerAvailable: boolean;
    databaseUrl: string;
  }
}

// Um único PostgreSQL por execução, compartilhado por todos os arquivos E2E.
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  if (!(await dockerAvailable())) {
    console.warn('Docker indisponível: testes E2E serão ignorados.');
    project.provide('dockerAvailable', false);
    project.provide('databaseUrl', '');
    return async () => {};
  }

  const postgres = await new PostgreSqlContainer('postgres:latest').start();
  project.provide('dockerAvailable', true);
  project.provide('databaseUrl', postgres.getConnectionUri());

  return async () => {
    await postgres.stop();
  };
}

async function dockerAvailable(): Promise<boolean> {
  try {
    await getContainerRuntimeClient();
    return true;
  } catch {
    return false;
  }
}
