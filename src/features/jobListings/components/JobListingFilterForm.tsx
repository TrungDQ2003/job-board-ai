"use client"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ExperienceLevel,
  experienceLevels,
  JobListingType,
  jobListingTypes,
  LocationRequirement,
  locationRequirements,
} from "@/drizzle/schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  formatExperienceLevel,
  formatJobType,
  formatLocationRequirement,
} from "../lib/formatters"
import { StateSelectItems } from "./StateSelectItems"
import { Button } from "@/components/ui/button"
import { LoadingSwap } from "@/components/LoadingSwap"
import { useLanguage } from "@/context/LanguageContext"
import { useSidebar } from "@/components/ui/sidebar"

const ANY_VALUE = "any"

const jobListingFilterSchema = z.object({
  title: z.string().optional(),
  city: z.string().optional(),
  stateAbbreviation: z.string().or(z.literal(ANY_VALUE)).optional(),
  experienceLevel: z.enum(experienceLevels).or(z.literal(ANY_VALUE)).optional(),
  type: z.enum(jobListingTypes).or(z.literal(ANY_VALUE)).optional(),
  locationRequirement: z
    .enum(locationRequirements)
    .or(z.literal(ANY_VALUE))
    .optional(),
})

export function JobListingFilterForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const { t } = useLanguage()

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

  const form = useForm({
    resolver: zodResolver(jobListingFilterSchema),
    defaultValues: {
      title: searchParams.get("title") ?? "",
      city: searchParams.get("city") ?? "",
      locationRequirement:
        (searchParams.get("locationRequirement") as LocationRequirement) ??
        ANY_VALUE,
      stateAbbreviation: searchParams.get("state") ?? ANY_VALUE,
      experienceLevel:
        (searchParams.get("experience") as ExperienceLevel) ?? ANY_VALUE,
      type: (searchParams.get("type") as JobListingType) ?? ANY_VALUE,
    },
  })

  function onSubmit(data: z.infer<typeof jobListingFilterSchema>) {
    const newParams = new URLSearchParams()

    if (data.city) newParams.set("city", data.city)
    if (data.stateAbbreviation && data.stateAbbreviation !== ANY_VALUE) {
      newParams.set("state", data.stateAbbreviation)
    }
    if (data.title) newParams.set("title", data.title)
    if (data.experienceLevel && data.experienceLevel !== ANY_VALUE) {
      newParams.set("experience", data.experienceLevel)
    }
    if (data.type && data.type !== ANY_VALUE) {
      newParams.set("type", data.type)
    }
    if (data.locationRequirement && data.locationRequirement !== ANY_VALUE) {
      newParams.set("locationRequirement", data.locationRequirement)
    }

    router.push(`${pathname}?${newParams.toString()}`)
    setOpenMobile(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          name="title"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("jobListings.jobTitle")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="locationRequirement"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("jobListings.locationRequirement")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ANY_VALUE}>{t("jobListings.any")}</SelectItem>
                  {locationRequirements.map(lr => (
                    <SelectItem key={lr} value={lr}>
                      {t(lrKeys[lr])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="city"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("jobListings.city")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="stateAbbreviation"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("jobListings.state")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ANY_VALUE}>{t("jobListings.any")}</SelectItem>
                  <StateSelectItems />
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="type"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("jobListings.jobType")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ANY_VALUE}>{t("jobListings.any")}</SelectItem>
                  {jobListingTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {t(typeKeys[type])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="experienceLevel"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("jobListings.experienceLevel")}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ANY_VALUE}>{t("jobListings.any")}</SelectItem>
                  {experienceLevels.map(experience => (
                    <SelectItem key={experience} value={experience}>
                      {t(expKeys[experience])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          disabled={form.formState.isSubmitting}
          type="submit"
          className="w-full"
        >
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            {t("jobListings.filter")}
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}
