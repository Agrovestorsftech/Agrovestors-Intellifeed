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
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";

function useFarmersPicker() {
  return useQuery({
    queryKey: ["farmers-picker-agent"],
    queryFn: async () => {
      const { data, error } = await supabase.from("farmers").select("id, name, farm_name, livestock_type").order("name").limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Add Nutrition Plan                                                  */
/* ------------------------------------------------------------------ */

export function AddNutritionPlanDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const qc = useQueryClient();
  const farmers = useFarmersPicker();
  const [form, setForm] = useState({
    farmer_id: "", species: "Poultry", status: "draft", effective_from: "", notes: "",
  });

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("nutrition_plans").insert({
        farmer_id: form.farmer_id || null,
        species: form.species,
        status: form.status,
        effective_from: form.effective_from || null,
        created_by: session?.user.id ?? null,
        plan: { notes: form.notes.trim() || null },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nutrition plan created");
      qc.invalidateQueries({ queryKey: ["nutrition-plans"] });
      qc.invalidateQueries({ queryKey: ["agent-kpis"] });
      setForm({ farmer_id: "", species: "Poultry", status: "draft", effective_from: "", notes: "" });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't create plan"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New nutrition plan</DialogTitle>
          <DialogDescription>Create a feeding plan for a farmer's livestock.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (form.farmer_id) m.mutate(); }}>
          <div>
            <Label>Farmer *</Label>
            <Select value={form.farmer_id} onValueChange={(v) => setForm({ ...form, farmer_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose a farmer" /></SelectTrigger>
              <SelectContent>
                {(farmers.data ?? []).map((f: any) => (
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
                  {["Poultry", "Cattle", "Pigs", "Fish", "Mixed"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Effective from</Label>
            <Input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} />
          </div>
          <div>
            <Label>Plan notes</Label>
            <Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Feed mix, ratios, schedule, supplements…" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={m.isPending || !form.farmer_id}>
              {m.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Health Case                                                     */
/* ------------------------------------------------------------------ */

export function AddHealthCaseDialog({ trigger, presetFarmerId }: { trigger: ReactNode; presetFarmerId?: string }) {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const qc = useQueryClient();
  const farmers = useFarmersPicker();
  const [form, setForm] = useState({
    farmer_id: presetFarmerId ?? "", severity: "medium", diagnosis: "", treatment: "",
  });

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("health_cases").insert({
        farmer_id: form.farmer_id || null,
        severity: form.severity,
        diagnosis: form.diagnosis.trim() || null,
        treatment: form.treatment.trim() || null,
        status: "open",
        opened_by: session?.user.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Health case opened");
      qc.invalidateQueries({ queryKey: ["health-cases"] });
      qc.invalidateQueries({ queryKey: ["agent-kpis"] });
      qc.invalidateQueries({ queryKey: ["critical-alerts"] });
      setForm({ farmer_id: presetFarmerId ?? "", severity: "medium", diagnosis: "", treatment: "" });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't open case"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New health case</DialogTitle>
          <DialogDescription>Open a health case for a farmer's livestock.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (form.farmer_id) m.mutate(); }}>
          <div>
            <Label>Farmer *</Label>
            <Select value={form.farmer_id} onValueChange={(v) => setForm({ ...form, farmer_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose a farmer" /></SelectTrigger>
              <SelectContent>
                {(farmers.data ?? []).map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>{f.name} — {f.farm_name ?? "—"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Severity</Label>
            <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Diagnosis</Label><Textarea rows={3} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></div>
          <div><Label>Treatment plan</Label><Textarea rows={3} value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={m.isPending || !form.farmer_id}>
              {m.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Open case
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Knowledge Article                                               */
/* ------------------------------------------------------------------ */

export function AddKnowledgeArticleDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", category: "", tags: "", body: "", published: true });

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("knowledge_articles").insert({
        title: form.title.trim(),
        category: form.category.trim() || null,
        tags: form.tags.trim() ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
        body: form.body.trim(),
        published: form.published,
        author_id: session?.user.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Article saved");
      qc.invalidateQueries({ queryKey: ["knowledge-articles"] });
      qc.invalidateQueries({ queryKey: ["knowledge-articles-full"] });
      setForm({ title: "", category: "", tags: "", body: "", published: true });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't save article"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New knowledge article</DialogTitle>
          <DialogDescription>Publish a guideline, protocol, or reference note.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (form.title.trim() && form.body.trim()) m.mutate(); }}>
          <div><Label>Title *</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Nutrition, Health…" /></div>
            <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="poultry, biosecurity" /></div>
          </div>
          <div><Label>Body *</Label><Textarea rows={6} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
            <Label className="!mb-0">Publish immediately</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={m.isPending || !form.title.trim() || !form.body.trim()}>
              {m.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save article
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}