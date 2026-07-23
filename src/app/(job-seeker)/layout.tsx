import { AppSidebar } from "@/components/sidebar/AppSidebar"
import { SidebarNavMenuGroup } from "@/components/sidebar/SidebarNavMenuGroup"
import { SidebarUserButton } from "@/features/users/components/SidebarUserButton"
import {
  BrainCircuitIcon,
  ClipboardListIcon,
  LayoutDashboard,
  LogInIcon,
  Sparkles,
} from "lucide-react"
import { ReactNode } from "react"

export default function JobSeekerLayout({
  children,
  sidebar,
}: {
  children: ReactNode
  sidebar: ReactNode
}) {
  return (
    <AppSidebar
      content={
        <>
          {sidebar}
          <SidebarNavMenuGroup
            className="mt-auto"
            items={[
              { href: "/", icon: <ClipboardListIcon />, label: "nav.jobBoard" },
              {
                href: "/app",
                icon: <Sparkles />,
                label: "nav.interviewPrep",
              },
              {
                href: "/ai-search",
                icon: <BrainCircuitIcon />,
                label: "nav.aiSearch",
              },
              {
                href: "/employer",
                icon: <LayoutDashboard />,
                label: "nav.employerDashboard",
                authStatus: "signedIn",
              },
              {
                href: "/sign-in",
                icon: <LogInIcon />,
                label: "nav.signIn",
                authStatus: "signedOut",
              },
            ]}
          />
        </>
      }
      footerButton={<SidebarUserButton />}
    >
      {children}
    </AppSidebar>
  )
}
