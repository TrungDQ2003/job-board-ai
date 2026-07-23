import { cookies } from "next/headers"
import { translations } from "./translations"

export async function getServerTranslation() {
  const cookieStore = await cookies()
  const language = (cookieStore.get("lang")?.value || "vi") as "vi" | "en"

  const t = (keyPath: string): string => {
    const keys = keyPath.split(".")
    let current: any = translations[language]

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key]
      } else {
        return keyPath
      }
    }

    return typeof current === "string" ? current : keyPath
  }

  return { language, t }
}
