"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { MarkdownEditor } from "@/components/markdown/MarkdownEditor"
import { LoadingSwap } from "@/components/LoadingSwap"
import { z } from "zod"
import { toast } from "sonner"
import { createJobListingApplication } from "../actions/actions"
import { newJobListingApplicationSchema } from "../actions/schemas"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/context/LanguageContext"

export function NewJobListingApplicationForm({
  jobListingId,
}: {
  jobListingId: string
}) {
  const { t } = useLanguage()
  const form = useForm({
    resolver: zodResolver(newJobListingApplicationSchema),
    defaultValues: { coverLetter: "" },
  })

  async function onSubmit(
    data: z.infer<typeof newJobListingApplicationSchema>
  ) {
    const results = await createJobListingApplication(jobListingId, data)

    if (results.error) {
      toast.error(results.message)
      return
    }

    toast.success(results.message)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          name="coverLetter"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("jobDetails.coverLetter")}</FormLabel>
              <FormControl>
                <MarkdownEditor {...field} markdown={field.value ?? ""} />
              </FormControl>
              <FormDescription>{t("jobDetails.optional")}</FormDescription>
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
            {t("jobDetails.apply")}
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}
