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

  /* notifications — targeted per role, each with a link to the screen it is about */
  type Note = { roles: string[]; title: string; body: string; type: string; link: string; hoursAgo: number; read?: boolean };
  const firstFarm = (i: number) => farmers[i]!.farm_name as string;
  const NOTES: Note[] = [
    // Field agent
    { roles: ["field_agent"], type: "schedule", title: "Visit starting soon", body: `Routine health check at ${firstFarm(1)} in 1 hour.`, link: "/my-visits", hoursAgo: 0.3 },
    { roles: ["field_agent"], type: "report", title: "Report reviewed", body: `Your visit report for ${firstFarm(2)} was approved.`, link: "/reports", hoursAgo: 2 },
    { roles: ["field_agent"], type: "order", title: "Order out for delivery", body: "ORD-10455 (Layer Mash 18%) is on its way.", link: "/feed-orders", hoursAgo: 5 },
    { roles: ["field_agent"], type: "task", title: "New task assigned", body: "Follow up on the Coccidiosis case at Musa Agro.", link: "/tasks", hoursAgo: 8 },
    { roles: ["field_agent"], type: "support", title: "Ticket updated", body: "Support replied to 'Cannot sync offline visits'.", link: "/support", hoursAgo: 26, read: true },
    { roles: ["field_agent"], type: "performance", title: "80% of weekly target", body: "You're 4 visits away from this week's goal.", link: "/performance", hoursAgo: 30, read: true },
    // Admin agent (nutrition / vet)
    { roles: ["admin_agent"], type: "report", title: "Report awaiting review", body: `New visit report from ${firstFarm(3)} needs review.`, link: "/agent/reports-review", hoursAgo: 0.5 },
    { roles: ["admin_agent"], type: "alert", title: "Critical health alert", body: `Suspected Newcastle disease at ${firstFarm(4)}.`, link: "/agent/health-assessments", hoursAgo: 1.5 },
    { roles: ["admin_agent"], type: "rescue", title: "Rescue plan needed", body: "2 high-severity cases have no intervention yet.", link: "/agent/rescue-plans", hoursAgo: 4 },
    { roles: ["admin_agent"], type: "plan", title: "Nutrition plan activated", body: `Ration plan for ${firstFarm(5)} is now active.`, link: "/agent/nutrition-plans", hoursAgo: 20, read: true },
    { roles: ["admin_agent"], type: "knowledge", title: "New article published", body: "'Heat stress: signs and mitigation' is live.", link: "/agent/knowledge-base", hoursAgo: 28, read: true },
    { roles: ["admin_agent"], type: "support", title: "Ticket updated", body: "Support replied to 'Need access to analytics page'.", link: "/agent/support", hoursAgo: 50, read: true },
    // Feed operations
    { roles: ["feedops"], type: "inventory", title: "Out of stock", body: "Broiler Finisher is out of stock at Ibadan Depot.", link: "/feedops#inventory", hoursAgo: 0.4 },
    { roles: ["feedops"], type: "order", title: "New order placed", body: "ORD-10471: 40 bags of Dairy Concentrate.", link: "/feedops#orders", hoursAgo: 1 },
    { roles: ["feedops"], type: "production", title: "Batch finished", body: "Production batch B-2403 completed (6.2 MT).", link: "/feedops#production", hoursAgo: 6 },
    { roles: ["feedops"], type: "inventory", title: "Low stock warning", body: "Layer Mash 18% is below reorder level in Kaduna.", link: "/feedops#inventory", hoursAgo: 22, read: true },
    // System admin
    { roles: ["system_admin"], type: "order", title: "Pending orders rising", body: "22 orders are waiting to be fulfilled.", link: "/admin#overview", hoursAgo: 0.6 },
    { roles: ["system_admin"], type: "support", title: "New support ticket", body: "'App crashes on report upload' was opened.", link: "/admin#support", hoursAgo: 2.5 },
    { roles: ["system_admin"], type: "growth", title: "New farmers this week", body: "5 farmers were onboarded in the last 7 days.", link: "/admin#performance", hoursAgo: 9 },
    { roles: ["system_admin"], type: "security", title: "Repeated login failures", body: "Several failed sign-ins from 10.0.0.42.", link: "/admin#logs", hoursAgo: 30, read: true },
  ];
  const notifications: Row[] = NOTES.map((n) => ({
    id: id("ntf"),
    recipient_id: ME,
    roles: n.roles,
    title: n.title,
    body: n.body,
    type: n.type,
    link: n.link,
    read_at: n.read ? ago(0, n.hoursAgo - 0.1) : null,
    created_at: new Date(now - n.hoursAgo * 3_600_000).toISOString(),
  }));

  /* visit schedule — planned visits for the signed-in field agent, 12 weeks back to 1 week ahead */
  const PURPOSES = ["Routine health check", "Vaccination follow-up", "Feed trial review", "Mortality investigation", "New farmer onboarding", "Water & housing audit"];
  const myFarmers = farmers.slice(0, 10);
  const visit_schedule: Row[] = [];
  for (let day = -84; day <= 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    const count = day === 0 ? 4 : weekend ? int(0, 1) : int(1, 3);
    const hours = [8, 10, 12, 14, 16].sort(() => rand() - 0.5).slice(0, count).sort((a, b) => a - b);
    for (const h of hours) {
      const at = new Date(date);
      at.setHours(h, pick([0, 15, 30, 45]), 0, 0);
      const past = at.getTime() < now;
      visit_schedule.push({
        id: id("sched"),
        agent_id: ME,
        farmer_id: pick(myFarmers).id,
        purpose: pick(PURPOSES),
        scheduled_for: at.toISOString(),
        status: past ? (rand() < 0.85 ? "completed" : "missed") : "scheduled",
        created_at: ago(Math.max(0, -day) + 3),
      });
    }
  }

  /* offline sync — items captured offline and waiting to upload, plus past sync runs */
  const QUEUE = [
    ["visit_report", "Visit report", `${firstFarm(0)} · routine health check`, 18],
    ["visit_report", "Visit report", `${firstFarm(3)} · vaccination follow-up`, 22],
    ["photo", "3 photos", `Pen 2 litter condition · ${firstFarm(3)}`, 4_620],
    ["farmer_update", "Farmer profile", `${farmers[6]!.name} · phone number changed`, 2],
    ["photo", "1 photo", `Feed sample label · ${firstFarm(7)}`, 1_280],
    ["order", "Feed order draft", "20 bags Layer Mash 18%", 3],
  ] as const;
  const sync_queue: Row[] = QUEUE.map(([kind, label, detail, size_kb], i) => ({
    id: id("sync"),
    agent_id: ME,
    kind,
    label,
    detail,
    size_kb,
    status: "queued",
    created_at: ago(0, 5 - i * 0.7),
  }));
  const sync_history: Row[] = Array.from({ length: 6 }, (_, i) => ({
    id: id("synh"),
    agent_id: ME,
    items: int(2, 14),
    status: i === 2 ? "partial" : "success",
    duration_ms: int(1_200, 9_000),
    created_at: ago(i, 2 + i * 3),
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
  /* ---------------------------- people & access ---------------------------- */
  const STAFF: [string, string, string][] = [
    // [id, name, role]
    ["agent-0002", "Tunde Adeyemi", "field_agent"],
    ["agent-0003", "Halima Musa", "field_agent"],
    ["user-fa-04", "Chinedu Okafor", "field_agent"],
    ["user-fa-05", "Blessing Eze", "field_agent"],
    ["user-fa-06", "Musa Danladi", "field_agent"],
    ["user-fa-07", "Kemi Ogunleye", "field_agent"],
    ["user-fa-08", "Garba Lawal", "field_agent"],
    ["user-aa-01", "Dr. Ada Obi", "admin_agent"],
    ["user-aa-02", "Dr. Kunle Ade", "admin_agent"],
    ["user-aa-03", "Dr. Hauwa Sule", "admin_agent"],
    ["user-fo-01", "Tunde Bakare", "feedops"],
    ["user-fo-02", "Ifeoma Nnaji", "feedops"],
    ["user-fo-03", "Sani Bello", "feedops"],
    ["user-fo-04", "Funke Adebayo", "feedops"],
    ["user-sa-01", "Zainab Abubakar", "system_admin"],
    ["user-sa-02", "Obinna Uche", "system_admin"],
    ["user-in-01", "Aisha Lawal", "field_agent"],
    ["user-in-02", "Emeka Obi", "feedops"],
  ];
  const users: Row[] = STAFF.map(([uid, name, role], i) => ({
    id: uid,
    name,
    email: `${name.toLowerCase().replace(/^dr\. /, "").replace(/[^a-z]+/g, ".")}@agrovestors.com`,
    phone: `+23480${int(10000000, 99999999)}`,
    role,
    region: role === "field_agent" ? REGIONS[i % REGIONS.length] : role === "feedops" ? pick(["Kaduna", "Oyo"]) : "HQ",
    status: uid.startsWith("user-in") ? "invited" : i === 6 ? "suspended" : "active",
    last_active_at: uid.startsWith("user-in") ? null : ago(int(0, 6), int(0, 20)),
    created_at: ago(int(20, 400)),
  }));
  // Spread the field agents' farmers across the team (seeded farmers 10+ belong to others).
  const fieldStaff = users.filter((u) => u.role === "field_agent" && u.status === "active").map((u) => u.id);
  farmers.slice(10).forEach((f, i) => (f.assigned_agent_id = fieldStaff[i % fieldStaff.length]));

  const PERMISSIONS = [
    "farmers.view", "farmers.edit", "visits.create", "reports.submit", "reports.review", "plans.publish",
    "cases.manage", "orders.create", "orders.manage", "inventory.manage", "production.manage",
    "users.manage", "roles.manage", "billing.view", "settings.manage",
  ];
  const roles: Row[] = [
    { key: "system_admin", name: "System Administrator", description: "Full access to the platform.", permissions: PERMISSIONS, system: true },
    { key: "field_agent", name: "Field Agent", description: "Visits farms, submits reports and places orders.", permissions: ["farmers.view", "farmers.edit", "visits.create", "reports.submit", "orders.create"], system: true },
    { key: "admin_agent", name: "Admin Agent (Nutrition / Vet)", description: "Reviews reports, manages cases and publishes plans.", permissions: ["farmers.view", "reports.review", "plans.publish", "cases.manage"], system: true },
    { key: "feedops", name: "Feed Operations", description: "Runs inventory, production and fulfilment.", permissions: ["orders.manage", "inventory.manage", "production.manage"], system: true },
    { key: "regional_supervisor", name: "Regional Supervisor", description: "Oversees field agents in a region.", permissions: ["farmers.view", "farmers.edit", "reports.review", "orders.manage"], system: false },
  ].map((r) => ({ id: id("role"), created_at: ago(300), ...r }));

  /* ------------------------------ feed operations ------------------------------ */
  const DRIVERS = ["Yakubu Ali", "Peter Okon", "Ibrahim Sani", "Joseph Edet"];
  const VEHICLES = ["KAD-482-XA", "LAG-119-KJ", "ABJ-730-MN", "IBD-044-PQ"];
  const deliveries: Row[] = feed_orders
    .filter((o) => o.status === "out_for_delivery" || o.status === "delivered")
    .map((o) => {
      const farmer = farmers.find((f) => f.id === o.farmer_id);
      const scheduled = new Date(new Date(o.placed_at).getTime() + int(6, 30) * 3_600_000).toISOString();
      return {
        id: id("dlv"),
        order_id: o.id,
        driver: pick(DRIVERS),
        vehicle: pick(VEHICLES),
        region: farmer?.region ?? pick(REGIONS),
        scheduled_for: scheduled,
        delivered_at: o.status === "delivered" ? scheduled : null,
        status: o.status === "delivered" ? "delivered" : pick(["scheduled", "in_transit"]),
        created_at: o.placed_at,
      };
    });

  const SUPPLIERS = [
    ["Northern Grains Ltd", "Maize", "Kano"], ["SoyPro Nigeria", "Soybean meal", "Benue"], ["Premix Africa", "Vitamin premix", "Lagos"],
    ["Coastal Fishmeal Co.", "Fishmeal", "Lagos"], ["Kaduna Millers", "Wheat offal", "Kaduna"], ["Agro Bags & Packaging", "Packaging", "Ogun"],
    ["LimeStone Minerals", "Limestone", "Ogun"], ["Golden Palm Oils", "Vegetable oil", "Enugu"],
  ];
  const suppliers: Row[] = SUPPLIERS.map(([name, category, region], i) => ({
    id: id("sup"),
    name,
    category,
    region,
    contact_name: `${pick(FIRST)} ${pick(LAST)}`,
    phone: `+23481${int(10000000, 99999999)}`,
    email: `orders@${name.toLowerCase().replace(/[^a-z]+/g, "")}.ng`,
    rating: [4.8, 4.5, 4.2, 3.9, 4.6, 4.0, 3.6, 4.3][i],
    status: i === 6 ? "inactive" : "active",
    last_order_at: ago(int(1, 45)),
    created_at: ago(int(100, 600)),
  }));

  const quality_checks: Row[] = production_runs
    .filter((r) => r.status === "completed")
    .map((r, i) => {
      const moisture = Math.round((10 + rand() * 4.5) * 10) / 10;
      const protein = Math.round((14 + rand() * 8) * 10) / 10;
      const aflatoxin = int(2, 24);
      const result = moisture > 13.5 || aflatoxin > 20 ? "fail" : "pass";
      return {
        id: id("qc"),
        run_id: r.id,
        batch_no: r.batch_no,
        product_id: r.product_id,
        inspector: pick(["Ifeoma Nnaji", "Sani Bello", "Tunde Bakare"]),
        moisture,
        protein,
        aflatoxin,
        result: i === 0 ? "pending" : result,
        notes: result === "fail" ? "Hold batch; re-test after drying." : null,
        checked_at: r.finished_at,
        created_at: r.finished_at,
      };
    });

  const stock_transfers: Row[] = Array.from({ length: 9 }, (_, i) => {
    const from = WAREHOUSES[i % 2]!;
    return {
      id: id("trf"),
      ref: `TRF-${3100 + i}`,
      product_id: pick(feed_products).id,
      from_warehouse: from,
      to_warehouse: WAREHOUSES[(i + 1) % 2]!,
      quantity: int(20, 180),
      status: i < 2 ? "requested" : i < 4 ? "in_transit" : "received",
      requested_by: pick(["Tunde Bakare", "Ifeoma Nnaji", "Sani Bello"]),
      requested_at: ago(i < 4 ? int(0, 2) : int(3, 30)),
      created_at: ago(i < 4 ? int(0, 2) : int(3, 30)),
    };
  });

  /* --------------------------------- billing --------------------------------- */
  const invoices: Row[] = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const users_billed = 14 + Math.max(0, 6 - i);
    return {
      id: id("inv"),
      number: `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`,
      period: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      seats: users_billed,
      amount: users_billed * 15_000 + 120_000,
      status: i === 0 ? "due" : "paid",
      issued_at: d.toISOString(),
      created_at: d.toISOString(),
    };
  });

  /* ------------------------------ logs & audit ------------------------------ */
  const LOGS = [
    ["info", "user.login", "auth", "Signed in"],
    ["info", "farmer.create", "farmer", "Farmer registered"],
    ["info", "order.update", "feed_order", "Order status changed"],
    ["info", "report.review", "visit_report", "Report reviewed"],
    ["info", "inventory.adjust", "inventory_item", "Stock adjusted"],
    ["info", "plan.publish", "nutrition_plan", "Plan published"],
    ["warn", "auth.failed", "auth", "Failed sign-in attempt"],
    ["warn", "sync.retry", "sync", "Offline sync retried"],
    ["error", "sync.failed", "sync", "Upload failed: network timeout"],
    ["error", "payment.failed", "billing", "Card declined for invoice"],
  ] as const;
  const people = users.map((u) => u.name as string);
  const system_logs: Row[] = Array.from({ length: 70 }, (_, i) => {
    const [level, action, entity, message] = rand() < 0.75 ? pick(LOGS.slice(0, 6)) : pick(LOGS.slice(6));
    return {
      id: id("log"),
      level,
      action,
      entity,
      message,
      entity_id: null,
      actor_id: pick(AGENTS),
      actor_name: pick(people),
      meta: { ip: `10.0.${int(0, 3)}.${int(2, 250)}` },
      created_at: ago(Math.floor(i / 8), (i % 8) * 3 + int(0, 2)),
    };
  });

  const AUDIT = [
    ["updated", "user", "role", "field_agent", "regional_supervisor"],
    ["updated", "farmer", "status", "active", "inactive"],
    ["created", "user", null, null, null],
    ["updated", "role", "permissions", "4 permissions", "5 permissions"],
    ["updated", "settings", "session_timeout", "60 min", "30 min"],
    ["deleted", "supplier", null, null, null],
    ["updated", "feed_order", "status", "processing", "out_for_delivery"],
    ["updated", "inventory_item", "quantity", "420", "380"],
  ] as const;
  const audit_events: Row[] = Array.from({ length: 40 }, (_, i) => {
    const [action, entity, field, from, to] = pick(AUDIT);
    const target =
      entity === "user" ? pick(users).name : entity === "farmer" ? pick(farmers).name : entity === "supplier" ? pick(suppliers).name : entity === "feed_order" ? pick(feed_orders).order_no : entity === "role" ? "Regional Supervisor" : entity === "inventory_item" ? pick(feed_products).name : "Platform settings";
    return {
      id: id("aud"),
      actor_name: pick(["Zainab Abubakar", "Obinna Uche", "Tunde Bakare", "Dr. Ada Obi"]),
      action,
      entity,
      target,
      field,
      from,
      to,
      ip: `10.0.${int(0, 3)}.${int(2, 250)}`,
      created_at: ago(Math.floor(i / 4), (i % 4) * 5 + int(0, 3)),
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
    visit_schedule,
    sync_queue,
    sync_history,
    tasks,
    user_roles,
    system_logs,
    users,
    roles,
    deliveries,
    suppliers,
    quality_checks,
    stock_transfers,
    invoices,
    audit_events,
    activities: [],
    profiles: [],
  };
}
