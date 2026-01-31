import { IconBrandMastercard, IconBrandVisa } from "@tabler/icons-react"

const monthlyPlan = {
  label: "Monthly" as const,
  price: 49.99,
  content: "$49.99 / month",
  description: "Billed monthly",
  overview:
    "Experience all the core features with the flexibility of a monthly subscription. Stay up-to-date with the latest tools, receive ongoing support, and enjoy uninterrupted access to key functionalities designed to enhance your productivity.",
  features: [
    "Dedicated Account Manager",
    "Community Access & Forum Participation",
    "Customizable Settings & Preferences",
    "Regular Performance Reports",
  ],
  additionalResources: [
    "Mentorship Program",
    "Community Tutorials",
    "Access to Knowledge Base",
  ],
}

const annualPlan = {
  label: "Annual" as const,
  price: 499.99,
  content: "$41.40 / month",
  badge: "Save %100",
  description: "$499.99 yearly",
  overview:
    "Unlock maximum value and savings with our annual plan. Enjoy all the features of the Monthly plan plus exclusive benefits tailored for long-term users. Get priority access to new tools, enhanced support, and personalized assistance from a dedicated account manager to ensure you reach your goals with ease.",
  features: [
    "Dedicated Account Manager",
    "Community Access & Forum Participation",
    "Customizable Settings & Preferences",
    "Regular Performance Reports",
    "24/7 Availability & Support",
  ],
  additionalResources: [
    "Mentorship Program",
    "Community Tutorials",
    "Access to Knowledge Base",
    "Exclusive Workshops",
  ],
}

const lifetimesPlan = {
  label: "Lifeftimes" as const,
  content: "$899.99",
  price: 899.99,
  description: "1x Billed",
  overview:
    "Enjoy lifelong access to all features with a one-time payment. Get priority support, exclusive updates, and unlimited data storage – all without worrying about recurring fees. Maximize your value and future-proof your experience.",
  features: [
    "Unlimited Access To All Routes",
    "Advanced Progress Tracking",
    "Early Access To New Features",
    "Feedback-Driven Roadmap",
    "Enhanced Analytics & Insights",
    "Priority Bug Fixes & Support",
  ],
  additionalResources: [
    "Mentorship Program",
    "Community Tutorials",
    "Access to Knowledge Base",
    "Lifetime Exclusive Webinars",
  ],
}

export const plans = [monthlyPlan, annualPlan, lifetimesPlan]

export type Plan = (typeof plans)[number]
export type PlanType = Plan["label"]

export const getPlan = new Map<PlanType, Plan>([
  ["Monthly", monthlyPlan],
  ["Annual", annualPlan],
  ["Lifeftimes", lifetimesPlan],
])

export const paymentAcc = [
  {
    name: "Bobby Weelar",
    card: 88931789,
    type: "visa",
    icon: IconBrandVisa,
  },
  {
    name: "Bobby Weelar",
    card: 33249182,
    type: "mastercard",
    icon: IconBrandMastercard,
  },
] as const
