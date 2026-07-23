import { Check, Sparkles } from "lucide-react"
import { useLanguage } from "@/context/LanguageContext"

export function PricingTable() {
  const { t, language } = useLanguage()

  const viFeatures = {
    starter: [
      "3 lượt tìm kiếm việc làm bằng AI",
      "1 lượt chấm điểm & tối ưu CV",
      "Tìm kiếm Bảng tin việc làm cơ bản",
    ],
    pro: [
      "Vô hạn lượt tìm kiếm việc làm bằng AI",
      "Vô hạn lượt phân tích & tối ưu CV",
      "Luyện phỏng vấn AI (Giọng nói & Văn bản)",
      "Nộp hồ sơ trực tiếp vào tin tuyển dụng VIP",
    ],
    enterprise: [
      "Bao gồm toàn bộ tính năng gói Chuyên nghiệp",
      "Mô hình AI cố vấn sự nghiệp 1-kèm-1",
      "Hỗ trợ ưu tiên & Trải nghiệm sớm tính năng mới",
    ],
  }

  const enFeatures = {
    starter: [
      "3 AI Job Search queries",
      "1 Resume optimization review",
      "Basic Job Board search",
    ],
    pro: [
      "Unlimited AI Job Search queries",
      "Unlimited Resume scan & optimization",
      "AI Interview Practice (Vocal & Text)",
      "Direct application to premium jobs",
    ],
    enterprise: [
      "Everything in Professional plan",
      "1-on-1 career coach AI model",
      "Priority support & early access",
    ],
  }

  const features = language === "vi" ? viFeatures : enFeatures

  return (
    <div className="py-8">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          {t("common.pricingTitle")}
        </h2>
        <p className="text-muted-foreground text-lg">
          {t("common.pricingDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <div className="relative rounded-2xl border border-border bg-card p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div>
            <h3 className="text-xl font-semibold mb-2">{t("common.starter")}</h3>
            <p className="text-muted-foreground text-sm mb-6">{t("common.starterDesc")}</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground text-sm">{t("common.month")}</span>
            </div>
            <ul className="space-y-4 text-sm text-muted-foreground">
              {features.starter.map((f, i) => (
                <li className="flex items-center gap-2" key={i}>
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <button className="mt-8 w-full py-2.5 px-4 rounded-xl font-medium border border-input bg-background hover:bg-accent text-accent-foreground transition-colors cursor-pointer text-center">
            {t("common.currentPlan")}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="relative rounded-2xl border-2 border-indigo-500 bg-card/60 backdrop-blur-md p-8 flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-semibold py-1 px-4 rounded-bl-xl flex items-center gap-1">
            <Sparkles className="size-3" /> {t("common.popular")}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{t("common.pro")}</h3>
            <p className="text-muted-foreground text-sm mb-6">{t("common.proDesc")}</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold">$29</span>
              <span className="text-muted-foreground text-sm">{t("common.month")}</span>
            </div>
            <ul className="space-y-4 text-sm">
              {features.pro.map((f, i) => (
                <li className="flex items-center gap-2" key={i}>
                  <Check className="size-4 text-indigo-500 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <button className="mt-8 w-full py-2.5 px-4 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer text-center">
            {t("common.upgradeNow")}
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className="relative rounded-2xl border border-border bg-card p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div>
            <h3 className="text-xl font-semibold mb-2">{t("common.enterprise")}</h3>
            <p className="text-muted-foreground text-sm mb-6">{t("common.enterpriseDesc")}</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold">$99</span>
              <span className="text-muted-foreground text-sm">{t("common.month")}</span>
            </div>
            <ul className="space-y-4 text-sm text-muted-foreground">
              {features.enterprise.map((f, i) => (
                <li className="flex items-center gap-2" key={i}>
                  <Check className="size-4 text-emerald-500 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <button className="mt-8 w-full py-2.5 px-4 rounded-xl font-medium border border-input bg-background hover:bg-accent text-accent-foreground transition-colors cursor-pointer text-center">
            {t("common.contactSales")}
          </button>
        </div>
      </div>
    </div>
  )
}
