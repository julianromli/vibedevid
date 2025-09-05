"use client";
import Image from "next/image";
import React, { useEffect, useRef } from "react";

export const TestimonialsColumns = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const duration = props.duration || 10;
    element.style.animation = `scroll-up ${duration}s linear infinite`;
  }, [props.duration]);

  return (
    <div className={props.className}>
      <div
        ref={scrollRef}
        className="flex flex-col gap-6 pb-6 animate-scroll-up bg-transparent"
        style={{
          animationDuration: `${props.duration || 10}s`,
        }}>
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div
                  className="p-8 rounded-2xl border shadow-lg shadow-primary/5 max-w-xs w-full bg-background"
                  key={i}>
                  <div className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {text}
                  </div>
                  <div className="flex items-center gap-3">
                    <Image
                      width={40}
                      height={40}
                      src={image || "/placeholder.svg"}
                      alt={name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="flex flex-col">
                      <div className="font-semibold tracking-tight leading-5 text-sm">
                        {name}
                      </div>
                      <div className="leading-5 text-muted-foreground tracking-tight text-xs">
                        {role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </div>
    </div>
  );
};

const testimonials = [
  {
    text: "Hype Company transformed our startup idea into a $2M ARR SaaS platform. Their technical expertise and business understanding is unmatched.",
    image: "/professional-woman-dark-hair.png",
    name: "Sarah Chen",
    role: "TechFlow CEO",
  },
  {
    text: "Best development partner we've worked with. They think like founders, not just developers. Our product launched 3 months ahead of schedule.",
    image: "/hispanic-man-beard.png",
    name: "Marcus Rodriguez",
    role: "StartupLab Founder",
  },
  {
    text: "Clean code, on-time delivery, zero drama. Exactly what every startup needs. They built our MVP and it scaled to 100K users seamlessly.",
    image: "/blonde-woman-glasses.png",
    name: "Emma Thompson",
    role: "DigitalCore CTO",
  },
  {
    text: "They don't just build features, they build businesses. Our conversion rate doubled after their redesign and optimization work.",
    image: "/asian-man-short-hair.png",
    name: "David Kim",
    role: "InnovateLab VP",
  },
  {
    text: "Hype Company delivered a mobile app that exceeded all expectations. The user experience is flawless and performance is lightning fast.",
    image: "/placeholder.svg?height=40&width=40",
    name: "Lisa Park",
    role: "MobileFirst Founder",
  },
  {
    text: "Their full-stack expertise saved us months of development time. From backend architecture to pixel-perfect frontend, they delivered excellence.",
    image: "/placeholder.svg?height=40&width=40",
    name: "Alex Rivera",
    role: "CodeCraft CTO",
  },
  {
    text: "Working with Hype Company was a game-changer. They understood our vision and brought it to life with incredible attention to detail.",
    image: "/placeholder.svg?height=40&width=40",
    name: "Jennifer Walsh",
    role: "DesignHub CEO",
  },
  {
    text: "The team's ability to solve complex technical challenges while maintaining clean, scalable code is impressive. Highly recommend them.",
    image: "/placeholder.svg?height=40&width=40",
    name: "Michael Chang",
    role: "TechScale VP Engineering",
  },
  {
    text: "From concept to launch, Hype Company guided us through every step. Their expertise in modern web technologies is world-class.",
    image: "/placeholder.svg?height=40&width=40",
    name: "Rachel Green",
    role: "WebFlow Founder",
  },
  {
    text: "The AI integration they built for us increased our efficiency by 300%. Their understanding of cutting-edge technology is remarkable.",
    image: "/placeholder.svg?height=40&width=40",
    name: "James Wilson",
    role: "AI Ventures CEO",
  },
  {
    text: "Exceptional work on our e-commerce platform. Sales increased 150% within the first month after launch. Truly outstanding results.",
    image: "/placeholder.svg?height=40&width=40",
    name: "Sofia Martinez",
    role: "RetailTech Founder",
  },
  {
    text: "Their blockchain solution revolutionized our supply chain. The transparency and efficiency gains have been incredible for our business.",
    image: "/placeholder.svg?height=40&width=40",
    name: "Kwame Asante",
    role: "ChainLogic CTO",
  },
  {
    text: "Hype Company's design thinking approach resulted in a 40% increase in user engagement. They truly understand modern user experience.",
    image: "/placeholder.svg?height=40&width=40",
    name: "Zoe Anderson",
    role: "UXFlow Director",
  },
  {
    text: "The fintech app they developed for us passed all security audits with flying colors. Their attention to compliance and security is top-notch.",
    image: "/placeholder.svg?height=40&width=40",
    name: "Raj Patel",
    role: "FinSecure Founder",
  },
  {
    text: "Outstanding API development and integration work. They connected 15 different services seamlessly. True technical mastery.",
    image: "/placeholder.svg?height=40&width=40",
    name: "Aisha Johnson",
    role: "APIHub CTO",
  },
];
