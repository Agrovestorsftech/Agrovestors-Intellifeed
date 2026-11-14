// DEMO MODE seed data. Deterministic (seeded PRNG) but with dates relative to
// "now" so today/this-week views always have something to show.
//
// Rows owned by "the signed-in user" use ME, which the store rebinds to the
// real session user id (see bindCurrentUser in ./db.ts).

export const ME = "__current_user__";

export type Row = Record<string, any>;

function prng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSeed(): Record<string, Row[]> {
  const rand = prng(360);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  let n = 0;
  const id = (prefix: string) => {
    n++;
    const hex = (n * 2654435761 >>> 0).toString(16).padStart(8, "0");
    return `${hex}-${prefix.padEnd(4, "0").slice(0, 4)}-4000-8000-${n.toString(16).padStart(12, "0")}`;
  };
  const now = Date.now();
  const ago = (days: number, hours = 0) => new Date(now - days * 86_400_000 - hours * 3_600_000).toISOString();
  const todayAt = (hour: number) => {
    const d = new Date();
    d.setHours(hour, int(0, 3) * 15, 0, 0);
    return d.toISOString();
  };

  const AGENTS = [ME, "agent-0002", "agent-0003"];
  const REGIONS = ["Kaduna", "Oyo", "Ogun", "Plateau", "Kano", "Benue", "Enugu"];
  const SPECIES = ["poultry", "cattle", "goats", "pigs", "fish", "sheep"] as const;
  const FIRST = ["Amina", "Tunde", "Chinedu", "Fatima", "Ibrahim", "Ngozi", "Emeka", "Halima", "Segun", "Aisha", "Musa", "Blessing", "Yusuf", "Kemi", "Obinna", "Zainab", "Bola", "Sani", "Ifeoma", "Danjuma", "Funke", "Garba", "Chioma", "Lawal"];
  const LAST = ["Yusuf", "Adeyemi", "Okafor", "Bello", "Musa", "Eze", "Nwosu", "Abubakar", "Ogunleye", "Lawal", "Danladi", "Okoro"];
  const FARM_SUFFIX = ["Farms", "Poultry", "Ranch", "Agro", "Livestock", "Holdings"];

  /* farmers */
  const farmers: Row[] = FIRST.map((first, i) => {
    const last = LAST[i % LAST.length]!;
    const created = int(1, 200);
    return {
      id: id("farm"),
      name: `${first} ${last}`,
      farm_name: `${last} ${pick(FARM_SUFFIX)}`,
      region: pick(REGIONS),
      phone: `+23480${int(10000000, 99999999)}`,
      livestock_type: SPECIES[i % SPECIES.length],
      primary_livestock_type: SPECIES[i % SPECIES.length],
      status: i % 7 === 6 ? "inactive" : "active",
      avatar_url: null,
      notes: i % 3 === 0 ? "Prefers morning visits." : null,
      assigned_agent_id: i < 10 ? ME : AGENTS[i % AGENTS.length],
      created_at: ago(created < 7 ? created : created),
      updated_at: ago(int(0, 20), int(0, 23)),
    };
  });
  // A few farmers added this week for the platform chart.
  for (let i = 0; i < 5; i++) farmers[i]!.created_at = ago(int(0, 6), int(0, 12));

  /* products + inventory */
  const PRODUCTS = [
    ["Layer Mash 18%", "LM-18", "bag", "poultry"],
    ["Broiler Starter", "BS-22", "bag", "poultry"],
    ["Broiler Finisher", "BF-19", "bag", "poultry"],
    ["Dairy Concentrate", "DC-16", "bag", "cattle"],
    ["Beef Fattener", "BF-14", "bag", "cattle"],
    ["Goat Pellets", "GP-12", "bag", "goats"],
    ["Grower Pig Feed", "PG-16", "bag", "pigs"],
    ["Catfish Floating 4mm", "CF-4", "bag", "fish"],
  ] as const;
  const feed_products: Row[] = PRODUCTS.map(([name, sku, unit, category]) => ({
    id: id("prod"),
    name,
    sku,
    unit,
    category,
    price_per_unit: int(9, 32) * 1000,
    created_at: ago(300),
  }));
  const WAREHOUSES = ["Kaduna Central", "Ibadan Depot"];
  const inventory_items: Row[] = feed_products.flatMap((p, i) =>
    WAREHOUSES.map((warehouse, w) => ({
      id: id("inv"),
      product_id: p.id,
      warehouse,
      quantity: i === 2 && w === 1 ? 0 : i % 3 === 0 && w === 0 ? int(20, 60) : int(150, 1200),
      reorder_level: 100,
      updated_at: ago(int(0, 5)),
    })),
  );

  /* orders */
  const ORDER_STATUS = ["pending", "processing", "out_for_delivery", "delivered", "delivered", "placed"];
  const feed_orders: Row[] = Array.from({ length: 30 }, (_, i) => ({
    id: id("ordr"),
    order_no: `ORD-${(10450 + i).toString()}`,
    farmer_id: pick(farmers).id,
    product_id: pick(feed_products).id,
    agent_id: i % 3 === 0 ? ME : pick(AGENTS),
    quantity: int(5, 80),
    status: i < 4 ? pick(["pending", "processing"]) : pick(ORDER_STATUS),
    placed_at: i < 4 ? ago(0, int(0, 6)) : ago(int(0, 9), int(0, 23)),
  }));

  /* production */
  const production_runs: Row[] = Array.from({ length: 16 }, (_, i) => ({
    id: id("prun"),
    batch_no: `B-${2400 + i}`,
    product_id: pick(feed_products).id,
    quantity: int(2000, 9000),
    status: i < 3 ? pick(["queued", "running"]) : "completed",
    started_at: ago(Math.floor(i / 2.3), int(0, 10)),
    finished_at: i < 3 ? null : ago(Math.floor(i / 2.3)),
    created_at: ago(Math.floor(i / 2.3) + 1),
  }));

  /* health cases */
  const DIAG = [
    ["Newcastle disease", "respiratory_disease"],
    ["Coccidiosis", "parasitic"],
    ["Mastitis", "bacterial"],
    ["Foot rot", "bacterial"],
    ["Heat stress", "environmental"],
    ["African swine fever", "viral"],
    ["Worm infestation", "parasitic"],
    ["Bloat", "digestive"],
  ] as const;
  const SEV = ["low", "medium", "medium", "high", "critical"];
  const CASE_STATUS = ["open", "in_progress", "resolved", "resolved", "monitoring"];
  const VETS = ["Dr. Ada Obi", "Dr. Kunle Ade", "Dr. Hauwa Sule"];
  const health_cases: Row[] = Array.from({ length: 34 }, (_, i) => {
    const [diagnosis, case_type] = pick(DIAG);
    const created = i < 8 ? ago(int(0, 6), int(0, 20)) : ago(int(7, 175));
    return {
      id: id("case"),
      farmer_id: pick(farmers).id,
      diagnosis,
      case_type,
      severity: pick(SEV),
      status: i < 8 ? pick(["open", "in_progress"]) : pick(CASE_STATUS),
      treatment: i % 2 === 0 ? "Isolate affected animals; start prescribed course." : null,
      description: `Reported symptoms consistent with ${diagnosis.toLowerCase()}.`,
      assigned_to: pick(VETS),
      opened_by: pick(AGENTS),
      created_at: created,
      updated_at: created,
    };
  });

  /* nutrition plans */
  const FOCUS = ["Protein deficiency", "Calcium imbalance", "Low energy intake", "Protein deficiency", "Vitamin A deficiency"];
  const nutrition_plans: Row[] = Array.from({ length: 16 }, (_, i) => {
    const farmer = pick(farmers);
    const focus = pick(FOCUS);
    const created = ago(int(0, 60));
    return {
      id: id("plan"),
      farmer_id: farmer.id,
      species: farmer.livestock_type,
      plan_name: `${focus} correction — ${farmer.livestock_type}`,
      status: pick(["active", "active", "draft", "completed", "archived"]),
      effective_from: created.slice(0, 10),
      plan: { focus, notes: "Adjust ration over 14 days and re-weigh." },
      description: `Ration adjustment addressing ${focus.toLowerCase()}.`,
      assigned_to: pick(VETS),
      created_by: pick(AGENTS),
      created_at: created,
      updated_at: created,
    };
  });

  /* visit reports */
  const SUMMARIES = [
    "Flock looks healthy; feed conversion improving.",
    "Noticed reduced feed intake in two pens.",
    "Water lines need cleaning; advised farmer.",
    "Mortality slightly above normal this week.",
    "Routine check, vaccinations up to date.",
  ];
  const visit_reports: Row[] = Array.from({ length: 36 }, (_, i) => {
    const mine = i % 2 === 0;
    const submitted = i < 4 ? todayAt(8 + i * 2) : ago(int(0, 13), int(0, 20));
    const farmer = mine ? pick(farmers.slice(0, 10)) : pick(farmers);
    return {
      id: id("visit"),
      farmer_id: farmer.id,
      agent_id: mine ? ME : pick(AGENTS.slice(1)),
      species: farmer.livestock_type,
      priority: pick(["normal", "normal", "medium", "high"]),
      status: i < 12 ? pick(["pending", "under_review"]) : pick(["approved", "approved", "rejected"]),
      summary: pick(SUMMARIES),
      notes: pick(SUMMARIES),
      payload: {},
      submitted_at: submitted,
      created_at: submitted,
      reviewed_at: i < 12 ? null : submitted,
      reviewed_by: null,
    };
  });

  /* support tickets */
  const SUBJECTS = [
    "Cannot sync offline visits",
    "Order ORD-10452 not delivered",
    "Wrong farmer region on profile",
    "Request: add goat ration template",
    "App crashes on report upload",
    "Invoice amount mismatch",
    "Need access to analytics page",
    "Feed quality complaint — Layer Mash",
    "Password reset not received",
    "Duplicate farmer records",
  ];
  const support_tickets: Row[] = SUBJECTS.map((subject, i) => ({
    id: id("tkt"),
    subject,
    description: `${subject}. Please look into this.`,
    priority: pick(["low", "normal", "high", "urgent"]),
    status: i < 6 ? pick(["open", "in_progress"]) : pick(["resolved", "closed"]),
    portal: pick(["field", "agent", "feedops"]),
    opened_by: i % 2 === 0 ? ME : pick(AGENTS.slice(1)),
    assignee_id: null,
    assigned_to: i % 3 === 0 ? "Support Desk" : null,
    created_at: ago(int(0, 20), int(0, 20)),
    updated_at: ago(int(0, 3)),
  }));

  /* knowledge base */
  const ARTICLES = [
    ["Vaccination schedule for layers", "Poultry", ["vaccines", "layers"]],
    ["Recognising Newcastle disease early", "Poultry", ["disease", "respiratory"]],
    ["Balancing dairy rations in dry season", "Cattle", ["nutrition", "dairy"]],
    ["Heat stress: signs and mitigation", "General", ["climate", "welfare"]],
    ["Deworming protocol for small ruminants", "Goats & Sheep", ["parasites"]],
    ["Biosecurity checklist for farm visits", "General", ["biosecurity", "visits"]],
    ["Catfish feeding rates by weight", "Aquaculture", ["fish", "feeding"]],
    ["Managing African swine fever outbreaks", "Pigs", ["disease", "outbreak"]],
    ["Reading feed conversion ratios", "Nutrition", ["fcr", "analytics"]],
  ] as const;
  const knowledge_articles: Row[] = ARTICLES.map(([title, category, tags], i) => {
    const created = ago(int(2, 120));
    return {
      id: id("kb"),
      title,
      category,
      tags: [...tags],
      body: `${title}.\n\nThis is sample guidance content for demo mode. Replace with real material once the knowledge base API is connected.`,
      published: i !== 4,
      is_published: i !== 4,
      author_id: pick(AGENTS),
      created_at: created,
      updated_at: created,
    };
  });

  /* notifications */
  const NOTES = [
    ["New report awaiting review", "Visit report from Okafor Farms needs review.", "report"],
    ["Low stock: Broiler Finisher", "Ibadan Depot is out of Broiler Finisher.", "inventory"],
    ["Critical health alert", "Suspected Newcastle disease at Bello Poultry.", "alert"],
    ["Order dispatched", "ORD-10455 is out for delivery.", "order"],
    ["Ticket updated", "Your ticket 'Cannot sync offline visits' was updated.", "support"],
    ["Nutrition plan approved", "Plan for Eze Ranch is now active.", "plan"],
    ["Weekly summary ready", "Your field activity summary is available.", "system"],
  ] as const;
  const notifications: Row[] = NOTES.map(([title, body, type], i) => ({
    id: id("ntf"),
    recipient_id: ME,
    title,
    body,
    type,
    link: null,
    read_at: i < 4 ? null : ago(i - 3),
    created_at: ago(i < 3 ? 0 : i - 2, i * 2 + 1),
  }));

  /* tasks */
  const TASKS = [
    ["Follow up on Coccidiosis case at Musa Agro", "high"],
    ["Collect water samples — Eze Livestock", "medium"],
    ["Deliver vaccination schedule to new farmers", "low"],
    ["Verify feed delivery ORD-10451", "medium"],
    ["Submit weekly visit summary", "high"],
    ["Update GPS coordinates for 3 farms", "low"],
  ] as const;
  const tasks: Row[] = TASKS.map(([title, priority], i) => ({
    id: id("task"),
    title,
    description: `${title}.`,
    priority,
    status: i < 4 ? "open" : "done",
    due_at: ago(-int(0, 6)),
    assignee: ME,
    assignee_id: ME,
    assigned_by: "agent-0002",
    created_at: ago(int(1, 10)),
    updated_at: ago(int(0, 2)),
  }));

  /* users + logs */
  const ROLES = ["field_agent", "field_agent", "field_agent", "admin_agent", "feedops", "system_admin"];
  const user_roles: Row[] = Array.from({ length: 28 }, (_, i) => ({
    id: id("role"),
    user_id: `user-${i}`,
    role: ROLES[i % ROLES.length],
    created_at: ago(int(1, 200)),
  }));
  const LOGS = [
    ["user.login", "auth"],
    ["farmer.create", "farmer"],
    ["order.update", "feed_order"],
    ["report.review", "visit_report"],
    ["inventory.adjust", "inventory_item"],
    ["plan.publish", "nutrition_plan"],
  ] as const;
  const system_logs: Row[] = Array.from({ length: 14 }, (_, i) => {
    const [action, entity] = pick(LOGS);
    return {
      id: id("log"),
      action,
      entity,
      entity_id: null,
      actor_id: pick(AGENTS),
      meta: { ip: `10.0.0.${int(2, 250)}` },
      created_at: ago(0, i * 3 + int(0, 2)),
    };
  });

  return {
    farmers,
    feed_products,
    inventory_items,
    feed_orders,
    production_runs,
    health_cases,
    nutrition_plans,
    visit_reports,
    support_tickets,
    knowledge_articles,
    notifications,
    tasks,
    user_roles,
    system_logs,
    activities: [],
    profiles: [],
  };
}
