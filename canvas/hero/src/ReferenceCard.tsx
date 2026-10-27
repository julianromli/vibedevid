import { ArrowUpRight } from "lucide-react";
import type { Reference } from "./references";

export function ReferenceCard({ reference }: { reference: Reference }) {
  return (
    <figure className="flex h-full flex-col">
      <img
        src={reference.image}
        alt={`Hero ${reference.app} di Mobbin`}
        className="aspect-[1200/825] w-full border-b border-border object-cover object-top"
      />
      <figcaption className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-lg font-semibold">{reference.app}</p>
          <a
            href={reference.mobbinUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            via Mobbin
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>
        <p className="text-base leading-snug text-pretty">{reference.takeaway}</p>
        <p className="mt-auto text-sm text-muted-foreground">
          Dipakai di varian {reference.usedBy.join(", ")}
        </p>
      </figcaption>
    </figure>
  );
}
