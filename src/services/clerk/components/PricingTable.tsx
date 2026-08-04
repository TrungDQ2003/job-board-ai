"use client"

import { Check, Sparkles, Loader2 as Loader2Icon } from "lucide-react"
import { useLanguage } from "@/context/LanguageContext"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { upgradeOrganizationPlan } from "@/features/organizations/actions/upgradePlan"

type Props = {
  currentPlan: "starter" | "pro" | "enterprise"
}

export function PricingTable({ currentPlan }: Props) {
  const { t, language } = useLanguage()
  const router = useRouter()

  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "enterprise" | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleUpgrade = async (plan: "starter" | "pro" | "enterprise") => {
    if (plan === currentPlan) return
    setSelectedPlan(plan)
    setIsProcessing(true)

    // Simulate standard sandbox payment processing for 2 seconds
    setTimeout(async () => {
      try {
        const res = await upgradeOrganizationPlan(plan)
        if (res.error) {
          toast.error(res.message || "Failed to upgrade organization plan")
          setIsProcessing(false)
          setSelectedPlan(null)
          return
        }

        setIsProcessing(false)
        setShowSuccess(true)
      } catch (err) {
        console.error(err)
        toast.error("An error occurred during payment processing simulation.")
        setIsProcessing(false)
        setSelectedPlan(null)
      }
    }, 2000)
  }

  const handleSuccessClose = () => {
    setShowSuccess(false)
    setSelectedPlan(null)
    router.refresh()
  }

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
    <div className="py-8 w-full max-w-6xl mx-auto px-4">
      {/* Mock Payment Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="relative mx-auto size-20 flex items-center justify-center bg-indigo-500/10 rounded-full">
              <Loader2Icon className="animate-spin size-10 text-indigo-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">
                {language === "vi" ? "Đang xử lý giao dịch..." : "Processing payment..."}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {language === "vi" 
                  ? "Vui lòng giữ kết nối. Chúng tôi đang thực hiện giao dịch giả lập qua cổng thanh toán Sandbox..." 
                  : "Please wait. We are processing your mock transaction via Sandbox payment gateway..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="relative mx-auto size-20 flex items-center justify-center bg-emerald-500/10 rounded-full">
              <Check className="size-10 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">
                {language === "vi" ? "Nâng cấp thành công!" : "Upgrade Successful!"}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {language === "vi" 
                  ? `Tổ chức của bạn đã được nâng cấp lên gói ${selectedPlan?.toUpperCase()} thành công và các giới hạn tính năng mới đã được mở khóa.` 
                  : `Your organization has been successfully upgraded to ${selectedPlan?.toUpperCase()} plan.`}
              </p>
            </div>
            <button 
              onClick={handleSuccessClose}
              className="w-full py-2.5 px-4 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer text-center"
            >
              {language === "vi" ? "Đồng ý" : "Done"}
            </button>
          </div>
        </div>
      )}

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
        <div className={`relative rounded-2xl border bg-card p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
          currentPlan === "starter" ? "border-emerald-500 shadow-emerald-500/5 shadow-md" : "border-border"
        }`}>
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
          <button 
            disabled={currentPlan === "starter" || isProcessing}
            onClick={() => handleUpgrade("starter")}
            className={`mt-8 w-full py-2.5 px-4 rounded-xl font-medium border transition-all duration-200 cursor-pointer text-center ${
              currentPlan === "starter" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 cursor-not-allowed" 
                : "border-input bg-background hover:bg-accent text-accent-foreground"
            }`}
          >
            {currentPlan === "starter" ? t("common.currentPlan") : (language === "vi" ? "Chuyển về gói Cơ bản" : "Downgrade to Starter")}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`relative rounded-2xl bg-card/60 backdrop-blur-md p-8 flex flex-col justify-between shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
          currentPlan === "pro" ? "border-2 border-emerald-500" : "border border-indigo-500"
        }`}>
          {currentPlan !== "pro" && (
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-semibold py-1 px-4 rounded-bl-xl flex items-center gap-1">
              <Sparkles className="size-3" /> {t("common.popular")}
            </div>
          )}
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
          <button 
            disabled={currentPlan === "pro" || isProcessing}
            onClick={() => handleUpgrade("pro")}
            className={`mt-8 w-full py-2.5 px-4 rounded-xl font-medium shadow-md transition-all duration-200 cursor-pointer text-center ${
              currentPlan === "pro"
                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-not-allowed shadow-none"
                : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg"
            }`}
          >
            {currentPlan === "pro" ? t("common.currentPlan") : t("common.upgradeNow")}
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className={`relative rounded-2xl border bg-card p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
          currentPlan === "enterprise" ? "border-emerald-500 shadow-emerald-500/5 shadow-md" : "border-border"
        }`}>
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
          <button 
            disabled={currentPlan === "enterprise" || isProcessing}
            onClick={() => handleUpgrade("enterprise")}
            className={`mt-8 w-full py-2.5 px-4 rounded-xl font-medium border transition-all duration-200 cursor-pointer text-center ${
              currentPlan === "enterprise"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 cursor-not-allowed"
                : "border-input bg-background hover:bg-accent text-accent-foreground"
            }`}
          >
            {currentPlan === "enterprise" ? t("common.currentPlan") : (language === "vi" ? "Nâng cấp ngay" : "Upgrade Now")}
          </button>
        </div>
      </div>
    </div>
  )
}
