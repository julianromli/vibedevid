import ContentSection from "../components/content-section"
import ConnectAppForm from "./components/connect-app-form"

export default function SettingsConnectedAppsPage() {
  return (
    <ContentSection
      title="Connected Apps"
      desc="Manage and connect different applications."
    >
      <ConnectAppForm />
    </ContentSection>
  )
}
