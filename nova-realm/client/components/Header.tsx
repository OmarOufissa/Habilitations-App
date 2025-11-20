import { Menu, LogOut, User, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedMode ? JSON.parse(savedMode) : prefersDark;

    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));

    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-white/20">
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">VH</span>
            </div>
            <h1 className="text-xl font-bold hidden sm:block gradient-text">
              Gestion Habilitations
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-lg hover:bg-white/10"
            title={isDarkMode ? "Mode clair" : "Mode sombre"}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg hover:bg-white/10"
              >
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                <span>Connecté</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
