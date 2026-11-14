// DEMO MODE in-memory store + a tiny Supabase-compatible query builder.
//
// Supports exactly the subset the app uses:
//   from(t).select("a, b, rel(c, d)", { count, head }).eq/neq/in/gte/gt/lte/lt/is
//     .order(col, { ascending }).limit(n).single()/maybeSingle()
//   from(t).insert(row | rows) / .update(patch) / .delete()  (+ filters)
// Embedded relations resolve one level deep through *_id foreign keys
// (to-one, e.g. visit_reports → farmers) or back-references (to-many,
// e.g. farmers → health_cases). Data lives in memory and resets on reload.

import { buildSeed, ME, type Row } from "./seed";

const LATENCY_MS = 150;
const sleep = () => new Promise((r) => setTimeout(r, LATENCY_MS));

const db: Record<string, Row[]> = buildSeed();

/** Foreign-key column used to link to each table. */
const FK: Record<string, string> = {
  farmers: "farmer_id",
  feed_products: "product_id",
};

/** Default values filled on insert. */
const INSERT_DEFAULTS: Record<string, () => Row> = {
  feed_orders: () => ({ order_no: `ORD-${Math.floor(10000 + Math.random() * 89999)}`, placed_at: nowIso() }),
  visit_reports: () => ({ submitted_at: nowIso(), payload: {}, reviewed_at: null, reviewed_by: null }),
  knowledge_articles: () => ({ updated_at: nowIso(), is_published: true }),
  support_tickets: () => ({ portal: "field", assignee_id: null, assigned_to: null, updated_at: nowIso() }),
  farmers: () => ({ updated_at: nowIso(), avatar_url: null }),
  health_cases: () => ({ updated_at: nowIso() }),
  nutrition_plans: () => ({ updated_at: nowIso() }),
};

