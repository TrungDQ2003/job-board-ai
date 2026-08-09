"use client"

import { DataTable } from "@/components/dataTable/DataTable"
import { DataTableSortableColumnHeader } from "@/components/dataTable/DataTableSortableColumnHeader"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ApplicationStage,
  applicationStages,
  JobListingApplicationTable,
  UserResumeTable,
  UserTable,
} from "@/drizzle/schema"
import { ColumnDef, Table } from "@tanstack/react-table"
import { ReactNode, useOptimistic, useState, useTransition } from "react"
import { sortApplicationsByStage } from "../lib/utils"
import { StageIcon } from "./StageIcon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, MoreHorizontalIcon, Edit2Icon } from "lucide-react"
import { toast } from "sonner"
import {
  updateJobListingApplicationRating,
  updateJobListingApplicationStage,
} from "../actions/actions"
import { RatingIcons } from "./RatingIcons"
import { RATING_OPTIONS } from "../data/constants"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { DataTableFacetedFilter } from "@/components/dataTable/DataTableFacetedFilter"
import { useLanguage } from "@/context/LanguageContext"

type Application = Pick<
  typeof JobListingApplicationTable.$inferSelect,
  "createdAt" | "stage" | "rating" | "jobListingId"
> & {
  coverLetterMarkdown: ReactNode | null
  user: Pick<typeof UserTable.$inferSelect, "id" | "name" | "imageUrl"> & {
    resume:
      | (Pick<typeof UserResumeTable.$inferSelect, "resumeFileUrl"> & {
          markdownSummary: ReactNode | null
        })
      | null
  }
}

