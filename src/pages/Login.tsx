import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("Admin");
  const [password, setPassword] = useState("Admin");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [resetInfo, setResetInfo] = useState<null | "sent" | "error">(null);

  const resolveEmail = async (input: string): Promise<string | null> => {
    const val = String(input || "").trim();
    if (val.includes("@")) return val;
    if (!supabase) return null;
    const { data } = await supabase
      .from("user_aliases")
      .select("email")
      .eq("username", val)
      .limit(1)
      .maybeSingle();
    return (data?.email as string) || null;
  };

  const onReset = async () => {
    if (!email || !supabase) {
      toast({ title: "Informe seu usuário", description: "Digite seu usuário para recuperar a senha", variant: "destructive" });
      return;
    }
    const resolved = await resolveEmail(email);
    if (!resolved) {
      toast({ title: "Usuário não encontrado", description: "Não foi possível enviar o e-mail", variant: "destructive" });
      setResetInfo("error");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(resolved, { redirectTo: window.location.origin + "/login" });
    if (error) {
      toast({ title: "Falha ao enviar", description: error.message, variant: "destructive" });
      setResetInfo("error");
      return;
    }
    toast({ title: "Verifique seu e-mail", description: "Enviamos o link de recuperação" });
    setResetInfo("sent");
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!supabase) {
      toast({ title: "Configuração ausente", description: "Supabase não configurado" });
      return;
    }
    setLoading(true);
    try {
      const resolved = await resolveEmail(email);
      if (!resolved) {
        toast({ title: "Usuário não encontrado", description: "Verifique e tente novamente", variant: "destructive" });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: resolved, password });
      if (error) {
        toast({ title: "Falha no login", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Login realizado", description: "Bem-vindo" });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow">
        <h1 className="text-xl font-semibold mb-4">Entrar</h1>
        {!supabase && (
          <div className="mb-3 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
            Modo offline — autenticação indisponível. O sistema está liberado.
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Usuário</Label>
            <Input id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input id="password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required />
              <button type="button" aria-label="Mostrar senha" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw((v) => !v)}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Acessar"}
          </Button>
          <button type="button" onClick={onReset} className="w-full mt-2 text-sm text-muted-foreground hover:text-foreground underline">
            Esqueci minha senha
          </button>
          {resetInfo === "sent" && (
            <div className="mt-1 text-xs text-green-600">E-mail enviado. Verifique sua caixa de entrada.</div>
          )}
          {resetInfo === "error" && (
            <div className="mt-1 text-xs text-red-600">Não foi possível enviar. Tente novamente.</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