function nowIso() {
  return new Date().toISOString();
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `mock-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }
}

/* ------------------------------ current user ------------------------------ */

let boundUserId: string = ME;

/**
 * Re-point every seeded "owned by me" row at the signed-in user's id, so
 * filters like `.eq("agent_id", session.user.id)` return the demo data.
 */
export function bindCurrentUser(userId: string | null | undefined) {
  if (!userId || userId === boundUserId) return;
  for (const rows of Object.values(db)) {
    for (const row of rows) {
      for (const k of Object.keys(row)) if (row[k] === boundUserId) row[k] = userId;
    }
  }
  boundUserId = userId;
}

/* ------------------------------ select parsing ----------------------------- */

type Field = { name: string; sub?: Field[] };

function parseSelect(spec: string): Field[] {
  const out: Field[] = [];
  let depth = 0;
  let start = 0;
  const push = (part: string) => {
    const p = part.trim();
    if (!p) return;
    const open = p.indexOf("(");
    if (open === -1) out.push({ name: p });
    else out.push({ name: p.slice(0, open).trim(), sub: parseSelect(p.slice(open + 1, p.lastIndexOf(")"))) });
  };
  for (let i = 0; i < spec.length; i++) {
    const c = spec[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) {
      push(spec.slice(start, i));
      start = i + 1;
    }
  }
  push(spec.slice(start));
  return out;
}

function project(table: string, row: Row, fields: Field[]): Row {
  if (fields.length === 1 && fields[0]!.name === "*" && !fields[0]!.sub) return { ...row };
  const out: Row = {};
  for (const f of fields) {
    if (f.name === "*") {
      Object.assign(out, row);
    } else if (!f.sub) {
      out[f.name] = row[f.name] ?? null;
    } else {
      const rel = f.name;
      const relRows = db[rel] ?? [];
      const toOneKey = FK[rel];
      if (toOneKey && toOneKey in row) {
        const target = relRows.find((r) => r.id === row[toOneKey]);
        out[rel] = target ? project(rel, target, f.sub) : null;
      } else {
        const backKey = FK[table] ?? `${table.replace(/s$/, "")}_id`;
        out[rel] = relRows.filter((r) => r[backKey] === row.id).map((r) => project(rel, r, f.sub!));
      }
    }
  }
  return out;
}

/* ------------------------------- query builder ----------------------------- */

// Rows typed as both list and record so list (.map) and .single() callers both type-check.
type Data = Row[] & Row;
type Result = { data: Data | null; error: null | { message: string }; count: number | null };
type Op = "select" | "insert" | "update" | "delete";

class MockQuery implements PromiseLike<Result> {
  private op: Op = "select";
  private fields: Field[] = [{ name: "*" }];
  private filters: ((r: Row) => boolean)[] = [];
  private sorts: { col: string; asc: boolean }[] = [];
  private max: number | null = null;
  private countMode = false;
  private head = false;
  private singleMode: "single" | "maybe" | null = null;
  private payload: Row[] = [];
  private patch: Row = {};
  private returning = false;

  constructor(private table: string) {
    if (!db[table]) db[table] = [];
  }

  select(spec = "*", opts?: { count?: string; head?: boolean }) {
    if (this.op === "select") {
      this.fields = parseSelect(spec);
      this.countMode = !!opts?.count;
      this.head = !!opts?.head;
    } else {
      this.returning = true;
      this.fields = parseSelect(spec);
    }
    return this;
  }
  insert(rows: Row | Row[]) {
    this.op = "insert";
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }
  update(patch: Row) {
    this.op = "update";
    this.patch = patch;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }

  eq(col: string, v: unknown) {
    this.filters.push((r) => r[col] === v);
    return this;
  }
  neq(col: string, v: unknown) {
    this.filters.push((r) => r[col] !== v);
    return this;
  }
  in(col: string, vs: unknown[]) {
    this.filters.push((r) => vs.includes(r[col]));
    return this;
  }
  is(col: string, v: null | boolean) {
    this.filters.push((r) => (v === null ? r[col] == null : r[col] === v));
    return this;
  }
  gte(col: string, v: string | number) {
    this.filters.push((r) => r[col] != null && r[col] >= v);
    return this;
  }
  gt(col: string, v: string | number) {
    this.filters.push((r) => r[col] != null && r[col] > v);
    return this;
  }
  lte(col: string, v: string | number) {
    this.filters.push((r) => r[col] != null && r[col] <= v);
    return this;
  }
  lt(col: string, v: string | number) {
    this.filters.push((r) => r[col] != null && r[col] < v);
    return this;
  }
  ilike(col: string, pattern: string) {
    const re = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*")}$`, "i");
    this.filters.push((r) => typeof r[col] === "string" && re.test(r[col]));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.sorts.push({ col, asc: opts?.ascending ?? true });
    return this;
  }
  limit(n: number) {
    this.max = n;
    return this;
  }
  single() {
    this.singleMode = "single";
    return this;
  }
  maybeSingle() {
    this.singleMode = "maybe";
    return this;
  }

  private matching(): Row[] {
    return db[this.table]!.filter((r) => this.filters.every((f) => f(r)));
  }

  private run(): Result {
    const rows = db[this.table]!;
    let affected: Row[];

    switch (this.op) {
      case "insert": {
        const defaults = INSERT_DEFAULTS[this.table]?.() ?? {};
        affected = this.payload.map((p) => ({ id: newId(), created_at: nowIso(), ...defaults, ...p }));
        rows.unshift(...affected);
        if (!this.returning) return { data: null, error: null, count: null };
        break;
      }
      case "update": {
        affected = this.matching();
        for (const r of affected) Object.assign(r, this.patch, "updated_at" in r ? { updated_at: nowIso() } : {});
        if (!this.returning) return { data: null, error: null, count: null };
        break;
      }
      case "delete": {
        affected = this.matching();
        db[this.table] = rows.filter((r) => !affected.includes(r));
        if (!this.returning) return { data: null, error: null, count: null };
        break;
      }
      default: {
        affected = this.matching();
        const total = affected.length;
        if (this.head) return { data: null, error: null, count: total };
        affected = [...affected].sort((a, b) => {
          for (const s of this.sorts) {
            const av = a[s.col];
            const bv = b[s.col];
            if (av === bv) continue;
            if (av == null) return 1;
            if (bv == null) return -1;
            return (av < bv ? -1 : 1) * (s.asc ? 1 : -1);
          }
          return 0;
        });
        if (this.max != null) affected = affected.slice(0, this.max);
        const data = affected.map((r) => project(this.table, r, this.fields));
        return this.finish(data, this.countMode ? total : null);
      }
    }
    return this.finish(affected.map((r) => project(this.table, r, this.fields)), null);
  }

  private finish(data: Row[], count: number | null): Result {
    if (!this.singleMode) return { data: data as Data, error: null, count };
    if (data.length === 1 || (this.singleMode === "maybe" && data.length === 0))
      return { data: (data[0] ?? null) as Data | null, error: null, count };
    return { data: null, error: { message: data.length ? "Multiple rows returned" : "Not found" }, count };
  }

  then<A = Result, B = never>(
    onfulfilled?: ((value: Result) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return sleep()
      .then(() => this.run())
      .then(onfulfilled, onrejected);
  }
}

/** Drop-in stand-in for the Supabase client's `from()` used across the app. */
export const mockDb = {
  from: (table: string) => new MockQuery(table),
};
