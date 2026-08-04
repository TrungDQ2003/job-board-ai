import { PricingTable } from "@/services/clerk/components/PricingTable"
import { getCurrentOrganization } from "@/services/clerk/lib/getCurrentAuth"

export default async function PricingPage() {
  const { organization } = await getCurrentOrganization({ allData: true })
  const currentPlan = (organization as { plan?: "starter" | "pro" | "enterprise" } | undefined)?.plan ?? "starter"

  return (
    <div className="flex items-center justify-center min-h-full p-4">
      <PricingTable currentPlan={currentPlan} />
    </div>
  )
}
