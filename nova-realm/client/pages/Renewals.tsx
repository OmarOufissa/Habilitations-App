import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Habilitation {
  id: number;
  employee_id: number;
  type: "HT" | "ST";
  codes: string[];
  numero: string | null;
  date_validation: string;
  date_expiration: string;
  pdf_path: string | null;
  employee: {
    matricule: string;
    nom: string;
    prenom: string;
  };
}

interface RenewalData {
  codes: string[];
  newValidationDate: string;
  newNumero: string;
}

const HT_CODES = ["H0V", "B0V", "H1V", "B1V", "H2V", "B2V", "HC", "BR", "BC"];
const ST_CODES = ["H1N", "H1T", "H2N", "H2T"];

export default function Renewals() {
  const { toast } = useToast();
  const [habilitations, setHabilitations] = useState<Habilitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewalData, setRenewalData] = useState<{
    [key: number]: RenewalData;
  }>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchExpiredHabilitations = async () => {
      try {
        const response = await fetch("/api/employees", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch data");

        const employees = await response.json();

        const today = new Date();
        const expired: Habilitation[] = [];

        employees.forEach((emp: any) => {
          if (emp.habilitations) {
            emp.habilitations.forEach((hab: any) => {
              const expDate = new Date(hab.date_expiration);
              if (expDate <= today) {
                expired.push({
                  ...hab,
                  employee: {
                    matricule: emp.matricule,
                    nom: emp.nom,
                    prenom: emp.prenom,
                  },
                });
              }
            });
          }
        });

        setHabilitations(expired);

        // Initialize renewal data
        const initData: { [key: number]: RenewalData } = {};
        expired.forEach((hab) => {
          initData[hab.id] = {
            codes: [...hab.codes],
            newValidationDate: "",
            newNumero: hab.numero || "",
          };
        });
        setRenewalData(initData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur de chargement";
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExpiredHabilitations();
  }, []);

  const getAvailableCodes = (type: "HT" | "ST") => {
    return type === "HT" ? HT_CODES : ST_CODES;
  };

  const handleCodeToggle = (habId: number, code: string) => {
    setRenewalData((prev) => {
      const hab = prev[habId];
      const codes = hab?.codes || [];
      const newCodes = codes.includes(code)
        ? codes.filter((c) => c !== code)
        : [...codes, code];
      return {
        ...prev,
        [habId]: {
          ...hab,
          codes: newCodes,
        },
      };
    });
  };

  const handleRenewal = async (hab: Habilitation) => {
    const data = renewalData[hab.id];
    if (!data?.newValidationDate) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date de validation",
        variant: "destructive",
      });
      return;
    }

    if (!data.codes || data.codes.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un code d'habilitation",
        variant: "destructive",
      });
      return;
    }

    setSavingId(hab.id);

    try {
      const response = await fetch(`/api/habilitations/${hab.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          codes: data.codes,
          numero: data.newNumero || hab.numero,
          date_validation: data.newValidationDate,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors du renouvellement");

      toast({
        title: "Habilitation renouvelée",
        description: "La date d'expiration a été mise à jour",
      });

      setHabilitations((prev) =>
        prev.filter((h) => h.id !== hab.id)
      );
      
      setEditingId(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du renouvellement";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Chargement des habilitations expirées...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            Renouvellement des Habilitations
          </h1>
          <p className="text-muted-foreground mt-1">
            {habilitations.length} habilitation(s) à renouveler
          </p>
        </div>

        {habilitations.length === 0 ? (
          <div className="glass p-8 rounded-xl text-center space-y-4">
            <div className="text-success text-4xl">✓</div>
            <h2 className="text-lg font-semibold">Aucune habilitation à renouveler</h2>
            <p className="text-muted-foreground">
              Toutes les habilitations sont à jour
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {habilitations.map((hab) => {
              const isEditing = editingId === hab.id;
              const data = renewalData[hab.id];
              const availableCodes = getAvailableCodes(hab.type);

              return (
                <div
                  key={hab.id}
                  className="glass p-6 rounded-xl space-y-4 border-l-4 border-red-500"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {hab.employee.nom} {hab.employee.prenom}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Matricule: {hab.employee.matricule}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="inline-block px-3 py-1 rounded-lg text-sm font-semibold bg-red-500/20 text-red-600 dark:text-red-400">
                          {hab.type}
                        </span>
                        <span className="inline-block px-3 py-1 rounded-lg text-sm text-muted-foreground bg-white/10">
                          Expiré le {new Date(hab.date_expiration).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isEditing ? (
                    <>
                      {/* Codes Display */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Codes d'habilitation:</p>
                        <div className="flex flex-wrap gap-2">
                          {hab.codes.map((code) => (
                            <span
                              key={code}
                              className="inline-block px-2 py-1 rounded text-xs font-mono bg-white/10"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Edit Button */}
                      <Button
                        onClick={() => setEditingId(hab.id)}
                        className="glass-button w-full gap-2 mt-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Renouveler
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4 pt-4 border-t border-white/20">
                      <h4 className="font-semibold text-sm">Renouveler l'habilitation</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`renewal-date-${hab.id}`}>
                            Nouvelle date de validation
                          </Label>
                          <Input
                            id={`renewal-date-${hab.id}`}
                            type="date"
                            value={data?.newValidationDate || ""}
                            onChange={(e) =>
                              setRenewalData((prev) => ({
                                ...prev,
                                [hab.id]: {
                                  ...prev[hab.id],
                                  newValidationDate: e.target.value,
                                },
                              }))
                            }
                            className="glass-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`renewal-numero-${hab.id}`}>
                            Nouveau N° de titre (optionnel)
                          </Label>
                          <Input
                            id={`renewal-numero-${hab.id}`}
                            type="text"
                            value={data?.newNumero || ""}
                            onChange={(e) =>
                              setRenewalData((prev) => ({
                                ...prev,
                                [hab.id]: {
                                  ...prev[hab.id],
                                  newNumero: e.target.value,
                                },
                              }))
                            }
                            className="glass-input"
                          />
                        </div>
                      </div>

                      {/* Codes Selection */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Codes d'habilitation</Label>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                          {availableCodes.map((code) => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => handleCodeToggle(hab.id, code)}
                              className={`px-3 py-2 rounded-lg text-sm font-mono transition-all ${
                                data?.codes?.includes(code)
                                  ? "bg-blue-500 text-white"
                                  : "bg-white/10 border border-white/20 text-muted-foreground hover:border-white/40"
                              }`}
                            >
                              {code}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => {
                            setEditingId(null);
                            setRenewalData((prev) => ({
                              ...prev,
                              [hab.id]: {
                                codes: [...hab.codes],
                                newValidationDate: "",
                                newNumero: hab.numero || "",
                              },
                            }));
                          }}
                          variant="outline"
                          className="rounded-lg"
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={() => handleRenewal(hab)}
                          disabled={savingId === hab.id}
                          className="glass-button gap-2 flex-1"
                        >
                          {savingId === hab.id ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Renouvellement...
                            </span>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              Renouveler
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
