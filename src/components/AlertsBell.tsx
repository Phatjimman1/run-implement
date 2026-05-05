import { Bell, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useAlerts } from "@/hooks/useAlerts";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { sv } from "date-fns/locale";

export function AlertsBell() {
  const { alerts, unreadCount, markAllRead, markRead, dismiss } = useAlerts();

  return (
    <Popover onOpenChange={(open) => { if (open && unreadCount > 0) markAllRead(); }}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="relative" aria-label="Notiser">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rec-red px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">Notiser</span>
          <span className="text-[11px] text-muted-foreground">{alerts.length} st</span>
        </div>
        <div className="max-h-[360px] overflow-y-auto">
          {alerts.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">Inga notiser ännu.</p>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "flex items-start gap-2 border-b border-border px-3 py-2.5 text-xs",
                  !a.read && "bg-primary/5"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 leading-snug">{a.message}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {a.type === "HIGH_VALUE" ? "🔥 High value" : "⏰ Slutar snart"} ·{" "}
                    {formatDistanceToNowStrict(new Date(a.triggered_at), { locale: sv, addSuffix: true })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button asChild size="icon" variant="ghost" className="h-6 w-6">
                    <a href={`/listings?focus=${a.listing_id}`} onClick={() => markRead(a.id)} aria-label="Visa">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => dismiss(a.id)} aria-label="Ta bort">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}