import ContentSection from "./components/content-section"
import GeneralForm from "./components/general-form"

export default function SettingsGeneralPage() {
  return (
    <ContentSection
      title="General"
      desc="Settings and options for your application."
      className="w-full lg:max-w-full"
    >
      <GeneralForm />
    </ContentSection>
  )
}
