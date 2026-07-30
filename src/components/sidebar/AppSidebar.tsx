import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebarClient } from "./_AppSidebarClient"
import { ReactNode } from "react"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"

import { LanguageToggle } from "@/components/LanguageToggle"
import { ThemeToggle } from "@/components/ThemeToggle"

export async function AppSidebar({
  children,
  content,
  footerButton,
}: {
  children: ReactNode
  content: ReactNode
  footerButton: ReactNode
}) {
  const { userId } = await auth()

  return (
    <SidebarProvider className="overflow-y-hidden">
      <AppSidebarClient>
        <Sidebar collapsible="icon" className="overflow-hidden">
          <SidebarHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl text-nowrap font-bold hover:text-primary transition-colors cursor-pointer">Landr</span>
              </Link>
            </div>
            <div className="group-data-[state=collapsed]:hidden mr-1 flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </SidebarHeader>
          <SidebarContent>{content}</SidebarContent>
          {userId != null && (
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>{footerButton}</SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          )}
        </Sidebar>
        <main className="flex-1">{children}</main>
      </AppSidebarClient>
    </SidebarProvider>
  )
}
