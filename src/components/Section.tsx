import { ListingWithAnalysis } from "@/hooks/useListings";
import { ListingCard } from "./ListingCard";

export function Section({ title, subtitle, listings }: { title: string; subtitle?: string; listings: ListingWithAnalysis[] }) {
  if (listings.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="px-4">
        <h2 className="text-base font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="space-y-3 px-4">
        {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>
    </section>
  );
}