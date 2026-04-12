import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Phone, Lock, ArrowLeft, Loader2, Sparkles, Check, X, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

type InputType = "email" | "phone" | null;
type AuthStep = "identifier" | "email_password" | "email_magic_sent" | "phone_otp_sent";

const passwordSchema = z
  .string()
  .min(8, "min8")
  .regex(/[A-Z]/, "uppercase")
  .regex(/[a-z]/, "lowercase")
  .regex(/[0-9]/, "number")
  .regex(/[^A-Za-z0-9]/, "special");

const PASSWORD_RULES = [
  { key: "min8", label: { fr: "Au moins 8 caractères", en: "At least 8 characters" } },
  { key: "uppercase", label: { fr: "Une lettre majuscule", en: "One uppercase letter" } },
  { key: "lowercase", label: { fr: "Une lettre minuscule", en: "One lowercase letter" } },
  { key: "number", label: { fr: "Un chiffre", en: "One number" } },
  { key: "special", label: { fr: "Un caractère spécial (!@#$...)", en: "One special character (!@#$...)" } },
];

function detectInputType(value: string): InputType {
  if (value.includes("@")) return "email";
  const cleaned = value.replace(/[\s\-()]/g, "");
  if (/^\+?\d{7,15}$/.test(cleaned)) return "phone";
  return null;
}

