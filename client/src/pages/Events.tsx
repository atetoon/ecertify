import { useEffect, useMemo, useState } from "react"

import { useNavigate } from "react-router-dom"

import {
  CalendarDays,
  ChevronRight,
  CirclePlus,
  Loader2,
  Trash2,
  Users,
  Award,
} from "lucide-react"

import OrganizerLayout from "@/components/organizer/organizer-layout"
import HoldButton from "@/components/ui/hold-button"

const API_URL = "http://localhost:5001"

interface BackendEvent {
  id: string
  name: string
  description?: string | null
  date: string
  organization: string
  status:
    | "DRAFT"
    | "REGISTRATION_OPEN"
    | "REGISTRATION_CLOSED"
    | "COMPLETED"
    | string
  _count: {
    participants: number
    certificates: number
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

function formatStatus(status: BackendEvent["status"]) {
  if (status === "REGISTRATION_OPEN") {
    return "Registration Open"
  }

  if (status === "REGISTRATION_CLOSED") {
    return "Registration Closed"
  }

  if (status === "COMPLETED") {
    return "Completed"
  }

  return "Draft"
}

function statusClass(status: BackendEvent["status"]) {
  if (status === "REGISTRATION_OPEN") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
  }

  if (status === "REGISTRATION_CLOSED") {
    return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
  }

  if (status === "COMPLETED") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
  }

  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
}

export default function Events() {
  const navigate = useNavigate()

  const [events, setEvents] = useState<BackendEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [deleteTarget, setDeleteTarget] =
    useState<BackendEvent | null>(null)

  const [deleting, setDeleting] = useState(false)

  async function fetchEvents() {
    const token = localStorage.getItem("ecertify_token")

    if (!token) {
      navigate("/login")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/api/events`, {
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
        throw new Error(
          data.message || "Unable to fetch events",
        )
      }

      setEvents(data.events ?? [])
    } catch (err) {
      console.error("Fetch events error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Unable to fetch events",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchEvents()
  }, [])

  const totals = useMemo(
    () => ({
      participants: events.reduce(
        (total, event) =>
          total + event._count.participants,
        0,
      ),
      certificates: events.reduce(
        (total, event) =>
          total + event._count.certificates,
        0,
      ),
    }),
    [events],
  )

  async function deleteEvent() {
    if (!deleteTarget) return

    const token = localStorage.getItem("ecertify_token")

    if (!token) {
      navigate("/login")
      return
    }

    setDeleting(true)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/api/events/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem("ecertify_token")
        localStorage.removeItem("ecertify_organizer")
        navigate("/login")
        return
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete event",
        )
      }

      setEvents((current) =>
        current.filter(
          (event) => event.id !== deleteTarget.id,
        ),
      )

      setDeleteTarget(null)
    } catch (err) {
      console.error("Delete event error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete event",
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <OrganizerLayout>
      <main className="min-h-[calc(100vh-6rem)] bg-zinc-50 dark:bg-[#08080a]">
        <div className="mx-auto max-w-[1600px] px-5 py-10 sm:px-8 lg:px-10">

          {/* Header */}
          <section className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                Workspace
              </p>

              <h1 className="mt-2 font-['Quicksand'] text-4xl font-bold tracking-tight sm:text-5xl">
                Events
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Manage your events, registrations, participants and
                certificates from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/event/new")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              <CirclePlus className="h-4 w-4" />
              Create Event
            </button>
          </section>

          {/* Stats */}
          <section className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#0d0d10]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Total Events
              </p>

              <p className="mt-2 font-['Quicksand'] text-3xl font-bold">
                {events.length}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#0d0d10]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Participants
              </p>

              <p className="mt-2 font-['Quicksand'] text-3xl font-bold">
                {totals.participants}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#0d0d10]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Certificates
              </p>

              <p className="mt-2 font-['Quicksand'] text-3xl font-bold">
                {totals.certificates}
              </p>
            </div>
          </section>

          {/* Events */}
          <section className="mt-10">
            {loading ? (
              <div className="flex min-h-72 items-center justify-center rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0d0d10]">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading events...
                </div>
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center dark:border-red-900/50 dark:bg-red-950/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => void fetchEvents()}
                  className="mt-4 text-sm font-medium underline underline-offset-4"
                >
                  Try again
                </button>
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-14 text-center dark:border-zinc-700 dark:bg-[#0d0d10]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                  <CalendarDays className="h-5 w-5 text-zinc-500" />
                </div>

                <h2 className="mt-5 font-['Quicksand'] text-xl font-bold">
                  No events yet
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Create your first event to start collecting
                  registrations and issuing certificates.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/event/new")}
                  className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  <CirclePlus className="h-4 w-4" />
                  Create Event
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => (
                  <article
                    key={event.id}
                    className="group relative rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-[#0d0d10] dark:hover:border-zinc-700"
                  >
                    {/* Event content */}
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/events/${event.id}`)
                      }
                      className="block w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-4 pr-8">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                          <CalendarDays className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass(event.status)}`}
                        >
                          {formatStatus(event.status)}
                        </span>
                      </div>

                      <div className="mt-6">
                        <h2 className="font-['Quicksand'] text-xl font-bold tracking-tight">
                          {event.name}
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                          {event.organization}
                        </p>

                        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                          {formatDate(event.date)}
                        </p>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/70">
                          <div className="flex items-center gap-2 text-zinc-400">
                            <Users className="h-3.5 w-3.5" />

                            <span className="text-[11px] uppercase tracking-wide">
                              Participants
                            </span>
                          </div>

                          <p className="mt-2 font-['Quicksand'] text-lg font-bold">
                            {event._count.participants}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900/70">
                          <div className="flex items-center gap-2 text-zinc-400">
                            <Award className="h-3.5 w-3.5" />

                            <span className="text-[11px] uppercase tracking-wide">
                              Certificates
                            </span>
                          </div>

                          <p className="mt-2 font-['Quicksand'] text-lg font-bold">
                            {event._count.certificates}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                        <span className="text-sm font-medium text-zinc-500 transition-colors group-hover:text-zinc-950 dark:group-hover:text-white">
                          Open event workspace
                        </span>

                        <ChevronRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>

                    {/* Hold to delete */}
                    <div className="mt-4 flex justify-end border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      <HoldButton
                        disabled={deleting}
                        holdTime={2000}
                        size="sm"
                        radius={10}
                        backgroundColor="#18181b"
                        fillColor="#dc2626"
                        textColor="#f4f4f5"
                        fillTextColor="#ffffff"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        onHold={() => setDeleteTarget(event)}
                        className="min-w-36.25"
                      >
                        Hold to delete
                      </HoldButton>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null)
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#0d0d10]">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="mt-5 font-['Quicksand'] text-xl font-bold">
              Delete {deleteTarget.name}?
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              This will permanently delete this event and
              its associated data. This action cannot be
              undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="h-10 rounded-xl border border-zinc-200 px-4 text-sm font-medium transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => void deleteEvent()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {deleting ? "Deleting..." : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </OrganizerLayout>
  )
}