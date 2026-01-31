import { Header } from "@/components/layout/header"

interface Props {
  children: React.ReactNode
}

export default function TasksLayout({ children }: Props) {
  return (
    <>
      <Header />

      <main id="main-content" className="flex min-h-min flex-1 flex-col p-4">
        {children}
      </main>
    </>
  )
}
