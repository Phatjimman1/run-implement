import { ListingWithAnalysis } from "@/hooks/useListings";
import { ListingCard } from "./ListingCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function Section({ title, subtitle, listings }: { title: string; subtitle?: string; listings: ListingWithAnalysis[] }) {
  if (listings.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="px-4 sm:px-6">
        <h2 className="text-base font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="px-4 sm:px-6">
        <Carousel
          opts={{ align: "start", slidesToScroll: 1, containScroll: "trimSnaps" }}
          className="relative group/carousel"
        >
          <CarouselContent className="-ml-3">
            {listings.map((l) => (
              <CarouselItem
                key={l.id}
                className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <ListingCard listing={l} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            className="hidden sm:flex left-1 h-9 w-9 rounded-full border-border/60 bg-background/80 backdrop-blur-md text-foreground/70 shadow-[var(--shadow-card)] hover:bg-background hover:text-foreground hover:border-primary/40 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          />
          <CarouselNext
            className="hidden sm:flex right-1 h-9 w-9 rounded-full border-border/60 bg-background/80 backdrop-blur-md text-foreground/70 shadow-[var(--shadow-card)] hover:bg-background hover:text-foreground hover:border-primary/40 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          />
        </Carousel>
      </div>
    </section>
  );
}