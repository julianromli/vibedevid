import ContentSection from "../components/content-section"
import PlanDetail from "./plan-detail"

export default function SettingsPlansPage() {
  return (
    <ContentSection
      title="Plans"
      desc="Your subscriptions will beigin today with a free 14-day trial."
      className="lg:max-w-3xl"
    >
      <PlanDetail />
    </ContentSection>
  )
}
