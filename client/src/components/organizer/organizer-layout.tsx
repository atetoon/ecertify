import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  CalendarDays,
  FileImage,
  Settings,
  LogOut,
} from "lucide-react"

import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import BranchedMenu from "@/components/ui/branched-menu"

interface OrganizerLayoutProps {
  children: React.ReactNode
  initialSidebarOpen?: boolean
  secondarySidebar?: React.ReactNode
}

function SidebarIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="2.5"
        width="17"
        height="17"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M8 3V19" stroke="currentColor" strokeWidth="1.5" />
      {open ? (
        <path
          d="M14 8.5L11.5 11L14 13.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M11.5 8.5L14 11L11.5 13.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

export default function OrganizerLayout({
  children,
  initialSidebarOpen = true,
  secondarySidebar,
}: OrganizerLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen)

  const menuItems = [
    {
      label: "Dashboard",
      value: "dashboard",
      icon: <LayoutDashboard className="h-[18px] w-[18px]" />,
    },
    {
      label: "Events",
      value: "events",
      icon: <CalendarDays className="h-[18px] w-[18px]" />,
    },
    {
      label: "Template",
      value: "template",
      icon: <FileImage className="h-[18px] w-[18px]" />,
    },
    {
      label: "Settings",
      value: "settings",
      icon: <Settings className="h-[18px] w-[18px]" />,
    },
  ]

  const handleNavigation = (value: string) => {
    if (value === "dashboard") {
      navigate("/dashboard")
      return
    }

    if (value === "events") {
      navigate("/events")
      return
    }

    if (value === "template") {
      navigate("/template")
      return
    }

    if (value === "settings") {
      navigate("/settings")
      return
    }
  }

  const isTemplatePage =
    location.pathname === "/template" ||
    location.pathname.startsWith("/template/")

  const isEventsWorkspace = location.pathname === "/events"

  const isEventPage =
    location.pathname.startsWith("/events/") ||
    location.pathname === "/event/new"

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-[#08080a] dark:text-zinc-100">
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-64",
          "border-r border-zinc-200 bg-white",
          "dark:border-zinc-800 dark:bg-[#0b0b0d]",
          "transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-24 items-center px-7">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="font-['Quicksand'] text-2xl font-bold tracking-tight"
          >
            eCERTIFY
          </button>
        </div>

        <div className="px-7 py-10">
          <div className="[--bm-theme-ink:#18181b] [--bm-theme-accent:#18181b] [--bm-theme-line:#d4d4d8] dark:[--bm-theme-ink:#f4f4f5] dark:[--bm-theme-accent:#ffffff] dark:[--bm-theme-line:#3f3f46]">
            <BranchedMenu
              key={location.pathname}
              items={menuItems}
              defaultActive={
                location.pathname.startsWith("/settings")
                  ? "settings"
                  : isTemplatePage
                    ? "template"
                    : isEventsWorkspace || isEventPage
                      ? "events"
                      : location.pathname === "/dashboard"
                        ? "dashboard"
                        : undefined
              }
              defaultOpen={-1}
              onSelect={handleNavigation}
              color="#18181b"
              accentColor="#18181b"
              lineColor="#d4d4d8"
              width={220}
              rowHeight={46}
              indent={34}
              trunk={10}
              radius={8}
              lineWidth={1.5}
              fontSize={16}
              drawDuration={300}
              foldDuration={250}
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-200 px-7 py-5 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {secondarySidebar && (
        <div
          className={[
            "fixed top-24 bottom-0 z-40",
            "transition-[left] duration-300 ease-in-out",
            sidebarOpen ? "left-64" : "left-0",
          ].join(" ")}
        >
          {secondarySidebar}
        </div>
      )}

      <div
        className={[
          "min-h-screen transition-[margin] duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-64" : "ml-0",
        ].join(" ")}
      >
        <header className="sticky top-0 z-30 flex h-24 items-center justify-between border-b border-zinc-200 bg-white/95 px-5 backdrop-blur sm:px-8 dark:border-zinc-800 dark:bg-[#08080a]/95">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              aria-label={
                sidebarOpen ? "Collapse sidebar" : "Expand sidebar"
              }
            >
              <SidebarIcon open={sidebarOpen} />
            </button>

            <p className="hidden text-xs font-medium uppercase tracking-[0.18em] text-zinc-400 sm:block">
              Organizer
            </p>
          </div>

          <ThemeSwitcher />
        </header>

        {children}
      </div>
    </div>
  )
}
