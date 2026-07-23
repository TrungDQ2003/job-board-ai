import { Badge } from "@/components/ui/badge"
import { ExperienceLevel, JobListingTable, JobListingType, LocationRequirement } from "@/drizzle/schema"
import { cn } from "@/lib/utils"
import { ComponentProps } from "react"
import {
  formatExperienceLevel,
  formatJobListingLocation,
  formatJobType,
  formatLocationRequirement,
  formatWage,
} from "../lib/formatters"
import {
  BanknoteIcon,
  BuildingIcon,
  GraduationCapIcon,
  HourglassIcon,
  MapPinIcon,
} from "lucide-react"

const lrKeys: Record<LocationRequirement, string> = {
  "remote": "jobListings.remote",
  "in-office": "jobListings.inOffice",
  "hybrid": "jobListings.hybrid"
}
const typeKeys: Record<JobListingType, string> = {
  "full-time": "jobListings.fullTime",
  "part-time": "jobListings.partTime",
  "internship": "jobListings.internship"
}
const expKeys: Record<ExperienceLevel, string> = {
  "junior": "jobListings.junior",
  "mid-level": "jobListings.mid",
  "senior": "jobListings.senior"
}

export function JobListingBadges({
  jobListing: {
    wage,
    wageInterval,
    stateAbbreviation,
    city,
    type,
    experienceLevel,
    locationRequirement,
    isFeatured,
  },
  className,
  t,
}: {
  jobListing: Pick<
    typeof JobListingTable.$inferSelect,
    | "wage"
    | "wageInterval"
    | "stateAbbreviation"
    | "city"
    | "type"
    | "experienceLevel"
    | "locationRequirement"
    | "isFeatured"
  >
  className?: string
  t?: (keyPath: string) => string
}) {
  const badgeProps = {
    variant: "outline",
    className,
  } satisfies ComponentProps<typeof Badge>

  const translate = t || ((key: string) => {
    if (key === "jobListings.featured") return "Featured"
    if (key === "jobListings.none") return "None"
    if (key.startsWith("jobListings.")) {
      const parts = key.split(".")
      const subkey = parts[1]
      return subkey.charAt(0).toUpperCase() + subkey.slice(1)
    }
    return key
  })

  // Detect language based on translator output or default to 'vi' or 'en'
  const isVi = t ? t("jobListings.featured") === "Nổi bật" : false
  const language = isVi ? "vi" : "en"

  return (
    <>
      {isFeatured && (
        <Badge
          {...badgeProps}
          className={cn(
            className,
            "border-featured bg-featured/50 text-featured-foreground"
          )}
        >
          {translate("jobListings.featured")}
        </Badge>
      )}
      {wage != null && wageInterval != null && (
        <Badge {...badgeProps}>
          <BanknoteIcon />
          {formatWage(wage, wageInterval, language)}
        </Badge>
      )}
      {(stateAbbreviation != null || city != null) && (
        <Badge {...badgeProps}>
          <MapPinIcon className="size-10" />
          {formatJobListingLocation({ stateAbbreviation, city, t: translate })}
        </Badge>
      )}
      <Badge {...badgeProps}>
        <BuildingIcon />
        {translate(lrKeys[locationRequirement])}
      </Badge>
      <Badge {...badgeProps}>
        <HourglassIcon />
        {translate(typeKeys[type])}
      </Badge>
      <Badge {...badgeProps}>
        <GraduationCapIcon />
        {translate(expKeys[experienceLevel])}
      </Badge>
    </>
  )
}
