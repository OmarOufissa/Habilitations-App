import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  Plus,
  BarChart3,
  RefreshCw,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ isOpen, onOpenChange }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["employees"]);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      label: "Gestion des Employés",
      id: "employees",
      icon: Users,
      items: [
        { label: "Tous les Employés", path: "/employees", icon: Users },
        { label: "Ajouter un Employé", path: "/employees/add", icon: Plus },
      ],
    },
    {
      label: "Renouvellement",
      path: "/renewals",
      icon: RefreshCw,
    },
    {
      label: "Statistiques",
      path: "/stats",
      icon: BarChart3,
    },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative z-40 w-64 h-screen glass border-r border-white/20 flex flex-col transition-all duration-300 -translate-x-full md:translate-x-0",
          isOpen && "translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VH</span>
            </div>
            <span className="font-bold text-sm">Habilitations</span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-auto p-4 space-y-2">
          {navItems.map((item) => {
            if ("items" in item) {
              return (
                <Collapsible
                  key={item.id}
                  open={expandedItems.includes(item.id)}
                  onOpenChange={() => toggleExpanded(item.id)}
                >
                  <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        expandedItems.includes(item.id) && "rotate-180"
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-1 pl-4">
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200",
                          isActive(subItem.path)
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                            : "hover:bg-white/10 text-foreground"
                        )}
                      >
                        <subItem.icon className="w-4 h-4" />
                        <span>{subItem.label}</span>
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive(item.path)
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                    : "hover:bg-white/10 text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/20 text-xs text-muted-foreground">
          <p>v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
