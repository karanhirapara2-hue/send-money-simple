import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type Step = "phone" | "otp" | "details";

const Register = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{7,15}$/.test(phone.replace(/\D/g, ""))) {
      return toast.error("Enter a valid phone number");
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setStep("otp");
    toast.success(`OTP sent: ${code}`, { description: "Demo mode — code shown here" });
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== generatedOtp) return toast.error("Incorrect OTP");
    toast.success("Phone verified");
    setStep("details");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, phone },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created!");
    navigate("/");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-muted-foreground">
            {step === "phone" && "Verify your phone number to begin."}
            {step === "otp" && "Enter the 6-digit code we sent."}
            {step === "details" && "Get $1,000 starting balance."}
          </p>
        </div>

        {step === "phone" && (
          <form onSubmit={sendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">Send OTP</Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <Button type="submit" className="w-full">Verify</Button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground w-full"
              onClick={() => setStep("phone")}
            >
              Change phone number
            </button>
          </form>
        )}

        {step === "details" && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating..." : "Sign up"}</Button>
          </form>
        )}

        <p className="text-sm text-center text-muted-foreground">
          Have an account? <Link to="/login" className="text-primary underline">Sign in</Link>
        </p>
      </Card>
    </main>
  );
};

export default Register;
