import { NavLink } from "react-router-dom";
import { Home, List, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Hem", icon: Home },
  { to: "/listings", label: "Lista", icon: List },
  { to: "/watchlist", label: "Bevakade", icon: Heart },
];

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}