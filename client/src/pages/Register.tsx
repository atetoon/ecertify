import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL

type FieldType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "EMAIL"
  | "NUMBER"
  | "PHONE"
  | "DATE"
  | "DROPDOWN"
  | "CHECKBOX"
  | "RADIO"

interface RegistrationField {
  id: string
  label: string
  type: FieldType
  required: boolean
  options: string[] | null
  position: number
}

interface EventData {
  id: string
  name: string
  slug: string
  description: string | null
  date: string
  organization: string
  status: string
  fields: RegistrationField[]
}

type ResponseValue = string | boolean

export default function Register() {
  const navigate = useNavigate()
  const { eventSlug } = useParams<{ eventSlug: string }>()

  const [event, setEvent] = useState<EventData | null>(null)
  const [responses, setResponses] = useState<
    Record<string, ResponseValue>
  >({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadEvent() {
      if (!eventSlug) {
        setError("Invalid registration link.")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `${API_URL}/api/register/${eventSlug}`,
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load registration form.",
          )
        }

        const loadedEvent: EventData = data.event

        setEvent(loadedEvent)

        const initialResponses: Record<
          string,
          ResponseValue
        > = {}

        for (const field of loadedEvent.fields) {
          initialResponses[field.id] =
            field.type === "CHECKBOX" ? false : ""
        }

        setResponses(initialResponses)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load registration form.",
        )
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [eventSlug])

  function updateResponse(
    fieldId: string,
    value: ResponseValue,
  ) {
    setResponses((current) => ({
      ...current,
      [fieldId]: value,
    }))
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault()

    if (!eventSlug) return

    setError("")
    setSubmitting(true)

    try {
      const response = await fetch(
        `${API_URL}/api/register/${eventSlug}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            responses,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed.",
        )
      }

      if (
        typeof data.accessCode !== "string" ||
        !/^[A-Z0-9]{8}$/.test(data.accessCode)
      ) {
        throw new Error(
          "Registration succeeded, but your access code could not be generated. Please contact the organizer.",
        )
      }

      setAccessCode(data.accessCode)
      setSuccess(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function copyAccessCode() {
    if (!accessCode) return

    try {
      await navigator.clipboard.writeText(accessCode)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      setError("Unable to copy the access code.")
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-black p-5 text-black">
        <div className="relative flex min-h-[calc(100vh-2.5rem)] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-800 via-zinc-500 to-zinc-100">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, black 1px, transparent 0)",
              backgroundSize: "4px 4px",
              opacity: 0.08,
            }}
          />

          <p className="relative z-10 text-sm text-black/60">
            Loading event...
          </p>
        </div>
      </main>
    )
  }

  if (!event) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-black p-5 text-black">
        <div className="relative flex min-h-[calc(100vh-2.5rem)] w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-800 via-zinc-500 to-zinc-100">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, black 1px, transparent 0)",
              backgroundSize: "4px 4px",
              opacity: 0.08,
            }}
          />

          <div className="relative z-10 w-full max-w-md px-6 text-center">
            <h1 className="font-['Quicksand'] text-3xl font-semibold">
              Registration unavailable
            </h1>

            <p className="mt-3 text-sm text-black/60">
              {error ||
                "This registration link is not available."}
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              BACK TO eCERTIFY
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-black p-5 text-black">
        <div className="relative min-h-[calc(100vh-2.5rem)] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-800 via-zinc-500 to-zinc-100">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, black 1px, transparent 0)",
              backgroundSize: "4px 4px",
              opacity: 0.08,
            }}
          />

          <div className="relative z-10 flex min-h-[calc(100vh-2.5rem)] w-full flex-col">
            <div className="flex items-center justify-between p-8 sm:p-10">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="font-['Quicksand'] text-lg font-bold tracking-tight"
              >
                eCERTIFY
              </button>

              <span className="font-mono text-xs tracking-[0.2em] text-black/50">
                ©2026
              </span>
            </div>

            <div className="flex flex-1 items-center justify-center px-5 py-16">
              <div className="w-full max-w-xl rounded-2xl bg-gradient-to-br from-white/95 via-zinc-100/90 to-zinc-300/80 p-8 shadow-2xl backdrop-blur sm:p-10">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
                  {event.organization}
                </p>

                <h1 className="mt-3 font-['Quicksand'] text-3xl font-semibold tracking-tight">
                  Registration successful
                </h1>

                <p className="mt-4 text-sm leading-6 text-zinc-500">
                  Your registration for{" "}
                  <span className="font-medium text-zinc-900">
                    {event.name}
                  </span>{" "}
                  has been submitted successfully.
                </p>

                {/* Access Code */}
                <div className="mt-7 rounded-xl border border-zinc-300 bg-white/70 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                    Your certificate access code
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-4">
                    <code className="min-w-0 break-all font-mono text-2xl font-bold tracking-[0.22em] text-zinc-900">
                      {accessCode}
                    </code>

                    <button
                      type="button"
                      onClick={copyAccessCode}
                      className="shrink-0 border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                    >
                      {copied ? "COPIED" : "COPY"}
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-zinc-500">
                    Save this code. You will use it to access
                    your certificate when it is issued. This code
                    will not be shown again.
                  </p>
                </div>

                <div className="mt-5 border border-zinc-300 bg-zinc-100/70 p-4">
                  <p className="text-xs leading-5 text-zinc-500">
                    Your certificate will only become available
                    after the organizer marks you eligible and
                    issues your certificate.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="mt-8 h-11 w-full bg-black text-sm font-semibold tracking-wide text-white transition hover:bg-zinc-800"
                >
                  BACK TO eCERTIFY
                </button>
              </div>
            </div>

            <p className="p-8 font-mono text-[10px] tracking-[0.12em] text-black/40 sm:p-10">
              DIGITAL CERTIFICATES FOR EVENTS
            </p>
          </div>
        </div>
      </main>
    )
  }

  const formattedDate = new Date(
    event.date,
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-black p-3 text-black sm:p-5">
      <div className="relative min-h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-800 via-zinc-500 to-zinc-100 sm:min-h-[calc(100vh-2.5rem)]">
        {/* Texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, black 1px, transparent 0)",
            backgroundSize: "4px 4px",
            opacity: 0.08,
          }}
        />

        <div className="relative z-10 w-full min-w-0">
          {/* Header */}
          <div className="flex w-full items-center justify-between px-6 py-7 sm:px-10 sm:py-10">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-['Quicksand'] text-lg font-bold tracking-tight"
            >
              eCERTIFY
            </button>

            <span className="font-mono text-xs tracking-[0.2em] text-black/50">
              ©2026
            </span>
          </div>

          {/* Hero */}
          <div className="mx-auto w-full max-w-3xl px-5 pb-7 pt-8 text-center sm:px-8 sm:pt-14">
            <p className="font-mono text-[10px] tracking-[0.2em] text-black/45">
              DIGITAL CERTIFICATES FOR EVENTS
            </p>

            <h1 className="mt-4 break-words font-['Quicksand'] text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Register for {event.name}
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-black/60">
              Complete the registration form below to
              register for this event.
            </p>
          </div>

          {/* Compact Event Info */}
          <div className="mx-auto w-full max-w-2xl min-w-0 px-5 sm:px-8">
            <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-black/15 bg-white/90 shadow-sm">
              <div className="flex min-w-0 flex-col sm:flex-row">
                {/* Event details */}
                <div className="min-w-0 flex-1 px-5 py-5 sm:px-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    Event details
                  </p>

                  <h2 className="mt-2 break-words font-['Quicksand'] text-lg font-semibold leading-snug tracking-tight text-black">
                    {event.name}
                  </h2>

                  <p className="mt-1 break-words text-sm leading-5 text-zinc-600">
                    {event.organization}
                  </p>

                  {event.description && (
                    <p className="mt-3 break-words text-xs leading-5 text-zinc-500">
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="flex shrink-0 items-center gap-3 border-t border-black/10 bg-zinc-100/80 px-5 py-4 sm:w-40 sm:flex-col sm:items-start sm:justify-center sm:border-l sm:border-t-0 sm:px-5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    Date
                  </span>

                  <span className="text-sm font-semibold tabular-nums text-black">
                    {formattedDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Card */}
          <div className="mx-auto w-full max-w-2xl min-w-0 px-5 pb-12 pt-5 sm:px-8 sm:pb-16">
            <section className="w-full min-w-0 rounded-2xl bg-gradient-to-br from-white/95 via-zinc-100/90 to-zinc-300/80 p-6 shadow-xl backdrop-blur sm:p-9">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                  Registration
                </p>

                <h2 className="mt-2 break-words font-['Quicksand'] text-2xl font-semibold tracking-tight">
                  Enter your details
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Fields marked with{" "}
                  <span className="text-red-500">*</span> are
                  required.
                </p>
              </div>

              <div className="my-7 h-px w-full bg-zinc-300/70" />

              {event.fields.length === 0 ? (
                <div className="w-full border border-zinc-300/70 bg-white/50 p-5">
                  <p className="text-sm text-zinc-500">
                    Registration is not configured for this
                    event yet.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="w-full min-w-0"
                >
                  <div className="w-full min-w-0 space-y-6">
                    {[...event.fields]
                      .sort(
                        (a, b) => a.position - b.position,
                      )
                      .map((field) => (
                        <RegistrationField
                          key={field.id}
                          field={field}
                          value={
                            responses[field.id] ?? ""
                          }
                          onChange={(value) =>
                            updateResponse(
                              field.id,
                              value,
                            )
                          }
                        />
                      ))}
                  </div>

                  {error && (
                    <div className="mt-6 w-full border border-red-200 bg-red-50 px-4 py-3">
                      <p className="break-words text-sm text-red-600">
                        {error}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-8 h-11 w-full max-w-full bg-black text-sm font-semibold tracking-wide text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
                  >
                    {submitting
                      ? "SUBMITTING..."
                      : "REGISTER"}
                  </button>
                </form>
              )}
            </section>

            <p className="mt-8 text-center font-mono text-[10px] tracking-[0.12em] text-black/40">
              POWERED BY eCERTIFY
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

interface RegistrationFieldProps {
  field: RegistrationField
  value: ResponseValue
  onChange: (value: ResponseValue) => void
}

function RegistrationField({
  field,
  value,
  onChange,
}: RegistrationFieldProps) {
  const inputClass =
    "box-border h-11 w-full min-w-0 max-w-full border border-zinc-200 bg-white/80 px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500"

  const label = (
    <label className="mb-2.5 block break-words text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">
      {field.label}

      {field.required && (
        <span className="ml-1 text-red-500">*</span>
      )}
    </label>
  )

  switch (field.type) {
    case "LONG_TEXT":
      return (
        <div className="min-w-0 w-full">
          {label}

          <textarea
            value={String(value)}
            required={field.required}
            rows={5}
            className="box-border block w-full min-w-0 max-w-full resize-y border border-zinc-200 bg-white/80 px-4 py-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )

    case "EMAIL":
      return (
        <div className="min-w-0 w-full">
          {label}

          <input
            type="email"
            value={String(value)}
            required={field.required}
            className={inputClass}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )

    case "NUMBER":
      return (
        <div className="min-w-0 w-full">
          {label}

          <input
            type="number"
            value={String(value)}
            required={field.required}
            className={inputClass}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )

    case "PHONE":
      return (
        <div className="min-w-0 w-full">
          {label}

          <input
            type="tel"
            value={String(value)}
            required={field.required}
            className={inputClass}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )

    case "DATE":
      return (
        <div className="min-w-0 w-full">
          {label}

          <input
            type="date"
            value={String(value)}
            required={field.required}
            className={inputClass}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )

    case "DROPDOWN":
      return (
        <div className="min-w-0 w-full">
          {label}

          <select
            value={String(value)}
            required={field.required}
            className={inputClass}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select an option</option>

            {(field.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )

    case "RADIO":
      return (
        <div className="min-w-0 w-full">
          {label}

          <div className="space-y-3">
            {(field.options ?? []).map((option) => (
              <label
                key={option}
                className="flex min-w-0 cursor-pointer items-center gap-3 text-sm text-zinc-700"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={String(value) === option}
                  required={field.required}
                  onChange={() => onChange(option)}
                />

                <span className="break-words">
                  {option}
                </span>
              </label>
            ))}
          </div>
        </div>
      )

    case "CHECKBOX":
      return (
        <label className="flex min-w-0 cursor-pointer items-start gap-3 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            required={field.required}
            className="mt-0.5"
            onChange={(e) =>
              onChange(e.target.checked)
            }
          />

          <span className="break-words">
            {field.label}

            {field.required && (
              <span className="ml-1 text-red-500">
                *
              </span>
            )}
          </span>
        </label>
      )

    case "SHORT_TEXT":
    default:
      return (
        <div className="min-w-0 w-full">
          {label}

          <input
            type="text"
            value={String(value)}
            required={field.required}
            className={inputClass}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )
  }
}