import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

type Profile = { id: string; full_name: string; balance: number; created_at: string };
type Tx = { id: string; sender_id: string; receiver_id: string; amount: number; created_at: string };

const Admin = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      const admin = !!data;
      setIsAdmin(admin);
      if (!admin) { setBusy(false); return; }
      try {
        const [{ data: ps, error: pe }, { data: ts, error: te }] = await Promise.all([
          supabase.from("profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(100),
        ]);
        if (pe) throw pe;
        if (te) throw te;
        setProfiles((ps ?? []) as Profile[]);
        setTxs((ts ?? []) as Tx[]);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setBusy(false);
      }
    })();
  }, [user]);

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading || isAdmin === null) return null;
  if (!isAdmin) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <Card className="p-6 max-w-sm text-center space-y-3">
          <h1 className="text-lg font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground">You don't have admin access.</p>
          <Button asChild variant="outline"><Link to="/">Back</Link></Button>
        </Card>
      </main>
    );
  }

  const nameOf = (id: string) => profiles.find((p) => p.id === id)?.full_name ?? id.slice(0, 8);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin Panel</h1>
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Dashboard</Link>
          </Button>
        </header>

        {busy ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <>
            <Card className="p-4">
              <h2 className="font-semibold mb-3">Users ({profiles.length})</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.id.slice(0, 8)}…</TableCell>
                      <TableCell className="text-right">${Number(p.balance).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3">Recent Transactions ({txs.length})</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txs.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{nameOf(t.sender_id)}</TableCell>
                      <TableCell>{nameOf(t.receiver_id)}</TableCell>
                      <TableCell className="text-right">${Number(t.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(t.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {txs.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No transactions</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>
    </main>
  );
};

export default Admin;
