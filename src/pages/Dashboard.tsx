import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { fetchProfiles, sendMoney } from "@/services/wallet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LogOut, Shield, Wallet } from "lucide-react";

type Profile = { id: string; full_name: string; balance: number };

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    try {
      const data = await fetchProfiles();
      setProfiles(data as Profile[]);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading) return null;

  const me = profiles.find((p) => p.id === user!.id);
  const others = profiles.filter((p) => p.id !== user!.id);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!receiver || !amt || amt <= 0) return toast.error("Pick a user and a valid amount");
    setBusy(true);
    try {
      await sendMoney(receiver, amt);
      toast.success("Money sent!");
      setAmount("");
      setReceiver("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Wallet</h1>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </header>

        <Card className="p-6 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3 text-sm opacity-80">
            <Wallet className="w-4 h-4" /> Your balance
          </div>
          <div className="mt-2 text-4xl font-semibold">
            ${me?.balance?.toFixed(2) ?? "0.00"}
          </div>
          <div className="mt-1 text-sm opacity-80">{me?.full_name}</div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Send money</h2>
          <form onSubmit={onSend} className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Select value={receiver} onValueChange={setReceiver}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {others.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amt">Amount</Label>
              <Input id="amt" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending..." : "Send"}</Button>
          </form>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="font-semibold">All users</h2>
          <ul className="divide-y">
            {profiles.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between">
                <span className="text-sm">{p.full_name}{p.id === user!.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</span>
                <span className="text-sm font-medium">${Number(p.balance).toFixed(2)}</span>
              </li>
            ))}
            {profiles.length === 0 && <li className="py-3 text-sm text-muted-foreground">No users yet.</li>}
          </ul>
        </Card>
      </div>
    </main>
  );
};

export default Dashboard;
