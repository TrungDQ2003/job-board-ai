import { Suspense } from "react"
import {
  getCurrentOrganization,
  getCurrentUser,
} from "@/services/clerk/lib/getCurrentAuth"
import { SignOutButton } from "@/services/clerk/components/AuthButtons"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { LogOutIcon } from "lucide-react"
import { SidebarOrganizationButtonClient } from "./_SidebarOrganizationButtonClient"
import { getServerTranslation } from "@/lib/i18n/getServerTranslation"

export function SidebarOrganizationButton() {
  return (
    <Suspense>
      <SidebarOrganizationSuspense />
    </Suspense>
  )
}

async function SidebarOrganizationSuspense() {
  const [{ user }, { organization }] = await Promise.all([
    getCurrentUser({ allData: true }),
    getCurrentOrganization({ allData: true }),
  ])

  const { t } = await getServerTranslation()

  if (user == null || organization == null) {
    return (
      <SignOutButton>
        <SidebarMenuButton>
          <LogOutIcon />
          <span>{t("employer.logOut")}</span>
        </SidebarMenuButton>
      </SignOutButton>
    )
  }

  return (
    <SidebarOrganizationButtonClient user={user} organization={organization} />
  )
}
