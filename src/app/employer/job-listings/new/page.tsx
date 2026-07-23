import { Card, CardContent } from "@/components/ui/card"
import { JobListingForm } from "@/features/jobListings/components/JobListingForm"
import { getServerTranslation } from "@/lib/i18n/getServerTranslation"

export default async function NewJobListingPage() {
  const { t } = await getServerTranslation()

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">{t("employer.newJobListing")}</h1>
      <p className="text-muted-foreground mb-6">
        {t("jobListings.saveDraft")}
      </p>
      <Card>
        <CardContent>
          <JobListingForm />
        </CardContent>
      </Card>
    </div>
  )
}
