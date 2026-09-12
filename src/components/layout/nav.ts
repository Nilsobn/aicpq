import {
  LayoutDashboard,
  Bot,
  SlidersHorizontal,
  Package,
  GitBranch,
  FileText,
  ScanSearch,
  Diff,
  FileStack,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export const appNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Assistent", href: "/assistent", icon: Bot },
  { title: "Konfigurator", href: "/konfigurator", icon: SlidersHorizontal },
  { title: "Produkte", href: "/produkte", icon: Package },
  { title: "Regeln", href: "/regeln", icon: GitBranch },
  { title: "Dokumente", href: "/dokumente", icon: FileText },
  { title: "KI-Prüfung", href: "/ki-pruefung", icon: ScanSearch },
  { title: "Änderungen", href: "/aenderungen", icon: Diff },
  { title: "Konfigurationen", href: "/konfigurationen", icon: FileStack },
  { title: "Suche", href: "/suche", icon: Search },
  { title: "Admin", href: "/admin", icon: Settings },
];
