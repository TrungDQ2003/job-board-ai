"use client"

import { useLanguage } from "@/context/LanguageContext"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl hover:bg-accent cursor-pointer"
        >
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-xl border bg-card/60 backdrop-blur-md shadow-lg w-32"
      >
        <DropdownMenuItem
          onClick={() => setLanguage("vi")}
          className={`cursor-pointer rounded-lg mb-1 flex justify-between items-center ${
            language === "vi"
              ? "bg-accent text-accent-foreground font-semibold"
              : ""
          }`}
        >
          <span>Tiếng Việt</span>
          {language === "vi" && (
            <span className="text-xs text-primary font-bold">VI</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={`cursor-pointer rounded-lg flex justify-between items-center ${
            language === "en"
              ? "bg-accent text-accent-foreground font-semibold"
              : ""
          }`}
        >
          <span>English</span>
          {language === "en" && (
            <span className="text-xs text-primary font-bold">EN</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
