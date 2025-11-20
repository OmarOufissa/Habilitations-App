import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Identifiants invalides");
        toast({
          title: "Erreur de connexion",
          description: data.message || "Identifiants invalides",
          variant: "destructive",
        });
        return;
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans Gestion Habilitations",
      });

      navigate("/employees");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur de connexion";
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-cyan-50 dark:from-blue-950 dark:via-background dark:to-cyan-950 p-4">
      <div className="w-full max-w-md">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        {/* Login form */}
        <div className="relative glass p-8 space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">
              Gestion Habilitations
            </h1>
            <p className="text-muted-foreground">Connectez-vous à votre compte</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="glass bg-red-500/10 border-red-500/30 p-4 rounded-lg flex gap-3 animate-slide-in">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="glass-input pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="glass-input pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full glass-button py-3 font-semibold mt-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="text-center space-y-2 pt-4 border-t border-white/20">
            <p className="text-xs text-muted-foreground">Identifiants de démonstration:</p>
            <p className="text-xs font-mono bg-white/5 p-3 rounded-lg text-foreground">
              Email: admin@example.com<br />
              Mot de passe: admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