function getPasswordStrength(password: string): { score: number; errors: string[] } {
  const result = passwordSchema.safeParse(password);
  if (result.success) return { score: 100, errors: [] };

  const errors: string[] = [];
  if (password.length < 8) errors.push("min8");
  if (!/[A-Z]/.test(password)) errors.push("uppercase");
  if (!/[a-z]/.test(password)) errors.push("lowercase");
  if (!/[0-9]/.test(password)) errors.push("number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("special");

  const passed = 5 - errors.length;
  return { score: (passed / 5) * 100, errors };
}

function getStrengthColor(score: number): string {
  if (score <= 20) return "bg-red-500";
  if (score <= 40) return "bg-orange-500";
  if (score <= 60) return "bg-yellow-500";
  if (score <= 80) return "bg-lime-500";
  return "bg-green-500";
}

const Auth = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>("identifier");
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { translations, language } = useLanguage();
  const t = translations?.auth;

  const detectedType = useMemo(() => detectInputType(identifier), [identifier]);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep("identifier");
    setPassword("");
    setOtpCode("");
    setShowPassword(false);
  };

  const handleContinue = () => {
    if (detectedType === "email") {
      setStep("email_password");
    } else if (detectedType === "phone") {
      handlePhoneOtp();
    }
  };

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && passwordStrength.errors.length > 0) {
      toast({
        title: language === "fr" ? "Mot de passe trop faible" : "Password too weak",
        description: language === "fr"
          ? "Veuillez respecter tous les critères de sécurité."
          : "Please meet all security requirements.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: identifier, password });
        if (error) throw error;
        toast({
          title: language === "fr" ? "Compte créé !" : "Account created!",
          description: language === "fr"
            ? "Vérifiez votre email pour confirmer votre compte."
            : "Check your email to verify your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: identifier,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      setStep("email_magic_sent");
      toast({
        title: language === "fr" ? "Lien envoyé !" : "Link sent!",
        description: language === "fr"
          ? `Un lien de connexion a été envoyé à ${identifier}`
          : `A login link has been sent to ${identifier}`,
      });
    } catch (error: any) {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOtp = async () => {
    const cleaned = identifier.replace(/[\s\-()]/g, "");
    const phone = cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setStep("phone_otp_sent");
      toast({
        title: language === "fr" ? "Code envoyé !" : "Code sent!",
        description: language === "fr"
          ? `Un code de vérification a été envoyé au ${identifier}`
          : `A verification code has been sent to ${identifier}`,
      });
    } catch (error: any) {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleaned = identifier.replace(/[\s\-()]/g, "");
    const phone = cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: otpCode, type: "sms" });
      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      toast({
        title: language === "fr" ? "Erreur" : "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-light/30 to-white py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            className="mx-auto h-14 w-auto"
            src="/lovable-uploads/82389159-6492-4264-a7c0-37e526f8b3a4.png"
            alt="Kaia Kids"
          />
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">
              {step === "identifier" && (isSignUp
                ? (t?.createAccount || "Créer un compte")
                : (t?.signIn || "Se connecter")
              )}
              {step === "email_password" && (isSignUp
                ? (t?.createAccount || "Créer un compte")
                : (t?.signIn || "Se connecter")
              )}
              {step === "email_magic_sent" && (language === "fr" ? "Vérifiez votre email" : "Check your email")}
              {step === "phone_otp_sent" && (language === "fr" ? "Vérification" : "Verification")}
            </CardTitle>
            <CardDescription>
              {step === "identifier" && (language === "fr"
                ? "Entrez votre email ou numéro de téléphone"
                : "Enter your email or phone number"
              )}
              {step === "email_password" && identifier}
              {step === "email_magic_sent" && (language === "fr"
                ? `Cliquez sur le lien envoyé à ${identifier}`
                : `Click the link sent to ${identifier}`
              )}
              {step === "phone_otp_sent" && (language === "fr"
                ? `Entrez le code envoyé au ${identifier}`
                : `Enter the code sent to ${identifier}`
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Step 1: Identifier */}
            {step === "identifier" && (
              <div className="space-y-4">
                <Tabs defaultValue="signin" onValueChange={(v) => setIsSignUp(v === "signup")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">{t?.signIn || "Se connecter"}</TabsTrigger>
                    <TabsTrigger value="signup">{t?.signUp || "S'inscrire"}</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label>{language === "fr" ? "Email ou téléphone" : "Email or phone"}</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder={language === "fr" ? "nom@email.com ou +1 514..." : "name@email.com or +1 514..."}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="pl-10"
                        autoFocus
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {detectedType === "phone" ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                      </div>
                      {detectedType && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {detectedType === "email"
                              ? (language === "fr" ? "Email" : "Email")
                              : (language === "fr" ? "Téléphone" : "Phone")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleContinue}
                    disabled={!detectedType || loading}
                    className="w-full bg-primary hover:bg-primary-hover"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {language === "fr" ? "Continuer" : "Continue"}
                  </Button>

                  <div className="relative py-2">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      {language === "fr" ? "ou" : "or"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {language === "fr" ? "Continuer avec Google" : "Continue with Google"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2a: Email + Password */}
            {step === "email_password" && (
              <form onSubmit={handleEmailPassword} className="space-y-4">
                <button
                  type="button"
                  onClick={resetFlow}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {language === "fr" ? "Retour" : "Back"}
                </button>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    <Lock className="h-4 w-4 inline mr-1" />
                    {t?.password || "Mot de passe"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password strength indicator (sign up only) */}
                {isSignUp && password.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                          style={{ width: `${passwordStrength.score}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {passwordStrength.score <= 40
                          ? (language === "fr" ? "Faible" : "Weak")
                          : passwordStrength.score <= 80
                            ? (language === "fr" ? "Moyen" : "Medium")
                            : (language === "fr" ? "Fort" : "Strong")}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {PASSWORD_RULES.map((rule) => {
                        const passed = !passwordStrength.errors.includes(rule.key);
                        return (
                          <li
                            key={rule.key}
                            className={`flex items-center gap-2 text-xs transition-colors ${passed ? "text-green-600" : "text-muted-foreground"}`}
                          >
                            {passed
                              ? <Check className="h-3 w-3 text-green-600" />
                              : <X className="h-3 w-3 text-muted-foreground" />}
                            {rule.label[language as "fr" | "en"] || rule.label.fr}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSignUp ? (t?.createAccount || "Créer un compte") : (t?.signIn || "Se connecter")}
                </Button>

                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    {language === "fr" ? "ou" : "or"}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMagicLink}
                  disabled={loading}
                  className="w-full"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {language === "fr" ? "Recevoir un lien magique" : "Send me a magic link"}
                </Button>
              </form>
            )}

            {/* Step 2b: Magic Link Sent */}
            {step === "email_magic_sent" && (
              <div className="text-center space-y-6 py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === "fr"
                    ? "Nous avons envoyé un lien de connexion à votre adresse email. Cliquez dessus pour vous connecter instantanément."
                    : "We sent a login link to your email address. Click it to sign in instantly."}
                </p>
                <Button variant="outline" onClick={resetFlow} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {language === "fr" ? "Retour" : "Back"}
                </Button>
              </div>
            )}

            {/* Step 2c: Phone OTP Verification */}
            {step === "phone_otp_sent" && (
              <div className="space-y-6 py-2">
                <button
                  type="button"
                  onClick={resetFlow}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {language === "fr" ? "Retour" : "Back"}
                </button>

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length !== 6 || loading}
                  className="w-full bg-primary hover:bg-primary-hover"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === "fr" ? "Vérifier le code" : "Verify code"}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handlePhoneOtp}
                  disabled={loading}
                  className="w-full text-sm"
                >
                  {language === "fr" ? "Renvoyer le code" : "Resend code"}
                </Button>
              </div>
            )}

            {/* Toggle sign in / sign up (visible only on identifier step) */}
            {step === "identifier" && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                {isSignUp
                  ? (t?.alreadyHaveAccount || "Vous avez déjà un compte ? Connectez-vous")
                  : (t?.dontHaveAccount || "Vous n'avez pas de compte ? Inscrivez-vous")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
