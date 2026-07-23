import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { headers } from "next/headers"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@/drizzle/db"
import { JobInfoTable } from "@/drizzle/schema"
import { JobInfoForm } from "@/features/jobInfos/components/JobInfoForm"
import { getJobInfoUserTag } from "@/features/jobInfos/dbCache"
import { formatExperienceLevel } from "@/features/jobInfos/lib/formatters"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { desc, eq } from "drizzle-orm"
import { ArrowRightIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import Link from "next/link"
import { Suspense } from "react"

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen-header flex items-center justify-center">
          <Loader2Icon className="size-24 animate-spin" />
        </div>
      }
    >
      <JobInfos />
    </Suspense>
  )
}

import { getServerTranslation } from "@/lib/i18n/getServerTranslation"

async function JobInfos() {
  await headers()
  const { userId, redirectToSignIn } = await getCurrentUser()
  if (userId == null) return redirectToSignIn()

  const jobInfos = await getJobInfos(userId)

  if (jobInfos.length === 0) {
    return <NoJobInfos />
  }

  const { t } = await getServerTranslation()

  return (
    <div className="container my-4">
      <div className="flex gap-2 justify-between mb-6">
        <h1 className="text-3xl md:text-4xl lg:text-5xl">
          {t("common.selectJobDescription")}
        </h1>
        <Button asChild>
          <Link href="/app/job-infos/new">
            <PlusIcon />
            {t("common.createJobDescription")}
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 has-hover:*:not-hover:opacity-70">
        {jobInfos.map(jobInfo => (
          <Link
            className="hover:scale-[1.02] transition-[transform_opacity]"
            href={`/app/job-infos/${jobInfo.id}`}
            key={jobInfo.id}
          >
            <Card className="h-full">
              <div className="flex items-center justify-between h-full">
                <div className="space-y-4 h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{jobInfo.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground line-clamp-3">
                    {jobInfo.description}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Badge variant="outline">
                      {formatExperienceLevel(jobInfo.experienceLevel)}
                    </Badge>
                    {jobInfo.title && (
                      <Badge variant="outline">{jobInfo.title}</Badge>
                    )}
                  </CardFooter>
                </div>
                <CardContent>
                  <ArrowRightIcon className="size-6" />
                </CardContent>
              </div>
            </Card>
          </Link>
        ))}
        <Link className="transition-opacity" href="/app/job-infos/new">
          <Card className="h-full flex items-center justify-center border-dashed border-3 bg-transparent hover:border-primary/50 transition-colors shadow-none">
            <div className="text-lg flex items-center gap-2">
              <PlusIcon className="size-6" />
              {t("common.newJobDescription")}
            </div>
          </Card>
        </Link>
      </div>
    </div>
  )
}

async function NoJobInfos() {
  const { t } = await getServerTranslation()

  return (
    <div className="container my-4 max-w-5xl">
      <h1 className="text-3xl md:text-4xl lg:text-5xl mb-4">
        {t("common.welcome")}
      </h1>
      <p className="text-muted-foreground mb-8">
        {t("common.welcomeDesc")}
      </p>
      <Card>
        <CardContent>
          <JobInfoForm />
        </CardContent>
      </Card>
    </div>
  )
}

async function getJobInfos(userId: string) {
  "use cache"
  cacheTag(getJobInfoUserTag(userId))

  return db.query.JobInfoTable.findMany({
    where: eq(JobInfoTable.userId, userId),
    orderBy: desc(JobInfoTable.updatedAt),
  })
}
