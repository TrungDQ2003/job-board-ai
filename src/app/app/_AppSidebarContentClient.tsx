"use client"

import { useParams, usePathname } from "next/navigation"
import { useLanguage } from "@/context/LanguageContext"
import Link from "next/link"
import {
  BookOpenIcon,
  BrainCircuitIcon,
  FileSlidersIcon,
  SpeechIcon,
  Sparkles,
  ClipboardListIcon,
  LayoutDashboard,
  ChevronLeftIcon,
} from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SidebarNavMenuGroup } from "@/components/sidebar/SidebarNavMenuGroup"

const navLinks = [
  { name: "nav.interviews", href: "interviews", Icon: SpeechIcon },
  { name: "nav.questions", href: "questions", Icon: BookOpenIcon },
  { name: "nav.resume", href: "resume", Icon: FileSlidersIcon },
]

export function AppSidebarContentClient() {
  const { jobInfoId } = useParams()
  const pathname = usePathname()
  const { t } = useLanguage()

  const hasJobInfo = typeof jobInfoId === "string"

  return (
    <>
      {hasJobInfo && (
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.interviewPrep")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Back to Job Descriptions button */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/app" className="text-muted-foreground hover:text-foreground">
                    <ChevronLeftIcon />
                    <span>{t("nav.welcome")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {navLinks.map(({ name, href, Icon }) => {
                const hrefPath = `/app/job-infos/${jobInfoId}/${href}`
                // Active if the path matches or starts with the subpath
                const isActive = pathname === hrefPath || pathname.startsWith(hrefPath + "/")

                return (
                  <SidebarMenuItem key={name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={hrefPath}>
                        <Icon />
                        <span>{t(name)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      <SidebarNavMenuGroup
        className="mt-auto"
        items={[
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
            href: "/",
            icon: <ClipboardListIcon />,
            label: "nav.jobBoard",
          },
          {
            href: "/employer",
            icon: <LayoutDashboard />,
            label: "nav.employerDashboard",
            authStatus: "signedIn",
          },
        ]}
      />
    </>
  )
}
