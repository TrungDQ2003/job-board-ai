import { cn } from "@/lib/utils"
import { SparklesIcon, ShieldAlertIcon, CheckCircle2Icon, HelpCircleIcon } from "lucide-react"

export function RatingIcons({
  rating,
  className,
  showIcon = true,
  unratedText = "Chưa đánh giá",
}: {
  rating: number | null
  className?: string
  showIcon?: boolean
  unratedText?: string
}) {
  if (rating == null || rating < 1 || rating > 10) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border/50",
          className
        )}
      >
        {showIcon && <HelpCircleIcon className="size-3.5 opacity-70" />}
        <span>{unratedText}</span>
      </span>
    )
  }

  // 8 - 10: Excellent / High Match
  if (rating >= 8) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs",
          className
        )}
      >
        {showIcon && <SparklesIcon className="size-3.5 text-emerald-500 fill-emerald-500/20" />}
        <span>{rating}/10</span>
        <span className="text-[10px] font-normal opacity-85 ml-0.5 hidden sm:inline">(Rất phù hợp)</span>
      </span>
    )
  }

  // 5 - 7: Good / Moderate Match
  if (rating >= 5) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs",
          className
        )}
      >
        {showIcon && <CheckCircle2Icon className="size-3.5 text-amber-500" />}
        <span>{rating}/10</span>
        <span className="text-[10px] font-normal opacity-85 ml-0.5 hidden sm:inline">(Đạt chuẩn)</span>
      </span>
    )
  }

  // 1 - 4: Low Match
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 shadow-xs",
        className
      )}
    >
      {showIcon && <ShieldAlertIcon className="size-3.5 text-rose-500" />}
      <span>{rating}/10</span>
      <span className="text-[10px] font-normal opacity-85 ml-0.5 hidden sm:inline">(Cần cân nhắc)</span>
    </span>
  )
}
