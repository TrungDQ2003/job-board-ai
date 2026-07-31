"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { JobInfoTable } from "@/drizzle/schema/jobInfo"
import { experienceLevels } from "@/drizzle/schema/constants"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { jobInfoSchema } from "../schemas"
import { formatExperienceLevel } from "../lib/formatters"
import { LoadingSwap } from "@/components/ui/loading-swap"
import { createJobInfo, updateJobInfo } from "../actions"
import { toast } from "sonner"
import { useLanguage } from "@/context/LanguageContext"

type JobInfoFormData = z.infer<typeof jobInfoSchema>

export function JobInfoForm({
  jobInfo,
}: {
  jobInfo?: Pick<
    typeof JobInfoTable.$inferSelect,
    "id" | "name" | "title" | "description" | "experienceLevel"
  >
}) {
  const { t } = useLanguage()
  const form = useForm<JobInfoFormData>({
    resolver: zodResolver(jobInfoSchema),
    defaultValues: jobInfo ?? {
      name: "",
      title: null,
      description: "",
      experienceLevel: "junior",
    },
  })

  async function onSubmit(values: JobInfoFormData) {
    const action = jobInfo
      ? updateJobInfo.bind(null, jobInfo.id)
      : createJobInfo
    const res = await action(values)

    if (res.error) {
      toast.error(res.message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("jobInfoForm.nameLabel")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                {t("jobInfoForm.nameDesc")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("jobInfoForm.titleLabel")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    onChange={e => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormDescription>
                  {t("jobInfoForm.titleDesc")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experienceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("jobInfoForm.experienceLabel")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {experienceLevels.map(level => (
                      <SelectItem key={level} value={level}>
                        {formatExperienceLevel(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("jobInfoForm.descLabel")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("jobInfoForm.descPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t("jobInfoForm.descDesc")}
              </FormDescription>
              <div className="text-xs text-muted-foreground/80 mt-2 p-3 bg-secondary/30 rounded-lg border border-border/50 select-none">
                {t("jobInfoForm.userGuideTip")}
              </div>
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
            {t("jobInfoForm.submitButton")}
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}
