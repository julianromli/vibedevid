import ContentSection from "../components/content-section"
import { AccountForm } from "./profile-form"

export default function SettingsProfilePage() {
  return (
    <ContentSection title="Profile" desc="Update your profile details.">
      <AccountForm />
    </ContentSection>
  )
}
