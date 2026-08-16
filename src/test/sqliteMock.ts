import { vi } from "vitest";

export interface ExecCall {
  sql: string;
  bind?: unknown[];
  rowMode?: string;
  returnValue?: string;
  callback?: (row: unknown) => void;
}

/** Matches an exec call by a fragment of its SQL. */
type Responder = { match: RegExp; rows: unknown[] };

/**
 * Minimal stand-in for @sqlite.org/sqlite-wasm.
 *
 * Implements only what SotaDatabase actually touches, and dispatches query
 * results by matching the SQL, so a test can describe the database as a set of
 * canned answers instead of running a real engine.
 */
export function createSqliteMock(
  options: { responders?: Responder[]; deserializeRc?: number } = {},
) {
  const execCalls: ExecCall[] = [];
  const responders = options.responders ?? [];

  const db = {
    pointer: 1,
    selectValue: vi.fn((sql: string) => {
      const responder = responders.find((r) => r.match.test(sql));
      return (responder?.rows[0] as number | undefined) ?? 0;
    }),
    exec: vi.fn((call: ExecCall) => {
      execCalls.push(call);
      const responder = responders.find((r) => r.match.test(call.sql));
      const rows = responder?.rows ?? [];
      if (call.callback) {
        for (const row of rows) call.callback(row);
      }
      if (call.returnValue === "resultRows") return rows;
      return undefined;
    }),
    close: vi.fn(),
  };

  const sqlite3 = {
    version: { libVersion: "3.53.0" },
    // Called with `new`, so this must be a constructible function, not an arrow.
    oo1: {
      DB: vi.fn(function DB() {
        return db;
      }),
    },
    wasm: { allocFromTypedArray: vi.fn(() => 4096) },
    capi: {
      SQLITE_DESERIALIZE_FREEONCLOSE: 1,
      SQLITE_DESERIALIZE_RESIZEABLE: 2,
      sqlite3_deserialize: vi.fn(() => options.deserializeRc ?? 0),
    },
  };

  return { sqlite3, db, execCalls };
}

/** Response whose body streams in chunks, exercising the progress path. */
export function streamingDbResponse(bytes = 32): Response {
  const chunk = new Uint8Array(bytes);
  return {
    ok: true,
    statusText: "OK",
    headers: { get: () => String(bytes) },
    body: {
      getReader: () => {
        let sent = false;
        return {
          read: async () => {
            if (sent) return { done: true, value: undefined };
            sent = true;
            return { done: false, value: chunk };
          },
        };
      },
    },
  } as unknown as Response;
}

/** Response with no content-length, exercising the arrayBuffer path. */
export function bufferedDbResponse(bytes = 16): Response {
  return {
    ok: true,
    statusText: "OK",
    headers: { get: () => null },
    arrayBuffer: async () => new ArrayBuffer(bytes),
  } as unknown as Response;
}
