import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function useIsDarkMode() {
  const { resolvedTheme } = useTheme()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(resolvedTheme === "dark")
  }, [resolvedTheme])

  return isDark
}
