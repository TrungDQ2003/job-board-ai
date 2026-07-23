import { BackLink } from "@/components/BackLink"
import { Skeleton } from "@/components/Skeleton"
import { SuspendedItem } from "@/components/SuspendedItem"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@/drizzle/db"
import { JobInfoTable } from "@/drizzle/schema"
import { getJobInfoIdTag } from "@/features/jobInfos/dbCache"
import { formatExperienceLevel } from "@/features/jobInfos/lib/formatters"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { and, eq } from "drizzle-orm"
import { ArrowRightIcon } from "lucide-react"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getServerTranslation } from "@/lib/i18n/getServerTranslation"

export default async function JobInfoPage({
  params,
}: {
  params: Promise<{ jobInfoId: string }>
}) {
  const { jobInfoId } = await params
  const { t } = await getServerTranslation()

  const options = [
    {
      label: t("jobInfo.answerQuestions"),
      description: t("jobInfo.answerQuestionsDesc"),
      href: "questions",
    },
    {
      label: t("jobInfo.practiceInterview"),
      description: t("jobInfo.practiceInterviewDesc"),
      href: "interviews",
    },
    {
      label: t("jobInfo.refineResume"),
      description: t("jobInfo.refineResumeDesc"),
      href: "resume",
    },
    {
      label: t("jobInfo.updateJobDesc"),
      description: t("jobInfo.updateJobDescDesc"),
      href: "edit",
    },
  ]

  const jobInfo = getCurrentUser().then(
    async ({ userId, redirectToSignIn }) => {
      if (userId == null) return redirectToSignIn()

      const jobInfo = await getJobInfo(jobInfoId, userId)
      if (jobInfo == null) return notFound()

      return jobInfo
    }
  )

  return (
    <div className="container my-4 space-y-4">
      <BackLink href="/app">{t("jobInfo.dashboard")}</BackLink>

      <div className="space-y-6">
        <header className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl">
              <SuspendedItem
                item={jobInfo}
                fallback={<Skeleton className="w-48" />}
                result={j => j.name}
              />
            </h1>
            <div className="flex gap-2">
              <SuspendedItem
                item={jobInfo}
                fallback={<Skeleton className="w-12" />}
                result={j => (
                  <Badge variant="secondary">
                    {formatExperienceLevel(j.experienceLevel)}
                  </Badge>
                )}
              />
              <SuspendedItem
                item={jobInfo}
                fallback={null}
                result={j => {
                  return j.title && <Badge variant="secondary">{j.title}</Badge>
                }}
              />
            </div>
          </div>
          <p className="text-muted-foreground line-clamp-3">
            <SuspendedItem
              item={jobInfo}
              fallback={<Skeleton className="w-96" />}
              result={j => j.description}
            />
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 has-hover:*:not-hover:opacity-70">
          {options.map(option => (
            <Link
              className="hover:scale-[1.02] transition-[transform_opacity]"
              href={`/app/job-infos/${jobInfoId}/${option.href}`}
              key={option.href}
            >
              <Card className="h-full flex items-start justify-between flex-row">
                <CardHeader className="flex-grow">
                  <CardTitle>{option.label}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ArrowRightIcon className="size-6" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

async function getJobInfo(id: string, userId: string) {
  "use cache"
  cacheTag(getJobInfoIdTag(id))

  return db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
  })
}
