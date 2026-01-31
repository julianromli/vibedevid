import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export default function ContentSection({
  title,
  desc,
  children,
  className,
}: {
  title: string
  desc: string
  children: React.JSX.Element
  className?: string
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-none">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">{desc}</p>
      </div>
      <Separator className="mt-4 flex-none shadow-sm" />
      <ScrollArea className="faded-bottom -mx-4 flex-1 scroll-smooth px-4 md:pb-16">
        <div className={cn("-mx-1 px-1.5 pt-4 lg:max-w-xl", className)}>
          {children}
        </div>
      </ScrollArea>
    </div>
  )
}
