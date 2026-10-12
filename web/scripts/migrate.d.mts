// Types for scripts/migrate.mjs, so the tests can import it under strict TypeScript.
export interface MigrationFile { file: string; number: string; name: string }
export interface AppliedMigration { version?: string; name?: string }
export function migrationFiles(names: string[]): MigrationFile[];
export function planMigrations(files: MigrationFile[], applied: AppliedMigration[]): MigrationFile[];
export function projectRef(url: string | undefined): string;
export function migrate(opts: {
  token: string | undefined;
  url: string | undefined;
  dir: string;
  dryRun?: boolean;
  fetchImpl?: typeof fetch;
  log?: (line: string) => void;
}): Promise<string[]>;
