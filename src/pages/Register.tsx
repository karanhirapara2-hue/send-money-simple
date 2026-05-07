import { useEffect, useRef, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Step = "phone" | "details";

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

const RESEND_SECONDS = 60;

const Register = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  if (!loading && user) return <Navigate to="/" replace />;

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{7,15}$/.test(phone.replace(/\D/g, ""))) {
      return toast.error("Enter a valid phone number");
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
    setSecondsLeft(RESEND_SECONDS);
    toast.success(`OTP sent to ${countryCode} ${phone}: ${code}`, {
      description: "Demo mode — code shown here",
    });
    setTimeout(() => inputsRef.current[0]?.focus(), 50);
  };

  const verifyOtp = async (code: string) => {
    setVerifying(true);
    setOtpError("");
    await new Promise((r) => setTimeout(r, 800));
    if (code !== generatedOtp) {
      setVerifying(false);
      setOtpError("Incorrect OTP. Please try again.");
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
      return;
    }
    setVerifying(false);
    toast.success("Phone verified");
    setStep("details");
  };

  const handleDigitChange = (idx: number, value: string) => {
    const d = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[idx] = d;
    setOtpDigits(next);
    if (otpError) setOtpError("");
    if (d && idx < 5) inputsRef.current[idx + 1]?.focus();
    if (next.every((x) => x !== "") && next.join("").length === 6) {
      verifyOtp(next.join(""));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtpDigits(next);
    inputsRef.current[Math.min(text.length, 5)]?.focus();
    if (text.length === 6) verifyOtp(text);
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
      {verifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying OTP...</p>
          </div>
        </div>
      )}

      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-muted-foreground">
            {step === "phone" && "Verify your phone number to begin."}
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

            <Button type="submit" className="w-full" disabled={secondsLeft > 0}>
              {secondsLeft > 0
                ? `Resend OTP in ${secondsLeft}s`
                : otpSent
                ? "Resend OTP"
                : "Send OTP"}
            </Button>

            {otpSent && (
              <div className="space-y-3 pt-2">
                <Label>Enter 6-digit OTP</Label>
                <div className="flex justify-between gap-2">
                  {otpDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputsRef.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      disabled={verifying}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onPaste={handlePaste}
                      className="h-12 w-12 rounded-md border border-input bg-background text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    />
                  ))}
                </div>
                {otpError && (
                  <p className="text-sm text-destructive">{otpError}</p>
                )}
              </div>
            )}
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
