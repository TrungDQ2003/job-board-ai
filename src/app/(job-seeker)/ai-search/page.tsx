import { AsyncIf } from "@/components/AsyncIf"
import { LoadingSwap } from "@/components/LoadingSwap"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { JobListingAiSearchForm } from "@/features/jobListings/components/JobListingAiSearchForm"
import { SignUpButton } from "@/services/clerk/components/AuthButtons"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentAuth"
import { getServerTranslation } from "@/lib/i18n/getServerTranslation"

export default async function AiSearchPage() {
  const { t } = await getServerTranslation()

  return (
    <div className="p-4 flex items-center justify-center min-h-full">
      <Card className="max-w-4xl">
        <AsyncIf
          condition={async () => {
            const { userId } = await getCurrentUser()
            return userId != null
          }}
          loadingFallback={
            <LoadingSwap isLoading>
              <AiCard t={t} />
            </LoadingSwap>
          }
          otherwise={<NoPermission t={t} />}
        >
          <AiCard t={t} />
        </AsyncIf>
      </Card>
    </div>
  )
}

function AiCard({ t }: { t: (keyPath: string) => string }) {
  return (
    <>
      <CardHeader>
        <CardTitle>{t("aiSearchPage.title")}</CardTitle>
        <CardDescription>
          {t("aiSearchPage.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <JobListingAiSearchForm />
      </CardContent>
    </>
  )
}

function NoPermission({ t }: { t: (keyPath: string) => string }) {
  return (
    <CardContent className="text-center">
      <h2 className="text-xl font-bold mb-1">{t("aiSearchPage.permissionDenied")}</h2>
      <p className="mb-4 text-muted-foreground">
        {t("aiSearchPage.needAccount")}
      </p>
      <SignUpButton />
    </CardContent>
  )
}
