import { useEffect, useState } from "react"

import { useNavigate } from "react-router-dom"

import {

  LayoutDashboard,

  CalendarDays,

  FileImage,

  Settings,

  LogOut,

  Plus,

  UserCircle,

  Users,

  Award,

  ShieldCheck,

  ArrowUpRight,

  Clock3,

  UserPlus,

} from "lucide-react"



import { Button } from "@/components/ui/button"

import { ThemeSwitcher } from "@/components/ui/theme-switcher"

import BranchedMenu from "@/components/ui/branched-menu"



interface BackendEvent {
  id: string
  name: string
  slug: string
  description: string | null
  date: string
  organization: string
  status: "DRAFT" | "REGISTRATION_OPEN" | "COMPLETED"
  _count: {
    participants: number
    certificates: number
  }
}

interface DashboardEvent {
  id: string
  name: string
  date: string
  status: string
  participants: number
  certificates: number
  progress: number
}


const Dashboard = () => {

  const navigate = useNavigate()



  // Sidebar is open when the dashboard loads.

  // The same toggle works on desktop and mobile.

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [events, setEvents] = useState<DashboardEvent[]>([])
  const [stats, setStats] = useState({
  totalEvents: 0,
  totalParticipants: 0,
  totalCertificates: 0,
  verifiedCertificates: 0,
  revokedCertificates: 0,
})

const [organizerName, setOrganizerName] = useState("Organizer")

useEffect(() => {
  const loadOrganizer = () => {
    try {
      const storedOrganizer = localStorage.getItem("ecertify_organizer")

      if (!storedOrganizer) {
        setOrganizerName("Organizer")
        return
      }

      const organizer = JSON.parse(storedOrganizer)

      setOrganizerName(
        typeof organizer.name === "string" && organizer.name.trim()
          ? organizer.name.trim()
          : "Organizer",
      )
    } catch (error) {
      console.error("Unable to read organizer details:", error)
      setOrganizerName("Organizer")
    }
  }

  loadOrganizer()
  window.addEventListener("storage", loadOrganizer)

  return () => {
    window.removeEventListener("storage", loadOrganizer)
  }
}, [])

const [recentActivity, setRecentActivity] = useState<
  {
    type: string
    title: string
    description: string
    timestamp: string
  }[]
>([])

  const [loadingEvents, setLoadingEvents] = useState(true)
  const [eventsError, setEventsError] = useState("")

  const formatEventDate = (date: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(date))
  }

  const formatEventStatus = (status: BackendEvent["status"]) => {
    if (status === "REGISTRATION_OPEN") return "Registration Open"
    if (status === "COMPLETED") return "Completed"
    return "Draft"
  }

  const fetchEvents = async () => {
    const token = localStorage.getItem("ecertify_token")

    if (!token) {
      navigate("/login")
      return
    }

    try {
      setLoadingEvents(true)
      setEventsError("")

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem("ecertify_token")
        localStorage.removeItem("ecertify_organizer")
        navigate("/login")
        return
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch events")
      }

      const backendEvents: BackendEvent[] = data.events ?? []
      setStats(data.stats)
      setRecentActivity(data.recentActivity ?? [])

      setEvents(
        backendEvents.map((event) => ({
          id: event.id,
          name: event.name,
          date: formatEventDate(event.date),
          status: formatEventStatus(event.status),
          participants: event._count.participants,
          certificates: event._count.certificates,
          progress:
            event._count.participants > 0
              ? Math.round((event._count.certificates / event._count.participants) * 100)
              : 0,
        })),
      )
    } catch (error) {
      console.error("Fetch events error:", error)
      setEventsError(
        error instanceof Error ? error.message : "Unable to fetch events",
      )
    } finally {
      setLoadingEvents(false)
    }
  }

  useEffect(() => {
    void fetchEvents()
  }, [])




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
    const routes: Record<string, string> = {
      dashboard: "/dashboard",
      events: "/events",
      template: "/template",
      settings: "/settings",
    }

    const path = routes[value]

    if (!path) return

    navigate(path)

    // Close only on mobile.
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }


  return (

    <main className="min-h-screen bg-[#f4f4f5] text-zinc-950 dark:bg-[#08080a] dark:text-zinc-100">



      {/* =====================================================

          AMBIENT BACKGROUND

      ===================================================== */}



      <div className="pointer-events-none fixed inset-0 overflow-hidden">



        <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-zinc-300/20 blur-3xl dark:bg-zinc-700/10" />



        <div className="absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-zinc-300/20 blur-3xl dark:bg-zinc-700/10" />



        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-white/40 blur-3xl dark:bg-zinc-800/10" />



      </div>





      {/* =====================================================

          MOBILE OVERLAY

      ===================================================== */}



      {sidebarOpen && (

        <div

          className="

            fixed

            inset-0

            z-40

            bg-black/50

            backdrop-blur-sm



            lg:hidden

          "

          onClick={() => setSidebarOpen(false)}

        />

      )}





      {/* =====================================================

          SIDEBAR

      ===================================================== */}



      <aside

        className={`

          fixed

          inset-y-0

          left-0

          z-50



          flex

          w-64

          flex-col



          border-r

          border-zinc-200/80



          bg-white/95

          backdrop-blur-xl



          transition-transform

          duration-300

          ease-in-out



          dark:border-zinc-800/80

          dark:bg-[#0d0d10]/95



          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}

        `}

      >



        {/* Logo */}



        <div

          className="

            flex

            h-24

            shrink-0

            items-center

            justify-between



            border-b

            border-zinc-200/80



            px-7



            dark:border-zinc-800/80

          "

        >



          <button

            type="button"

            onClick={() => navigate("/dashboard")}

            className="

              font-['Quicksand']

              text-2xl

              font-bold

              tracking-tight

            "

          >

            eCERTIFY

          </button>



          {/* Close button on mobile */}



          <button

            type="button"

            onClick={() => setSidebarOpen(false)}

            className="

              flex

              h-9

              w-9

              items-center

              justify-center

              rounded-lg



              text-zinc-500



              transition-colors



              hover:bg-zinc-100

              hover:text-zinc-900



              dark:text-zinc-400

              dark:hover:bg-zinc-900

              dark:hover:text-zinc-100



              lg:hidden

            "

            aria-label="Close sidebar"

          >

            <SidebarIcon open />

          </button>



        </div>





        {/* Branched Menu */}



        <div className="flex-1 px-7 py-10">



          <div

            className="

              [--bm-theme-ink:#18181b]

              [--bm-theme-accent:#18181b]

              [--bm-theme-line:#d4d4d8]



              dark:[--bm-theme-ink:#f4f4f5]

              dark:[--bm-theme-accent:#ffffff]

              dark:[--bm-theme-line:#3f3f46]

            "

          >



            <BranchedMenu

              items={menuItems}

              defaultActive="dashboard"

              defaultOpen={-1}

              onSelect={handleNavigation}

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





        {/* Logout */}



        <div

          className="

            shrink-0



            border-t

            border-zinc-200/80



            px-5

            py-5



            dark:border-zinc-800/80

          "

        >



          <button

            type="button"

            onClick={() => navigate("/login")}

            className="

              flex

              w-full

              items-center

              gap-3



              rounded-xl



              px-4

              py-3



              text-sm

              font-medium

              text-zinc-500



              transition-colors



              hover:bg-zinc-100

              hover:text-zinc-950



              dark:text-zinc-400

              dark:hover:bg-zinc-900

              dark:hover:text-white

            "

          >

            <LogOut className="h-[18px] w-[18px]" />



            Logout

          </button>



        </div>



      </aside>





      {/* =====================================================

          MAIN CONTENT



          Sidebar open  -> margin-left 256px

          Sidebar closed -> margin-left 0



          This prevents content from ever being hidden

          underneath the sidebar.

      ===================================================== */}



      <div

        className={`

          relative

          min-h-screen



          transition-[margin]

          duration-300

          ease-in-out



          ${sidebarOpen ? "lg:ml-64" : "lg:ml-0"}

        `}

      >



        {/* ===================================================

            HEADER

        =================================================== */}



        <header

          className="

            sticky

            top-0

            z-30



            flex

            h-24

            items-center



            border-b

            border-zinc-200/80



            bg-[#f4f4f5]/80



            px-5

            backdrop-blur-xl



            sm:px-8



            dark:border-zinc-800/80

            dark:bg-[#08080a]/80

          "

        >



          {/* ALWAYS VISIBLE SIDEBAR TOGGLE */}



          <button

            type="button"

            onClick={() => setSidebarOpen((open) => !open)}

            className="

              flex

              h-9

              w-9

              items-center

              justify-center



              rounded-lg



              text-zinc-500



              transition-colors



              hover:bg-zinc-200

              hover:text-zinc-900



              dark:text-zinc-400

              dark:hover:bg-zinc-900

              dark:hover:text-zinc-100

            "

            aria-label={

              sidebarOpen

                ? "Collapse sidebar"

                : "Open sidebar"

            }

          >

            <SidebarIcon open={sidebarOpen} />

          </button>





          <div className="flex-1" />





          {/* Profile */}



          <button

            type="button"

            className="

              flex

              items-center

              gap-3



              rounded-xl



              px-2

              py-1.5



              transition-colors



              hover:bg-zinc-200

              dark:hover:bg-zinc-900

            "

          >



            <div

              className="

                flex

                h-9

                w-9

                items-center

                justify-center



                rounded-full



                border

                border-zinc-300



                bg-white



                dark:border-zinc-700

                dark:bg-zinc-900

              "

            >

              <UserCircle className="h-5 w-5" />

            </div>



            <span className="hidden text-sm font-medium sm:block">

              {organizerName}

            </span>



          </button>





          {/* Theme switcher */}



          <div className="ml-3">

            <ThemeSwitcher />

          </div>



        </header>





        {/* ===================================================

            CONTENT

        =================================================== */}



        <div

          className="

            mx-auto

            w-full

            max-w-[1600px]



            px-5

            py-10



            sm:px-8

            lg:px-10

            xl:px-12

          "

        >



          {/* =================================================

              GREETING

          ================================================= */}



          <section>



            <p

              className="

                text-xs

                font-semibold

                uppercase

                tracking-[0.2em]

                text-muted-foreground

              "

            >

              Organizer Dashboard

            </p>



            <h1

              className="

                mt-2

                font-['Quicksand']

                text-3xl

                font-bold

                tracking-tight



                sm:text-4xl

              "

            >

              {new Date().getHours() < 12
                ? "Good morning"
                : new Date().getHours() < 17
                  ? "Good afternoon"
                  : "Good evening"}
              , {organizerName}.

            </h1>



            <p

              className="

                mt-2

                max-w-xl

                text-sm

                leading-6

                text-muted-foreground

              "

            >

              Keep track of your events, participants and

              certificates from one place.

            </p>



          </section>





          {/* =================================================

              STATS

          ================================================= */}



          <section

            className="

              mt-9

              grid

              gap-4



              sm:grid-cols-2

              xl:grid-cols-4

            "

          >



            <StatCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Total Events"
              value={stats.totalEvents.toLocaleString()}
              note="Across your workspace"
            />

            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Participants"
              value={stats.totalParticipants.toLocaleString()}
              note="Total registrations"
            />

            <StatCard
              icon={<Award className="h-5 w-5" />}
              label="Certificates Issued"
              value={stats.totalCertificates.toLocaleString()}
              note="Certificates generated"
            />

            <StatCard
              icon={<ShieldCheck className="h-5 w-5" />}
              label="Certificates Verified"
              value={stats.verifiedCertificates.toLocaleString()}
              note="Publicly verified"
            />



          </section>





          {/* =================================================

              EVENTS

          ================================================= */}



          <section className="mt-12">



            <div className="flex items-end justify-between">



              <div>



                <p

                  className="

                    text-xs

                    font-semibold

                    uppercase

                    tracking-[0.2em]

                    text-muted-foreground

                  "

                >

                  Workspace

                </p>



                <h2

                  className="

                    mt-1

                    font-['Quicksand']

                    text-2xl

                    font-bold

                  "

                >

                  Your Events

                </h2>



              </div>





              <Button

                type="button"

                onClick={() => navigate("/event/new")}

                className="gap-2 rounded-xl"

              >



                <Plus className="h-4 w-4" />



                <span className="hidden sm:inline">

                  Create Event

                </span>



              </Button>



            </div>





            <div

              className="

                mt-6

                grid

                gap-5



                md:grid-cols-2

                xl:grid-cols-3

              "

            >



              {loadingEvents ? (
                <div className="md:col-span-2 xl:col-span-3 rounded-[28px] border border-zinc-200 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm text-muted-foreground">Loading your events...</p>
                </div>
              ) : eventsError ? (
                <div className="md:col-span-2 xl:col-span-3 rounded-[28px] border border-red-200 bg-red-50 p-10 text-center shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
                  <p className="text-sm text-red-600 dark:text-red-400">{eventsError}</p>
                  <button type="button" onClick={() => void fetchEvents()} className="mt-4 text-sm font-medium underline underline-offset-4">Try again</button>
                </div>
              ) : events.length === 0 ? (
                <div className="md:col-span-2 xl:col-span-3 rounded-[28px] border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="font-['Quicksand'] text-lg font-semibold">No events yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">Create your first event to get started.</p>
                  <Button type="button" onClick={() => navigate("/event/new")} className="mt-5 rounded-xl">Create Event</Button>
                </div>
              ) : (
                events.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={index}
                    onClick={() => navigate(`/events/${event.id}`)}
                  />
                ))
              )}



            </div>



          </section>





          {/* =================================================

              ACTIVITY + CERTIFICATE OVERVIEW

          ================================================= */}



          <section

            className="

              mt-8

              grid

              gap-5



              lg:grid-cols-[1.5fr_1fr]

            "

          >



            {/* Recent Activity */}



            <div

              className="

                rounded-[28px]



                border

                border-zinc-200



                bg-gradient-to-br

                from-white

                via-white

                to-zinc-100



                p-6

                shadow-sm



                dark:border-zinc-800

                dark:from-zinc-900

                dark:via-zinc-900

                dark:to-zinc-950

              "

            >



              <div className="flex items-center justify-between">



                <div>



                  <p

                    className="

                      text-xs

                      font-semibold

                      uppercase

                      tracking-[0.2em]

                      text-muted-foreground

                    "

                  >

                    Activity

                  </p>



                  <h2

                    className="

                      mt-1

                      font-['Quicksand']

                      text-xl

                      font-bold

                    "

                  >

                    Recent Activity

                  </h2>



                </div>





                <div

                  className="

                    flex

                    h-9

                    w-9

                    items-center

                    justify-center



                    rounded-xl



                    border

                    border-zinc-200



                    bg-zinc-100

                    text-zinc-600



                    dark:border-zinc-700

                    dark:bg-zinc-800

                    dark:text-zinc-300

                  "

                >

                  <Clock3 className="h-4 w-4" />

                </div>



              </div>





              <div

                className="

                  mt-6

                  divide-y

                  divide-zinc-200



                  dark:divide-zinc-800

                "

              >



                {recentActivity.map((activity) => {



                  const Icon =
                    activity.type === "registration"
                      ? UserPlus
                      : activity.type === "certificate_verified"
                        ? ShieldCheck
                        : Award

                  const time = new Intl.RelativeTimeFormat("en", {
                    numeric: "auto",
                  }).format(
                    Math.round(
                      (new Date(activity.timestamp).getTime() - Date.now()) / 60000,
                    ),
                    "minute",
                  )



                  return (

                    <div

                      key={activity.title}

                      className="

                        flex

                        items-center

                        gap-4

                        py-4



                        first:pt-0

                        last:pb-0

                      "

                    >



                      <div

                        className="

                          flex

                          h-10

                          w-10

                          shrink-0

                          items-center

                          justify-center



                          rounded-xl



                          border

                          border-zinc-200



                          bg-zinc-100

                          text-zinc-600



                          dark:border-zinc-700

                          dark:bg-zinc-800

                          dark:text-zinc-300

                        "

                      >

                        <Icon className="h-4 w-4" />

                      </div>





                      <div className="min-w-0 flex-1">



                        <p className="text-sm font-semibold">

                          {activity.title}

                        </p>



                        <p

                          className="

                            mt-0.5

                            truncate

                            text-xs

                            text-muted-foreground

                          "

                        >

                          {activity.description}

                        </p>



                      </div>





                      <span

                        className="

                          shrink-0

                          text-xs

                          text-muted-foreground

                        "

                      >

                        {time}

                      </span>



                    </div>

                  )

                })}



              </div>



            </div>





            {/* Certificate Overview */}



            <div

              className="

                rounded-[28px]



                border

                border-zinc-200



                bg-gradient-to-br

                from-white

                via-zinc-50

                to-zinc-100



                p-6

                shadow-sm



                dark:border-zinc-800

                dark:from-zinc-900

                dark:via-zinc-900

                dark:to-zinc-950

              "

            >



              <div className="flex items-center justify-between">



                <div>



                  <p

                    className="

                      text-xs

                      font-semibold

                      uppercase

                      tracking-[0.2em]

                      text-muted-foreground

                    "

                  >

                    Certificates

                  </p>



                  <h2

                    className="

                      mt-1

                      font-['Quicksand']

                      text-xl

                      font-bold

                    "

                  >

                    Certificate Overview

                  </h2>



                </div>





                <div

                  className="

                    flex

                    h-9

                    w-9

                    items-center

                    justify-center



                    rounded-xl



                    border

                    border-zinc-200



                    bg-zinc-100



                    dark:border-zinc-700

                    dark:bg-zinc-800

                  "

                >

                  <Award className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />

                </div>



              </div>





              {/* Numbers */}



              <div className="mt-8 grid grid-cols-2 gap-6">



                <div>



                  <p className="text-3xl font-bold tracking-tight">

                    {stats.totalCertificates.toLocaleString()}

                  </p>



                  <p className="mt-1 text-xs text-muted-foreground">

                    Issued

                  </p>



                </div>





                <div>



                  <p className="text-3xl font-bold tracking-tight">

                    {stats.verifiedCertificates.toLocaleString()}

                  </p>



                  <p className="mt-1 text-xs text-muted-foreground">

                    Verified

                  </p>



                </div>



              </div>





              {/* Verification */}



              <div className="mt-8">



                <div className="flex items-end justify-between">



                  <div>



                    <p className="text-xs text-muted-foreground">

                      Verification rate

                    </p>



                    <p

                      className="

                        mt-1

                        font-['Quicksand']

                        text-2xl

                        font-bold

                      "

                    >

                      {stats.totalCertificates > 0
                        ? `${Math.round(
                            (stats.verifiedCertificates / stats.totalCertificates) * 100,
                          )}%`
                        : "0%"}

                    </p>



                  </div>





                  <ShieldCheck

                    className="

                      mb-1

                      h-5

                      w-5

                      text-zinc-400

                      dark:text-zinc-500

                    "

                  />



                </div>





                <div

                  className="

                    mt-4

                    h-2

                    overflow-hidden

                    rounded-full



                    bg-zinc-200



                    dark:bg-zinc-800

                  "

                >



                  <div

                    className="

                      h-full

                      rounded-full



                      bg-zinc-800



                      dark:bg-zinc-300

                    "

                    style={{
                      width: `${
                        stats.totalCertificates > 0
                          ? Math.round(
                              (stats.verifiedCertificates / stats.totalCertificates) * 100,
                            )
                          : 0
                      }%`,
                    }}

                  />



                </div>





                <p className="mt-2 text-[11px] text-muted-foreground">

                  {stats.verifiedCertificates.toLocaleString()} of{" "}
                  {stats.totalCertificates.toLocaleString()} certificates verified

                </p>



              </div>



            </div>



          </section>



        </div>



      </div>



    </main>

  )

}





/* ============================================================

   SIDEBAR ICON

============================================================ */



function SidebarIcon({

  open,

}: {

  open: boolean

}) {

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

        y="3"

        width="17"

        height="16"

        rx="4"

        stroke="currentColor"

        strokeWidth="2"

      />



      <path

        d={open ? "M8 3.5V18.5" : "M14 3.5V18.5"}

        stroke="currentColor"

        strokeWidth="2"

        strokeLinecap="round"

      />



    </svg>

  )

}





/* ============================================================

   STAT CARD

============================================================ */



function StatCard({

  icon,

  label,

  value,

  note,

}: {

  icon: React.ReactNode

  label: string

  value: string

  note: string

}) {

  return (

    <div

      className="

        group



        rounded-2xl



        border

        border-zinc-200



        bg-gradient-to-br

        from-white

        via-white

        to-zinc-100



        p-5

        shadow-sm



        transition-all

        duration-300



        hover:-translate-y-1

        hover:border-zinc-300

        hover:shadow-lg



        dark:border-zinc-800

        dark:from-zinc-900

        dark:via-zinc-900

        dark:to-zinc-950



        dark:hover:border-zinc-700

      "

    >



      <div className="flex items-center justify-between">



        <div

          className="

            flex

            h-11

            w-11

            items-center

            justify-center



            rounded-xl



            border

            border-zinc-200



            bg-zinc-100

            text-zinc-700



            dark:border-zinc-700

            dark:bg-zinc-800

            dark:text-zinc-200

          "

        >

          {icon}

        </div>





        <ArrowUpRight

          className="

            h-4

            w-4



            text-zinc-400



            opacity-0



            transition-opacity



            group-hover:opacity-100



            dark:text-zinc-500

          "

        />



      </div>





      <p className="mt-5 text-sm text-zinc-500 dark:text-zinc-400">

        {label}

      </p>





      <p

        className="

          mt-1

          font-['Quicksand']

          text-3xl

          font-bold

          tracking-tight

        "

      >

        {value}

      </p>





      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">

        {note}

      </p>



    </div>

  )

}





/* ============================================================

   EVENT CARD

============================================================ */



function EventCard({

  event,

  index,

  onClick,

}: {

  event: DashboardEvent

  index: number

  onClick: () => void

}) {



  const themes = [

    {

      card:

        "border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 text-white shadow-xl shadow-black/10 dark:border-zinc-700 dark:from-zinc-800 dark:via-zinc-900 dark:to-black",



      status:

        "bg-white/10 text-zinc-200",



      muted:

        "text-zinc-400",



      progressBg:

        "bg-white/10",



      progress:

        "bg-zinc-200",

    },



    {

      card:

        "border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-zinc-200 text-zinc-950 dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 dark:text-white",



      status:

        "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",



      muted:

        "text-zinc-500 dark:text-zinc-400",



      progressBg:

        "bg-zinc-200 dark:bg-zinc-800",



      progress:

        "bg-zinc-700 dark:bg-zinc-300",

    },



    {

      card:

        "border-zinc-200 bg-gradient-to-br from-zinc-100 via-white to-zinc-200 text-zinc-950 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800 dark:text-white",



      status:

        "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",



      muted:

        "text-zinc-500 dark:text-zinc-400",



      progressBg:

        "bg-zinc-200 dark:bg-zinc-800",



      progress:

        "bg-zinc-700 dark:bg-zinc-300",

    },

  ]



  const theme = themes[index]



  return (

    <button

      type="button"

      onClick={onClick}

      className={`

        group

        relative



        min-h-[270px]



        overflow-hidden

        rounded-[28px]



        border



        p-6



        text-left



        transition-all

        duration-300



        hover:-translate-y-1

        hover:shadow-2xl



        ${theme.card}

      `}

    >



      {/* Decorative circles */}



      <div

        className="

          absolute

          -right-20

          -top-20

          h-48

          w-48

          rounded-full

          border

          border-white/10

        "

      />



      <div

        className="

          absolute

          -right-8

          -top-8

          h-28

          w-28

          rounded-full

          border

          border-white/10

        "

      />





      {/* Status */}



      <div className="relative flex items-center justify-between">



        <span

          className={`

            rounded-full

            px-3

            py-1



            text-[10px]

            font-semibold

            uppercase

            tracking-wider



            ${theme.status}

          `}

        >

          {event.status}

        </span>





        <ArrowUpRight

          className="

            h-5

            w-5



            opacity-0



            transition-all



            group-hover:-translate-y-0.5

            group-hover:translate-x-0.5

            group-hover:opacity-100

          "

        />



      </div>





      {/* Event name */}



      <div className="relative mt-12">



        <h3

          className="

            font-['Quicksand']

            text-2xl

            font-bold

            tracking-tight

          "

        >

          {event.name}

        </h3>





        <p className={`mt-2 text-sm ${theme.muted}`}>

          {event.date}

        </p>



      </div>





      {/* Event stats */}



      <div

        className="

          absolute

          bottom-6

          left-6

          right-6



          flex

          items-end

          justify-between

        "

      >



        <div className="flex gap-7">



          <div>



            <p

              className={`

                text-[10px]

                uppercase

                tracking-wider

                ${theme.muted}

              `}

            >

              Participants

            </p>



            <p className="mt-1 text-lg font-semibold">

              {event.participants}

            </p>



          </div>





          <div>



            <p

              className={`

                text-[10px]

                uppercase

                tracking-wider

                ${theme.muted}

              `}

            >

              Certificates

            </p>



            <p className="mt-1 text-lg font-semibold">

              {event.certificates}

            </p>



          </div>



        </div>





        {event.progress > 0 && (

          <div className="text-right">



            <p

              className={`

                text-xs

                font-semibold

                ${theme.muted}

              `}

            >

              {event.progress}%

            </p>





            <div

              className={`

                mt-1

                h-1.5

                w-14

                overflow-hidden

                rounded-full

                ${theme.progressBg}

              `}

            >



              <div

                className={`

                  h-full

                  rounded-full

                  ${theme.progress}

                `}

                style={{

                  width: `${event.progress}%`,

                }}

              />



            </div>



          </div>

        )}



      </div>



    </button>

  )

}



export default Dashboard