import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Eye, Calendar, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Habilitation {
  id: number;
  type: "HT" | "ST";
  codes: string[];
  numero: string | null;
  date_validation: string;
  date_expiration: string;
}

interface Employee {
  id: number;
  matricule: string;
  prenom: string;
  nom: string;
  division: string;
  service: string;
  section: string;
  equipe: string;
  habilitations?: Habilitation[];
}

export default function Employees() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDivision, setFilterDivision] = useState("all");
  const [sortBy, setSortBy] = useState("matricule");

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/employees", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch employees");

        const data = await response.json();
        setEmployees(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors du chargement";
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Filter and sort employees
  const filtered = employees
    .filter((emp) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        emp.matricule.includes(searchLower) ||
        emp.prenom.toLowerCase().includes(searchLower) ||
        emp.nom.toLowerCase().includes(searchLower) ||
        emp.service.toLowerCase().includes(searchLower) ||
        emp.equipe.toLowerCase().includes(searchLower);

      const matchesDivision =
        filterDivision === "all" || emp.division === filterDivision;

      return matchesSearch && matchesDivision;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "matricule":
          return a.matricule.localeCompare(b.matricule);
        case "nom":
          return (a.nom + a.prenom).localeCompare(b.nom + b.prenom);
        default:
          return 0;
      }
    });

  const handleDelete = async (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${name} ?`)) return;

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete employee");

      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      toast({
        title: "Employé supprimé",
        description: `${name} a été supprimé avec succès`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la suppression";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    }
  };

  const getHabilitationStatus = (hab: Habilitation) => {
    const expDate = new Date(hab.date_expiration);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) return "expired";
    if (daysUntilExpiry <= 30) return "expiring-soon";
    return "valid";
  };

  const getLatestHabilitation = (habs?: Habilitation[]) => {
    if (!habs || habs.length === 0) return null;
    return habs.reduce((latest, current) =>
      new Date(current.date_expiration) > new Date(latest.date_expiration)
        ? current
        : latest
    );
  };

  const getDivisions = () => {
    const divs = new Set(employees.map((e) => e.division));
    return Array.from(divs).sort();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Chargement des employés...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              Gestion des Employés
            </h1>
            <p className="text-muted-foreground mt-1">
              {filtered.length} employé(s) trouvé(s)
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/employees/import">
              <Button variant="outline" className="gap-2 rounded-lg w-full sm:w-auto">
                <Upload className="w-4 h-4" />
                Importer
              </Button>
            </Link>
            <Link to="/employees/add">
              <Button className="glass-button gap-2 w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="glass p-6 rounded-xl space-y-4">
          <h3 className="font-semibold">Filtres et recherche</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Chercher par nom, matricule, service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input pl-10"
              />
            </div>

            <Select value={filterDivision} onValueChange={setFilterDivision}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les divisions</SelectItem>
                {getDivisions().map((div) => (
                  <SelectItem key={div} value={div}>
                    {div}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="matricule">Matricule</SelectItem>
                <SelectItem value="nom">Nom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="glass overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20 bg-white/5">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Matricule
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Nom Prénom
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Service
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Équipe
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-foreground">
                    N° Titre
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Validation
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Expiration
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <p className="text-muted-foreground">Aucun employé trouvé</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp) => {
                    const latestHab = getLatestHabilitation(emp.habilitations);
                    const status = latestHab ? getHabilitationStatus(latestHab) : null;

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-foreground">
                          {emp.matricule}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-foreground">
                            {emp.nom} {emp.prenom}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-muted-foreground">
                          {emp.service}
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-muted-foreground">
                          {emp.equipe}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-muted-foreground">
                          {latestHab?.numero || "—"}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm text-muted-foreground">
                          {latestHab ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(latestHab.date_validation).toLocaleDateString(
                                "fr-FR"
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-sm">
                          {latestHab ? (
                            <div
                              className={cn(
                                "flex items-center gap-1",
                                status === "expired"
                                  ? "text-red-600 dark:text-red-400"
                                  : status === "expiring-soon"
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-green-600 dark:text-green-400"
                              )}
                            >
                              <Calendar className="w-3 h-3" />
                              {new Date(latestHab.date_expiration).toLocaleDateString(
                                "fr-FR"
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-2">
                            <Link to={`/employees/${emp.id}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-lg hover:bg-blue-500/20"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link to={`/employees/${emp.id}/edit`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-lg hover:bg-blue-500/20"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-lg hover:bg-red-500/20"
                              onClick={(e) =>
                                handleDelete(
                                  emp.id,
                                  `${emp.nom} ${emp.prenom}`,
                                  e
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
