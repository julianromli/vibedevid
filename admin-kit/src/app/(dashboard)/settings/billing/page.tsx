import ContentSection from "../components/content-section"
import BillingForm from "./billing-form"

export default function SettingsBillingPage() {
  return (
    <ContentSection title="Billing" desc="Update your payment plan details.">
      <BillingForm />
    </ContentSection>
  )
}