function getColumns(
  canUpdateRating: boolean,
  canUpdateStage: boolean,
  t: (key: string) => string
): ColumnDef<Application>[] {
  return [
    {
      accessorFn: row => row.user.name,
      header: t("employer.applicantName"),
      cell: ({ row }) => {
        const user = row.original.user

        const nameInitials = user.name
          .split(" ")
          .slice(0, 2)
          .map(name => name.charAt(0).toUpperCase())
          .join("")

        return (
          <div className="flex items-center gap-2">
            <Avatar className="rounded-full size-6">
              <AvatarImage src={user.imageUrl ?? undefined} alt={user.name} />
              <AvatarFallback className="uppercase bg-primary text-primary-foreground text-xs">
                {nameInitials}
              </AvatarFallback>
            </Avatar>
            <span>{user.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "stage",
      header: ({ column }) => (
        <DataTableSortableColumnHeader title={t("employer.applicantStage")} column={column} />
      ),
      sortingFn: ({ original: a }, { original: b }) => {
        return sortApplicationsByStage(a.stage, b.stage)
      },
      filterFn: ({ original }, _, value) => {
        return value.includes(original.stage)
      },
      cell: ({ row }) => (
        <StageCell
          canUpdate={canUpdateStage}
          stage={row.original.stage}
          jobListingId={row.original.jobListingId}
          userId={row.original.user.id}
        />
      ),
    },
    {
      accessorKey: "rating",
      header: ({ column }) => (
        <DataTableSortableColumnHeader title={t("employer.applicantRating")} column={column} />
      ),
      filterFn: ({ original }, _, value) => {
        return value.includes(original.rating)
      },
      cell: ({ row }) => (
        <RatingCell
          canUpdate={canUpdateRating}
          rating={row.original.rating}
          jobListingId={row.original.jobListingId}
          userId={row.original.user.id}
        />
      ),
    },
    {
      accessorKey: "createdAt",
      accessorFn: row => row.createdAt,
      header: ({ column }) => (
        <DataTableSortableColumnHeader title={t("employer.appliedOn")} column={column} />
      ),
      cell: ({ row }) => row.original.createdAt.toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const jobListing = row.original
        const resume = jobListing.user.resume

        return (
          <ActionCell
            coverLetterMarkdown={jobListing.coverLetterMarkdown}
            resumeMarkdown={resume?.markdownSummary}
            resumeUrl={resume?.resumeFileUrl}
            userName={jobListing.user.name}
          />
        )
      },
    },
  ]
}

export function SkeletonApplicationTable() {
  return (
    <ApplicationTable
      applications={[]}
      canUpdateRating={false}
      canUpdateStage={false}
      disableToolbar
      noResultsMessage={<LoadingSpinner className="size-12" />}
    />
  )
}

export function ApplicationTable({
  applications,
  canUpdateRating,
  canUpdateStage,
  noResultsMessage,
  disableToolbar = false,
}: {
  applications: Application[]
  canUpdateRating: boolean
  canUpdateStage: boolean
  noResultsMessage?: ReactNode
  disableToolbar?: boolean
}) {
  const { t } = useLanguage()
  const defaultNoResultsMessage = noResultsMessage ?? t("employer.noApplications")

  return (
    <DataTable
      data={applications}
      columns={getColumns(canUpdateRating, canUpdateStage, t)}
      noResultsMessage={defaultNoResultsMessage}
      ToolbarComponent={disableToolbar ? DisabledToolbar : Toolbar}
      initialFilters={[
        {
          id: "stage",
          value: applicationStages.filter(stage => stage !== "denied"),
        },
      ]}
    />
  )
}

function DisabledToolbar<T>({ table }: { table: Table<T> }) {
  return <Toolbar table={table} disabled />
}

function Toolbar<T>({
  table,
  disabled,
}: {
  table: Table<T>
  disabled?: boolean
}) {
  const hiddenRows = table.getCoreRowModel().rows.length - table.getRowCount()
  const { t } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      {table.getColumn("stage") && (
        <DataTableFacetedFilter
          disabled={disabled}
          column={table.getColumn("stage")}
          title={t("employer.applicantStage")}
          options={applicationStages
            .toSorted(sortApplicationsByStage)
            .map(stage => ({
              label: <StageDetails stage={stage} />,
              value: stage,
              key: stage,
            }))}
        />
      )}
      {table.getColumn("rating") && (
        <DataTableFacetedFilter
          disabled={disabled}
          column={table.getColumn("rating")}
          title={t("employer.applicantRating")}
          options={[
            {
              label: <RatingIcons rating={10} />,
              value: 10,
              key: "10",
            },
            {
              label: <RatingIcons rating={9} />,
              value: 9,
              key: "9",
            },
            {
              label: <RatingIcons rating={8} />,
              value: 8,
              key: "8",
            },
            {
              label: <RatingIcons rating={7} />,
              value: 7,
              key: "7",
            },
            {
              label: <RatingIcons rating={6} />,
              value: 6,
              key: "6",
            },
            {
              label: <RatingIcons rating={5} />,
              value: 5,
              key: "5",
            },
            {
              label: <RatingIcons rating={4} />,
              value: 4,
              key: "4",
            },
            {
              label: <RatingIcons rating={null} />,
              value: null,
              key: "null",
            },
          ]}
        />
      )}
      {hiddenRows > 0 && (
        <div className="text-sm text-muted-foreground ml-2">
          {hiddenRows} {hiddenRows > 1 ? t("employer.hiddenCount") : t("employer.hiddenCount")}
        </div>
      )}
    </div>
  )
}

function StageCell({
  stage,
  jobListingId,
  userId,
  canUpdate,
}: {
  stage: ApplicationStage
  jobListingId: string
  userId: string
  canUpdate: boolean
}) {
  const [optimisticStage, setOptimisticStage] = useOptimistic(stage)
  const [isPending, startTransition] = useTransition()

  if (!canUpdate) {
    return <StageDetails stage={optimisticStage} />
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("-ml-3", isPending && "opacity-50")}
        >
          <StageDetails stage={optimisticStage} />
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {applicationStages.toSorted(sortApplicationsByStage).map(stageValue => (
          <DropdownMenuItem
            key={stageValue}
            onClick={() => {
              startTransition(async () => {
                setOptimisticStage(stageValue)
                const res = await updateJobListingApplicationStage(
                  {
                    jobListingId,
                    userId,
                  },
                  stageValue
                )

                if (res?.error) {
                  toast.error(res.message)
                }
              })
            }}
          >
            <StageDetails stage={stageValue} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function RatingCell({
  rating,
  jobListingId,
  userId,
  canUpdate,
}: {
  rating: number | null
  jobListingId: string
  userId: string
  canUpdate: boolean
}) {
  const [optimisticRating, setOptimisticRating] = useOptimistic(rating)
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [customScore, setCustomScore] = useState<string>(
    rating != null ? rating.toString() : ""
  )
  const { t } = useLanguage()

  const handleUpdate = (newRating: number | null) => {
    startTransition(async () => {
      setOptimisticRating(newRating)
      setOpen(false)
      const res = await updateJobListingApplicationRating(
        {
          jobListingId,
          userId,
        },
        newRating
      )

      if (res?.error) {
        toast.error(res.message)
      } else {
        toast.success(
          newRating != null
            ? `Đã cập nhật điểm đánh giá: ${newRating}/10`
            : "Đã xóa điểm đánh giá"
        )
      }
    })
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(customScore, 10)
    if (isNaN(num) || num < 1 || num > 10) {
      toast.error("Vui lòng nhập điểm số hợp lệ từ 1 đến 10")
      return
    }
    handleUpdate(num)
  }

  if (!canUpdate) {
    return <RatingIcons rating={optimisticRating} />
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex items-center gap-1.5 p-1 rounded-md hover:bg-muted/60 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            isPending && "opacity-50"
          )}
        >
          <RatingIcons rating={optimisticRating} />
          <Edit2Icon className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4 space-y-4 shadow-xl border-border"
        align="start"
      >
        <div className="space-y-1">
          <h4 className="text-sm font-semibold tracking-tight">
            {t("employer.applicantRating") || "Đánh giá ứng viên (ATS Score)"}
          </h4>
          <p className="text-xs text-muted-foreground">
            Nhập điểm từ 1 đến 10 hoặc chọn nhanh mốc điểm phù hợp.
          </p>
        </div>

        {/* Quick presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Chọn nhanh:
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {[10, 9, 8, 7, 6, 5, 4, 2].map(score => (
              <Button
                key={score}
                type="button"
                variant={optimisticRating === score ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs font-medium"
                onClick={() => handleUpdate(score)}
              >
                {score}/10
              </Button>
            ))}
          </div>
        </div>

        {/* Custom input */}
        <form onSubmit={handleCustomSubmit} className="space-y-2 pt-2 border-t">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Tự nhập điểm (1 - 10):
          </span>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={10}
              step={1}
              placeholder="VD: 8"
              value={customScore}
              onChange={e => setCustomScore(e.target.value)}
              className="h-8 text-sm"
            />
            <Button type="submit" size="sm" className="h-8 text-xs shrink-0">
              Lưu điểm
            </Button>
          </div>
        </form>

        {/* Reset / Unrated */}
        {optimisticRating != null && (
          <div className="pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleUpdate(null)}
            >
              Đặt lại (Chưa đánh giá)
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function ActionCell({
  resumeUrl,
  userName,
  resumeMarkdown,
  coverLetterMarkdown,
}: {
  resumeUrl: string | null | undefined
  userName: string
  resumeMarkdown: ReactNode | null
  coverLetterMarkdown: ReactNode | null
}) {
  const [openModal, setOpenModal] = useState<"resume" | "coverLetter" | null>(
    null
  )
  const { t } = useLanguage()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <span className="sr-only">{t("employer.openMenu")}</span>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {resumeUrl != null || resumeMarkdown != null ? (
            <DropdownMenuItem onClick={() => setOpenModal("resume")}>
              {t("employer.viewResume")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuLabel className="text-muted-foreground">
              {t("employer.noResume")}
            </DropdownMenuLabel>
          )}
          {coverLetterMarkdown ? (
            <DropdownMenuItem onClick={() => setOpenModal("coverLetter")}>
              {t("employer.viewCoverLetter")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuLabel className="text-muted-foreground">
              {t("employer.noCoverLetter")}
            </DropdownMenuLabel>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {coverLetterMarkdown && (
        <Dialog
          open={openModal === "coverLetter"}
          onOpenChange={o => setOpenModal(o ? "coverLetter" : null)}
        >
          <DialogContent className="lg:max-w-5xl md:max-w-3xl max-h-[calc(100%-2rem)] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{t("employer.viewCoverLetter")}</DialogTitle>
              <DialogDescription>{userName}</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">{coverLetterMarkdown}</div>
          </DialogContent>
        </Dialog>
      )}
      {(resumeMarkdown || resumeUrl) && (
        <Dialog
          open={openModal === "resume"}
          onOpenChange={o => setOpenModal(o ? "resume" : null)}
        >
          <DialogContent className="lg:max-w-5xl md:max-w-3xl max-h-[calc(100%-2rem)] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{t("employer.viewResume")}</DialogTitle>
              <DialogDescription>{userName}</DialogDescription>
              {resumeUrl && (
                <Button asChild className="self-start">
                  <Link
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("employer.originalResume")}
                  </Link>
                </Button>
              )}
              <DialogDescription className="mt-2">
                {t("employer.aiSummaryDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">{resumeMarkdown}</div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

function StageDetails({ stage }: { stage: ApplicationStage }) {
  const { t } = useLanguage()
  const stageKeys: Record<ApplicationStage, string> = {
    applied: "employer.stageApplied",
    interested: "employer.stageInterested",
    denied: "employer.stageDenied",
    interviewed: "employer.stageInterviewed",
    hired: "employer.stageHired",
  }

  return (
    <div className="flex gap-2 items-center">
      <StageIcon stage={stage} className="size-5 text-inherit" />
      <div>{t(stageKeys[stage])}</div>
    </div>
  )
}
