import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { redirect } from "next/navigation"
import { ReactNode, Suspense } from "react"
import { Navbar } from "./_Navbar"
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
    <>
      <Navbar user={user} />
      {children}
    </>
  )
}
