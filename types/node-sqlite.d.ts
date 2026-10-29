/* Tipos mínimos de node:sqlite (Node 24). @types/node ^20 todavía no los trae;
   se pueden borrar al actualizar @types/node a la versión 24. */
declare module "node:sqlite" {
  type Value = string | number | bigint | null | Uint8Array;
  type Params = Record<string, Value> | Value;

  export class StatementSync {
    run(...params: Params[]): { changes: number | bigint; lastInsertRowid: number | bigint };
    get(...params: Params[]): unknown;
    all(...params: Params[]): unknown[];
  }

  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
