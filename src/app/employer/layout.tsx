import { AsyncIf } from "@/components/AsyncIf"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/sidebar/AppSidebar"
import { SidebarNavMenuGroup } from "@/components/sidebar/SidebarNavMenuGroup"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { db } from "@/drizzle/db"
import {
  JobListingApplicationTable,
  JobListingStatus,
  JobListingTable,
} from "@/drizzle/schema"
import { getJobListingApplicationJobListingTag } from "@/features/jobListingApplications/db/cache/jobListingApplications"
import { getJobListingOrganizationTag } from "@/features/jobListings/db/cache/jobListings"
import { sortJobListingsByStatus } from "@/features/jobListings/lib/utils"
import { SidebarOrganizationButton } from "@/features/organizations/components/SidebarOrganizationButton"
import { getCurrentOrganization } from "@/services/clerk/lib/getCurrentAuth"
import { hasOrgUserPermission } from "@/services/clerk/lib/orgUserPermissions"
import { count, desc, eq } from "drizzle-orm"
import { ClipboardListIcon, PlusIcon, Sparkles, BrainCircuitIcon } from "lucide-react"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ReactNode, Suspense } from "react"
import { JobListingMenuGroup } from "./_JobListingMenugroup"
import { getServerTranslation } from "@/lib/i18n/getServerTranslation"

export default function EmployerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <LayoutSuspense>{children}</LayoutSuspense>
    </Suspense>
  )
}

async function LayoutSuspense({ children }: { children: ReactNode }) {
  const { orgId, organization } = await getCurrentOrganization({ allData: true })
  if (orgId == null) return redirect("/organizations/select")

  const currentPlan = (organization as { plan?: string } | undefined)?.plan ?? "starter"

  const { t } = await getServerTranslation()

  return (
    <AppSidebar
      content={
        <>
          <SidebarGroup>
            <SidebarGroupLabel>{t("employer.jobListings")}</SidebarGroupLabel>
            <AsyncIf
              condition={() => hasOrgUserPermission("org:job_listings:create")}
            >
              <SidebarGroupAction title={t("employer.addJobListing")} asChild>
                <Link href="/employer/job-listings/new">
                  <PlusIcon /> <span className="sr-only">{t("employer.addJobListing")}</span>
                </Link>
              </SidebarGroupAction>
            </AsyncIf>
            <SidebarGroupContent className="group-data-[state=collapsed]:hidden">
              <Suspense>
                <JobListingMenu orgId={orgId} />
              </Suspense>
              {currentPlan === "starter" && (
                <div className="mt-6 px-3">
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold text-xs py-2 h-auto cursor-pointer">
                    <Link href="/employer/pricing">
                      <Sparkles className="mr-1.5 size-3.5" /> {t("employer.upgradePlan")}
                    </Link>
                  </Button>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarNavMenuGroup
            className="mt-auto"
            items={[
              { href: "/app", icon: <Sparkles />, label: t("nav.interviewPrep") },
              { href: "/ai-search", icon: <BrainCircuitIcon />, label: t("nav.aiSearch") },
              { href: "/", icon: <ClipboardListIcon />, label: t("employer.jobBoard") },
            ]}
          />
        </>
      }
      footerButton={<SidebarOrganizationButton />}
    >
      {children}
    </AppSidebar>
  )
}

async function JobListingMenu({ orgId }: { orgId: string }) {
  const jobListings = await getJobListings(orgId)
  const { t } = await getServerTranslation()

  if (
    jobListings.length === 0 &&
    (await hasOrgUserPermission("org:job_listings:create"))
  ) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/employer/job-listings/new">
              <PlusIcon />
              <span>{t("employer.createFirstJobListing")}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const grouped = jobListings.reduce((acc, j) => {
    if (!acc[j.status]) acc[j.status] = []
    acc[j.status].push(j)
    return acc
  }, {} as Record<JobListingStatus, typeof jobListings>)

  return Object.entries(grouped)
    .sort(([a], [b]) => {
      return sortJobListingsByStatus(
        a as JobListingStatus,
        b as JobListingStatus
      )
    })
    .map(([status, jobListings]) => (
      <JobListingMenuGroup
        key={status}
        status={status as JobListingStatus}
        jobListings={jobListings}
      />
    ))
}

async function getJobListings(orgId: string) {
  "use cache"
  cacheTag(getJobListingOrganizationTag(orgId))

  const data = await db
    .select({
      id: JobListingTable.id,
      title: JobListingTable.title,
      status: JobListingTable.status,
      applicationCount: count(JobListingApplicationTable.userId),
    })
    .from(JobListingTable)
    .where(eq(JobListingTable.organizationId, orgId))
    .leftJoin(
      JobListingApplicationTable,
      eq(JobListingTable.id, JobListingApplicationTable.jobListingId)
    )
    .groupBy(JobListingApplicationTable.jobListingId, JobListingTable.id)
    .orderBy(desc(JobListingTable.createdAt))

  data.forEach(jobListing => {
    cacheTag(getJobListingApplicationJobListingTag(jobListing.id))
  })

  return data
}
