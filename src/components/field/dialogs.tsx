import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { mockDb as db } from "@/lib/mock/db";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  IS_API, VISIT_TYPE_LABEL, createVisit, fetchActiveBatches, fetchFarmerRows, fetchMyFarms, fetchOrderableProducts,
  placeOrder,
  type VisitType,
} from "@/lib/field/data";

/* ------------------------------------------------------------------ */
/*  Add Farmer                                                         */
/* ------------------------------------------------------------------ */

export function AddFarmerDialog({ trigger, onCreated }: { trigger: ReactNode; onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "", farm_name: "", region: "", phone: "", livestock_type: "Poultry - Layers", notes: "",
  });

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await db.from("farmers").insert({
        name: form.name.trim(),
        farm_name: form.farm_name.trim() || null,
        region: form.region.trim() || null,
        phone: form.phone.trim() || null,
        livestock_type: form.livestock_type,
        notes: form.notes.trim() || null,
        status: "active",
        assigned_agent_id: session?.user.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Farmer added");
      qc.invalidateQueries({ queryKey: ["farmers"] });
      qc.invalidateQueries({ queryKey: ["field-kpis"] });
      setForm({ name: "", farm_name: "", region: "", phone: "", livestock_type: "Poultry - Layers", notes: "" });
      setOpen(false);
      onCreated?.();
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't add farmer"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add farmer</DialogTitle>
          <DialogDescription>Register a new farmer to your territory.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (form.name.trim()) m.mutate(); }}>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Full name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Farm name</Label><Input value={form.farm_name} onChange={(e) => setForm({ ...form, farm_name: e.target.value })} /></div>
            <div><Label>Region</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Oyo, NG" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="col-span-2">
              <Label>Livestock type</Label>
              <Select value={form.livestock_type} onValueChange={(v) => setForm({ ...form, livestock_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Poultry - Layers","Poultry - Broilers","Dairy Cattle","Beef Cattle","Pigs","Fish - Catfish","Fish - Tilapia","Mixed Livestock"].map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={m.isPending || !form.name.trim()}>
              {m.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Add farmer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Add / Submit Visit Report                                          */
/* ------------------------------------------------------------------ */

function useMyFarmers() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["my-farmers-picker", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const { data, error } = await db.from("farmers").select("id, name, farm_name").order("name").limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Visit logging: a backend visit in api mode, a demo visit report otherwise.
 * In api mode `presetFarmerId` is a farm id (the Farmers page lists farms). */
export function AddReportDialog(props: { trigger: ReactNode; presetFarmerId?: string }) {
  return IS_API ? <LogVisitDialog trigger={props.trigger} presetFarmId={props.presetFarmerId} /> : <DemoReportDialog {...props} />;
}

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function LogVisitDialog({ trigger, presetFarmId }: { trigger: ReactNode; presetFarmId?: string }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const farms = useQuery({ queryKey: ["api-my-farms"], queryFn: fetchMyFarms, enabled: open });
  const empty = { farmId: presetFarmId ?? "", visitType: "physical" as VisitType, visitDate: todayIso(), summary: "", nextVisitDate: "" };
  const [form, setForm] = useState(empty);
  const ready = !!form.farmId && !!form.visitDate && !!form.summary.trim();

  const m = useMutation({
    mutationFn: () => createVisit(form),
    onSuccess: () => {
      toast.success("Visit logged");
      for (const key of ["my-visits", "farm-visits", "field-kpis", "todays-schedule"]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
      setForm(empty);
      setOpen(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't log the visit"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a farm visit</DialogTitle>
          <DialogDescription>Record a visit to one of your assigned farms.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (ready) m.mutate(); }}>
          <div>
            <Label htmlFor="visit-farm">Farm *</Label>
            <Select value={form.farmId} onValueChange={(v) => setForm({ ...form, farmId: v })}>
              <SelectTrigger id="visit-farm">
                <SelectValue placeholder={farms.isLoading ? "Loading your farms…" : "Choose a farm"} />
              </SelectTrigger>
              <SelectContent>
                {(farms.data ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {farms.isSuccess && farms.data.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">No farms are assigned to you yet. Ask an administrator to assign one.</p>
            )}
            {farms.isError && <p className="mt-1 text-xs text-destructive">Couldn't load your farms. Close this and try again.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="visit-type">Visit type</Label>
              <Select value={form.visitType} onValueChange={(v) => setForm({ ...form, visitType: v as VisitType })}>
                <SelectTrigger id="visit-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(VISIT_TYPE_LABEL) as VisitType[]).map((t) => (
                    <SelectItem key={t} value={t}>{VISIT_TYPE_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="visit-date">Visit date *</Label>
              <Input id="visit-date" type="date" required value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="visit-summary">Summary *</Label>
            <Textarea id="visit-summary" rows={4} required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="What you checked, animal condition, advice given…" />
          </div>
          <div>
            <Label htmlFor="visit-next">Next visit</Label>
            <Input id="visit-next" type="date" min={form.visitDate} value={form.nextVisitDate} onChange={(e) => setForm({ ...form, nextVisitDate: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={m.isPending || !ready}>
              {m.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Log visit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DemoReportDialog({ trigger, presetFarmerId }: { trigger: ReactNode; presetFarmerId?: string }) {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const qc = useQueryClient();
  const farmers = useMyFarmers();
  const [form, setForm] = useState({
    farmer_id: presetFarmerId ?? "",
    species: "Poultry",
    priority: "normal",
    summary: "",
  });

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await db.from("visit_reports").insert({
        farmer_id: form.farmer_id || null,
        agent_id: session?.user.id ?? null,
        species: form.species,
        priority: form.priority,
        status: "pending",
        summary: form.summary.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted");
      qc.invalidateQueries({ queryKey: ["my-reports"] });
      qc.invalidateQueries({ queryKey: ["field-kpis"] });
      qc.invalidateQueries({ queryKey: ["todays-schedule"] });
      setForm({ farmer_id: presetFarmerId ?? "", species: "Poultry", priority: "normal", summary: "" });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't submit report"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit visit report</DialogTitle>
          <DialogDescription>Log what you observed on your farm visit.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (form.summary.trim()) m.mutate(); }}>
          <div>
            <Label>Farmer</Label>
            <Select value={form.farmer_id} onValueChange={(v) => setForm({ ...form, farmer_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose a farmer" /></SelectTrigger>
              <SelectContent>
                {(farmers.data ?? []).map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name} — {f.farm_name ?? "—"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Species</Label>
              <Select value={form.species} onValueChange={(v) => setForm({ ...form, species: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Poultry","Cattle","Pigs","Fish","Mixed"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Summary *</Label>
            <Textarea rows={4} required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Observations, animal condition, follow-ups…" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={m.isPending || !form.summary.trim()}>
              {m.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Submit report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Feed Order                                                  */
/* ------------------------------------------------------------------ */

export function CreateOrderDialog({ trigger }: { trigger: ReactNode }) {
  return IS_API ? <PlaceOrderDialog trigger={trigger} /> : <DemoOrderDialog trigger={trigger} />;
}

const MAX_BAGS = 5000; // the backend's limit per line

/** Order feed for an assigned farm. Products and bags only: FeedOps sets the
 * price and delivery date when it confirms the order. */
function PlaceOrderDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const qc = useQueryClient();
  const farms = useQuery({
    queryKey: ["farmers", session?.user.id],
    queryFn: () => fetchFarmerRows(session?.user.id),
    enabled: open && !!session?.user.id,
  });
  const products = useQuery({ queryKey: ["orderable-products"], queryFn: fetchOrderableProducts, enabled: open });
  const empty = { farmId: "", batchId: "", productId: "", bags: "10", notes: "" };
  const [form, setForm] = useState(empty);
  const batches = useQuery({
    queryKey: ["active-batches", form.farmId],
    queryFn: () => fetchActiveBatches(form.farmId),
    enabled: open && !!form.farmId,
  });
  // One active batch is the common case: pick it so the agent doesn't have to.
  const onlyBatch = batches.data?.length === 1 ? batches.data[0].id : "";
  const batchId = form.batchId || onlyBatch;
  const bags = Number(form.bags);
  const bagsValid = Number.isInteger(bags) && bags >= 1 && bags <= MAX_BAGS;
  const ready = !!form.farmId && !!batchId && !!form.productId && bagsValid;

  const m = useMutation({
    mutationFn: () => placeOrder({ farmId: form.farmId, batchId, productId: form.productId, bags, notes: form.notes }),
    onSuccess: () => {
      toast.success("Order placed. FeedOps will confirm the price and delivery date.");
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      setForm(empty);
      setOpen(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't place the order"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Place feed order</DialogTitle>
          <DialogDescription>
            Order feed for one of your assigned farms. FeedOps confirms the price and delivery date.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (ready) m.mutate(); }}>
          <div>
            <Label htmlFor="order-farm">Farm *</Label>
            <Select value={form.farmId} onValueChange={(v) => setForm({ ...form, farmId: v, batchId: "" })}>
              <SelectTrigger id="order-farm">
                <SelectValue placeholder={farms.isLoading ? "Loading your farms…" : "Choose a farm"} />
              </SelectTrigger>
              <SelectContent>
                {(farms.data ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name === f.farm_name ? f.farm_name : `${f.farm_name} — ${f.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {farms.isSuccess && farms.data.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">No farms are assigned to you yet. Ask an administrator to assign one.</p>
            )}
            {farms.isError && <p className="mt-1 text-xs text-destructive">Couldn't load your farms. Close this and try again.</p>}
          </div>
          {form.farmId && (
            <div>
              <Label htmlFor="order-batch">Batch *</Label>
              <Select value={batchId} onValueChange={(v) => setForm({ ...form, batchId: v })}>
                <SelectTrigger id="order-batch">
                  <SelectValue placeholder={batches.isLoading ? "Loading batches…" : "Choose a batch"} />
                </SelectTrigger>
                <SelectContent>
                  {(batches.data ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {[b.batch_code, b.species?.name, b.current_stock != null ? `${b.current_stock.toLocaleString()} head` : null]
                        .filter(Boolean).join(" · ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {batches.isSuccess && batches.data.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">This farm has no active batch. Feed is ordered for a batch, so the farmer needs to start one in the app first.</p>
              )}
              {batches.isError && <p className="mt-1 text-xs text-destructive">Couldn't load this farm's batches. Choose the farm again.</p>}
            </div>
          )}
          <div>
            <Label htmlFor="order-product">Product *</Label>
            <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
              <SelectTrigger id="order-product">
                <SelectValue placeholder={products.isLoading ? "Loading products…" : "Choose a product"} />
              </SelectTrigger>
              <SelectContent>
                {(products.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}{p.bag_size_kg ? ` (${Number(p.bag_size_kg)} kg bag)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {products.isSuccess && products.data.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">No feed products are available to order right now.</p>
            )}
            {products.isError && <p className="mt-1 text-xs text-destructive">Couldn't load products. Close this and try again.</p>}
          </div>
          <div>
            <Label htmlFor="order-bags">Bags *</Label>
            <Input
              id="order-bags" type="number" inputMode="numeric" min={1} max={MAX_BAGS} step={1} required
              value={form.bags} onChange={(e) => setForm({ ...form, bags: e.target.value })}
              aria-invalid={!bagsValid}
            />
            {!bagsValid && form.bags !== "" && (
              <p className="mt-1 text-xs text-destructive">Enter a whole number of bags from 1 to {MAX_BAGS.toLocaleString()}.</p>
            )}
          </div>
          <div>
            <Label htmlFor="order-notes">Notes</Label>
            <Textarea
              id="order-notes" rows={3} maxLength={1000} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Delivery instructions, urgency…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={m.isPending || !ready}>
              {m.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Place order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DemoOrderDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const qc = useQueryClient();
  const farmers = useMyFarmers();
  const products = useQuery({
    queryKey: ["feed-products-picker"],
    queryFn: async () => {
      const { data, error } = await db.from("feed_products").select("id, name, sku, unit").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [form, setForm] = useState({ farmer_id: "", product_id: "", quantity: "10" });

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await db.from("feed_orders").insert({
        farmer_id: form.farmer_id || null,
        product_id: form.product_id || null,
        agent_id: session?.user.id ?? null,
        quantity: Number(form.quantity) || 0,
        status: "placed",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order placed");
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      setForm({ farmer_id: "", product_id: "", quantity: "10" });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't place order"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Place feed order</DialogTitle>
          <DialogDescription>Order feed on behalf of a farmer.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (form.farmer_id && form.product_id) m.mutate(); }}>
          <div>
            <Label>Farmer *</Label>
            <Select value={form.farmer_id} onValueChange={(v) => setForm({ ...form, farmer_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose a farmer" /></SelectTrigger>
              <SelectContent>
                {(farmers.data ?? []).map(f => <SelectItem key={f.id} value={f.id}>{f.name} — {f.farm_name ?? "—"}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Product *</Label>
            <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose a product" /></SelectTrigger>
              <SelectContent>
                {(products.data ?? []).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantity</Label>
            <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={m.isPending || !form.farmer_id || !form.product_id}>
              {m.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Place order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Send message / Open support ticket                                 */
/* ------------------------------------------------------------------ */

export function OpenTicketDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ subject: "", priority: "normal" });

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await db.from("support_tickets").insert({
        opened_by: session?.user.id,
        subject: form.subject.trim(),
        priority: form.priority,
        status: "open",
        portal: "agent",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Support ticket opened");
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
      setForm({ subject: "", priority: "normal" });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't open ticket"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Contact support</DialogTitle>
          <DialogDescription>We'll reply to you in-app and by email.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (form.subject.trim()) m.mutate(); }}>
          <div><Label>Subject *</Label><Textarea rows={4} required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Describe the issue you're seeing…" /></div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={m.isPending || !form.subject.trim()}>
              {m.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Open ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}