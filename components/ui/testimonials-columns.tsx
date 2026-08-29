"use client";
import { Image } from "@unpic/react";
import React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/types/homepage";

export const TestimonialsColumns = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <div className={props.className}>
      <div
        className={cn(
          "flex flex-col gap-6 bg-transparent pb-6",
          !prefersReducedMotion &&
            "animate-scroll-up hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]",
        )}
        style={prefersReducedMotion ? undefined : { animationDuration: `${props.duration || 10}s` }}
      >
        {["first", "second"].map((loopKey) => (
          <React.Fragment key={loopKey}>
            {props.testimonials.map(({ text, image, name, role }, index) => (
              <div
                className="shadow-primary/5 bg-background w-full max-w-xs rounded-2xl border p-8 shadow-lg"
                key={`${loopKey}-${props.testimonials[index]?.id ?? name}-${index}`}
              >
                <div className="text-muted-foreground mb-4 text-sm leading-relaxed">{text}</div>
                <div className="flex items-center gap-3">
                  <Image
                    width={40}
                    height={40}
                    loading="lazy"
                    src={image || "/placeholder.svg"}
                    alt={name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <div className="text-sm leading-5 font-semibold tracking-tight">{name}</div>
                    <div className="text-muted-foreground text-xs leading-5 tracking-tight">
                      {role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
