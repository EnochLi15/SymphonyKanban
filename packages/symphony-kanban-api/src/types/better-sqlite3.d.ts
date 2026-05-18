declare module "better-sqlite3" {
  type QueryValue = string | number | bigint | Buffer | null;

  interface Statement {
    run(...params: QueryValue[]): unknown;
    get(...params: QueryValue[]): unknown;
    all(...params: QueryValue[]): unknown[];
  }

  class Database {
    constructor(path: string);
    pragma(source: string): unknown;
    exec(source: string): unknown;
    prepare(source: string): Statement;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
  }

  export default Database;
}
