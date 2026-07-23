"use client"

import { OrganizationUserSettingsTable } from "@/drizzle/schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { LoadingSwap } from "@/components/LoadingSwap"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { organizationUserSettingsSchema } from "../actions/schemas"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RatingIcons } from "@/features/jobListingApplications/components/RatingIcons"
import { RATING_OPTIONS } from "@/features/jobListingApplications/data/constants"
import { updateOrganizationUserSettings } from "../actions/organizationUserSettingActions"
import { useLanguage } from "@/context/LanguageContext"

const ANY_VALUE = "any"

export function NotificationsForm({
  notificationSettings,
}: {
  notificationSettings?: Pick<
    typeof OrganizationUserSettingsTable.$inferSelect,
    "newApplicationEmailNotifications" | "minimumRating"
  >
}) {
  const { t } = useLanguage()

  const form = useForm({
    resolver: zodResolver(organizationUserSettingsSchema),
    defaultValues: notificationSettings ?? {
      minimumRating: null,
      newApplicationEmailNotifications: false,
    },
  })

  async function onSubmit(
    data: z.infer<typeof organizationUserSettingsSchema>
  ) {
    const result = await updateOrganizationUserSettings(data)

    if (result.error) {
      toast.error(result.message)
    } else {
      toast.success(result.message)
    }
  }

  const newApplicationEmailNotifications = form.watch(
    "newApplicationEmailNotifications"
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="border rounded-lg p-4 shadow-sm space-y-6">
          <FormField
            name="newApplicationEmailNotifications"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>{t("employer.dailyNotifications")}</FormLabel>
                    <FormDescription>
                      {t("employer.dailyNotificationsDesc")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
          {newApplicationEmailNotifications && (
            <FormField
              name="minimumRating"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("employer.minimumRating")}</FormLabel>
                  <Select
                    value={field.value ? field.value.toString() : ANY_VALUE}
                    onValueChange={val =>
                      field.onChange(val === ANY_VALUE ? null : parseInt(val))
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue asChild>
                          {field.value == null ? (
                            <span>{t("employer.anyRating")}</span>
                          ) : (
                            <RatingIcons
                              className="text-inherit"
                              rating={field.value}
                            />
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={ANY_VALUE}>{t("employer.anyRating")}</SelectItem>
                      {RATING_OPTIONS.filter(r => r != null).map(rating => (
                        <SelectItem key={rating} value={rating.toString()}>
                          <RatingIcons
                            className="text-inherit"
                            rating={rating}
                          />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("employer.notificationRatingDesc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            {t("employer.saveNotificationSettings")}
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}
