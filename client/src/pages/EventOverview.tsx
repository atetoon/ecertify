import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Users,
  Award,
  ShieldCheck,
  Settings2,
  FileImage,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
} from "lucide-react"
import OrganizerLayout from "@/components/organizer/organizer-layout"

const API_URL = import.meta.env.VITE_API_URL

type EventStatus =
  | "DRAFT"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "COMPLETED"

interface BackendEvent {
  id: string
  name: string
  slug: string
  description: string | null
  date: string
  organization: string
  status: EventStatus
  _count: {
    participants: number
    certificates: number
  }
  verifiedCount: number
}

interface EventData {
  id: string
  name: string
  date: string
  description: string
  organization: string
  participants: number
  issued: number
  verified: number
  registrationSlug: string
  status: EventStatus
}

function ActionSwapButton({
  copied,
  onClick,
}: {
  copied: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex h-10 min-w-[104px] items-center justify-center overflow-hidden rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
    >
      {copied ? (
        <>
          <Check className="mr-2 h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="mr-2 h-3.5 w-3.5" />
          Copy link
        </>
      )}
    </button>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#0b0b0d]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          {icon}
        </div>

        <p className="text-sm text-zinc-500">{label}</p>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight">
        {value.toLocaleString()}
      </p>
    </div>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

function formatStatus(status: EventStatus) {
  return status.replaceAll("_", " ")
}

export default function EventOverview() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const [registrationAction, setRegistrationAction] = useState<
    "open" | "stop" | "reopen" | null
  >(null)

  const [updatingRegistration, setUpdatingRegistration] = useState(false)

  const fetchEvent = async () => {
    if (!eventId) {
      setError("Invalid event.")
      setLoading(false)
      return
    }

    const token = localStorage.getItem("ecertify_token")

    if (!token) {
      navigate("/login")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem("ecertify_token")
        navigate("/login")
        return
      }

      if (!response.ok || !data.success) {
        setError(data.message || "The event could not be loaded.")
        return
      }

      const backendEvent: BackendEvent = data.event

      setEvent({
        id: backendEvent.id,
        name: backendEvent.name,
        date: backendEvent.date,
        description: backendEvent.description || "",
        organization: backendEvent.organization,
        participants: backendEvent._count.participants,
        issued: backendEvent._count.certificates,
        verified: backendEvent.verifiedCount,
        registrationSlug: backendEvent.slug,
        status: backendEvent.status,
      })
    } catch {
      setError("Unable to connect to the server.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchEvent()
  }, [eventId])

  const registrationLink = event
    ? `ecertify.tech/register/${event.registrationSlug}`
    : ""

  const handleCopy = async () => {
    if (!event) return

    try {
      await navigator.clipboard.writeText(`https://${registrationLink}`)

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1800)
    } catch {
      setCopied(false)
    }
  }

  const handleRegistrationStatusChange = async () => {
    if (!event || !eventId || !registrationAction) return

    let nextStatus: EventStatus

    if (registrationAction === "open") {
      nextStatus = "REGISTRATION_OPEN"
    } else if (registrationAction === "stop") {
      nextStatus = "REGISTRATION_CLOSED"
    } else {
      nextStatus = "REGISTRATION_OPEN"
    }

    const token = localStorage.getItem("ecertify_token")

    if (!token) {
      navigate("/login")
      return
    }

    setUpdatingRegistration(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem("ecertify_token")
        navigate("/login")
        return
      }

      if (!response.ok || !data.success) {
        setError(
          data.message || "Unable to update registration status.",
        )
        return
      }

      setEvent((current) =>
        current
          ? {
              ...current,
              status: nextStatus,
            }
          : current,
      )

      setRegistrationAction(null)
    } catch {
      setError("Unable to update registration status.")
    } finally {
      setUpdatingRegistration(false)
    }
  }

  if (loading) {
    return (
      <OrganizerLayout>
        <main className="min-h-[calc(100vh-6rem)] bg-zinc-50 dark:bg-[#08080a]">
          <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading event...
            </div>
          </div>
        </main>
      </OrganizerLayout>
    )
  }

  if (error && !event) {
    return (
      <OrganizerLayout>
        <main className="min-h-[calc(100vh-6rem)] bg-zinc-50 dark:bg-[#08080a]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-5 py-24 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
              <AlertCircle className="h-5 w-5 text-zinc-500" />
            </div>

            <h1 className="mt-5 text-xl font-semibold">
              Unable to load event
            </h1>

            <p className="mt-2 max-w-md text-sm text-zinc-500">
              {error || "The event could not be found."}
            </p>

            <button
              type="button"
              onClick={() => void fetchEvent()}
              className="mt-6 rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
            >
              Try again
            </button>
          </div>
        </main>
      </OrganizerLayout>
    )
  }

  if (!event) return null

  const isDraft = event.status === "DRAFT"
  const isOpen = event.status === "REGISTRATION_OPEN"
  const isClosed = event.status === "REGISTRATION_CLOSED"

  return (
    <OrganizerLayout>
      <main className="min-h-[calc(100vh-6rem)] bg-zinc-50 dark:bg-[#08080a]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          {/* Header */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate("/events")}
                className="mb-4 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
              >
                ← Back to Events
              </button>

              <h1 className="text-3xl font-bold tracking-tight">
                {event.name}
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                {event.organization} · {formatDate(event.date)}
              </p>
            </div>

            <div className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-900">
              {formatStatus(event.status)}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Participants"
              value={event.participants}
            />

            <StatCard
              icon={<Award className="h-5 w-5" />}
              label="Certificates"
              value={event.issued}
            />

            <StatCard
              icon={<ShieldCheck className="h-5 w-5" />}
              label="Verified"
              value={event.verified}
            />

            <StatCard
              icon={<Settings2 className="h-5 w-5" />}
              label="Status"
              value={isOpen ? 1 : 0}
            />
          </div>

          {/* Manage Event */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold">
              Manage Event
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={() =>
                  navigate(`/events/${event.id}/participants`)
                }
                className="rounded-xl border border-zinc-200 bg-white p-5 text-left hover:border-zinc-400 dark:border-zinc-800 dark:bg-[#0b0b0d] dark:hover:border-zinc-600"
              >
                <Users className="h-5 w-5" />

                <p className="mt-4 font-semibold">
                  Participants
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  View registrations and eligibility.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(`/events/${event.id}/certificates`)
                }
                className="rounded-xl border border-zinc-200 bg-white p-5 text-left hover:border-zinc-400 dark:border-zinc-800 dark:bg-[#0b0b0d] dark:hover:border-zinc-600"
              >
                <Award className="h-5 w-5" />

                <p className="mt-4 font-semibold">
                  Certificates
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Issue and manage certificates.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(`/events/${event.id}/registration`)
                }
                className="rounded-xl border border-zinc-200 bg-white p-5 text-left hover:border-zinc-400 dark:border-zinc-800 dark:bg-[#0b0b0d] dark:hover:border-zinc-600"
              >
                <Settings2 className="h-5 w-5" />

                <p className="mt-4 font-semibold">
                  Registration
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Configure registration fields.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(`/template/${event.id}`)
                }
                className="rounded-xl border border-zinc-200 bg-white p-5 text-left hover:border-zinc-400 dark:border-zinc-800 dark:bg-[#0b0b0d] dark:hover:border-zinc-600"
              >
                <FileImage className="h-5 w-5" />

                <p className="mt-4 font-semibold">
                  Template
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Design the certificate template.
                </p>
              </button>
            </div>
          </section>

          {/* Registration Link */}
          <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#0b0b0d]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Registration Link
                </p>

                <p className="mt-2 break-all font-mono text-sm">
                  {registrationLink}
                </p>

                <span
                  className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    isOpen
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : isClosed
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  {formatStatus(event.status)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* DRAFT → OPEN */}
                {isDraft && (
                  <button
                    type="button"
                    onClick={() =>
                      setRegistrationAction("open")
                    }
                    className="flex h-10 items-center gap-2 rounded-lg border border-emerald-200 px-4 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Open Registration
                  </button>
                )}

                {/* OPEN → CLOSED */}
                {isOpen && (
                  <button
                    type="button"
                    onClick={() =>
                      setRegistrationAction("stop")
                    }
                    className="flex h-10 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <PauseCircle className="h-3.5 w-3.5" />
                    Stop Registration
                  </button>
                )}

                {/* CLOSED → OPEN */}
                {isClosed && (
                  <button
                    type="button"
                    onClick={() =>
                      setRegistrationAction("reopen")
                    }
                    className="flex h-10 items-center gap-2 rounded-lg border border-emerald-200 px-4 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Reopen Registration
                  </button>
                )}

                <ActionSwapButton
                  copied={copied}
                  onClick={handleCopy}
                />

                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `/register/${event.registrationSlug}`,
                      "_blank",
                    )
                  }
                  className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Confirmation Modal */}
      {registrationAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#111113]">
            <h2 className="text-lg font-semibold">
              {registrationAction === "open"
                ? "Open registration?"
                : registrationAction === "stop"
                  ? "Stop registration?"
                  : "Reopen registration?"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {registrationAction === "open"
                ? "Participants will be able to register for this event."
                : registrationAction === "stop"
                  ? "New participants will no longer be able to register for this event."
                  : "Participants will be able to register for this event again."}
            </p>

            {error && (
              <p className="mt-3 text-sm text-red-500">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={updatingRegistration}
                onClick={() => {
                  setRegistrationAction(null)
                  setError("")
                }}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={updatingRegistration}
                onClick={() =>
                  void handleRegistrationStatusChange()
                }
                className="flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                {updatingRegistration && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}

                {registrationAction === "open"
                  ? "Open Registration"
                  : registrationAction === "stop"
                    ? "Stop Registration"
                    : "Reopen Registration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </OrganizerLayout>
  )
}