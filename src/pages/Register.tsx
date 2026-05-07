import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Step = "phone" | "otp" | "details";

const COUNTRY_CODES = [
  { code: "+1", label: "United States (+1)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+91", label: "India (+91)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+81", label: "Japan (+81)" },
  { code: "+86", label: "China (+86)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "+55", label: "Brazil (+55)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+92", label: "Pakistan (+92)" },
  { code: "+880", label: "Bangladesh (+880)" },
  { code: "+234", label: "Nigeria (+234)" },
  { code: "+27", label: "South Africa (+27)" },
  { code: "+52", label: "Mexico (+52)" },
];

const Register = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState("+1");
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
    toast.success(`OTP sent to ${countryCode} ${phone}: ${code}`, { description: "Demo mode — code shown here" });
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
        data: { full_name: fullName, phone: `${countryCode}${phone}` },
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
              <Label>Country</Label>
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {COUNTRY_CODES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                  {countryCode}
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
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
