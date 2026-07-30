import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { redirect } from "next/navigation"
import { ReactNode, Suspense } from "react"
import { AppSidebar } from "@/components/sidebar/AppSidebar"
import { AppSidebarContentClient } from "./_AppSidebarContentClient"
import { SidebarUserButton } from "@/features/users/components/SidebarUserButton"
import { Loader2Icon } from "lucide-react"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <Loader2Icon className="size-24 animate-spin" />
        </div>
      }
    >
      <LayoutSuspense>{children}</LayoutSuspense>
    </Suspense>
  )
}

async function LayoutSuspense({ children }: { children: ReactNode }) {
  const { userId, user } = await getCurrentUser({ allData: true })

  if (userId == null) return redirect("/")
  if (user == null) return redirect("/onboarding")

  return (
    <AppSidebar
      content={<AppSidebarContentClient />}
      footerButton={<SidebarUserButton />}
    >
      {children}
    </AppSidebar>
  )
}
