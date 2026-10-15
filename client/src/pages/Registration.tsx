import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react"

import OrganizerLayout from "@/components/organizer/organizer-layout"

const API_URL = import.meta.env.VITE_API_URL

type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "phone"
  | "date"
  | "select"
  | "checkbox"
  | "radio"

interface Field {
  id: string
  label: string
  type: FieldType
  required: boolean
  options: string[]
}

interface EventResponse {
  id: string
  name: string
  description: string | null
  date: string
  organization: string
  fields: Array<{
    id: string
    label: string
    type:
      | "SHORT_TEXT"
      | "LONG_TEXT"
      | "EMAIL"
      | "NUMBER"
      | "PHONE"
      | "DATE"
      | "DROPDOWN"
      | "CHECKBOX"
      | "RADIO"
    required: boolean
    options: unknown
    position: number
  }>
}

function backendTypeToFrontend(type: EventResponse["fields"][number]["type"]): FieldType {
  switch (type) {
    case "SHORT_TEXT":
      return "text"
    case "LONG_TEXT":
      return "textarea"
    case "EMAIL":
      return "email"
    case "NUMBER":
      return "number"
    case "PHONE":
      return "phone"
    case "DATE":
      return "date"
    case "DROPDOWN":
      return "select"
    case "CHECKBOX":
      return "checkbox"
    case "RADIO":
      return "radio"
  }
}

function frontendTypeToBackend(type: FieldType) {
  switch (type) {
    case "text":
      return "SHORT_TEXT"
    case "textarea":
      return "LONG_TEXT"
    case "email":
      return "EMAIL"
    case "number":
      return "NUMBER"
    case "phone":
      return "PHONE"
    case "date":
      return "DATE"
    case "select":
      return "DROPDOWN"
    case "checkbox":
      return "CHECKBOX"
    case "radio":
      return "RADIO"
  }
}

function normaliseOptions(options: unknown): string[] {
  if (!Array.isArray(options)) {
    return []
  }

  return options.filter(
    (option): option is string => typeof option === "string",
  )
}

export default function Registration() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const [eventName, setEventName] = useState("")
  const [description, setDescription] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [organization, setOrganization] = useState("")
  const [fields, setFields] = useState<Field[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loadRegistration = async () => {
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

      try {
        const response = await fetch(
          `${API_URL}/api/events/${eventId}/registration`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        const data = await response.json()

        if (response.status === 401) {
          localStorage.removeItem("ecertify_token")
          navigate("/login")
          return
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load registration settings",
          )
        }

        const event = data.event as EventResponse

        setEventName(event.name)
        setDescription(event.description ?? "")
        setOrganization(event.organization)

        const localDate = new Date(event.date)
        const year = localDate.getFullYear()
        const month = String(localDate.getMonth() + 1).padStart(2, "0")
        const day = String(localDate.getDate()).padStart(2, "0")

        setEventDate(`${year}-${month}-${day}`)

        setFields(
          [...event.fields]
            .sort((a, b) => a.position - b.position)
            .map((field) => ({
              id: field.id,
              label: field.label,
              type: backendTypeToFrontend(field.type),
              required: field.required,
              options: normaliseOptions(field.options),
            })),
        )
      } catch (err) {
        console.error("Load registration error:", err)

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load registration settings.",
        )
      } finally {
        setLoading(false)
      }
    }

    void loadRegistration()
  }, [eventId, navigate])

  const addField = () => {
    setFields((current) => [
      ...current,
      {
        id: `new-${Date.now()}`,
        label: "New Field",
        type: "text",
        required: false,
        options: [],
      },
    ])
  }

  const updateField = (
    id: string,
    key: keyof Field,
    value: string | boolean | string[],
  ) => {
    setFields((current) =>
      current.map((field) =>
        field.id === id
          ? {
              ...field,
              [key]: value,
            }
          : field,
      ),
    )

    setSaved(false)
  }

  const removeField = (id: string) => {
    setFields((current) =>
      current.filter((field) => field.id !== id),
    )

    setSaved(false)
  }

  const updateOptions = (id: string, value: string) => {
    const options = value
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean)

    updateField(id, "options", options)
  }

  const handleSave = async () => {
    if (!eventId) return

    const token = localStorage.getItem("ecertify_token")

    if (!token) {
      navigate("/login")
      return
    }

    setSaving(true)
    setError("")
    setSaved(false)

    try {
      const response = await fetch(
        `${API_URL}/api/events/${eventId}/registration`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: eventName,
            description,
            date: eventDate,
            organization,
            fields: fields.map((field) => ({
              id: field.id.startsWith("new-") ? undefined : field.id,
              label: field.label,
              type: frontendTypeToBackend(field.type),
              required: field.required,
              options:
                field.type === "select" || field.type === "radio"
                  ? field.options
                  : null,
            })),
          }),
        },
      )

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem("ecertify_token")
        navigate("/login")
        return
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save registration settings",
        )
      }

      const savedEvent = data.event as EventResponse

      setEventName(savedEvent.name)
      setDescription(savedEvent.description ?? "")
      setOrganization(savedEvent.organization)

      const savedDate = new Date(savedEvent.date)
      const year = savedDate.getFullYear()
      const month = String(savedDate.getMonth() + 1).padStart(2, "0")
      const day = String(savedDate.getDate()).padStart(2, "0")

      setEventDate(`${year}-${month}-${day}`)

      setFields(
        [...savedEvent.fields]
          .sort((a, b) => a.position - b.position)
          .map((field) => ({
            id: field.id,
            label: field.label,
            type: backendTypeToFrontend(field.type),
            required: field.required,
            options: normaliseOptions(field.options),
          })),
      )

      setSaved(true)

      window.setTimeout(() => {
        setSaved(false)
      }, 2000)
    } catch (err) {
      console.error("Save registration error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save registration settings.",
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <OrganizerLayout>
        <main className="min-h-[calc(100vh-6rem)] bg-zinc-50 dark:bg-[#08080a]">
          <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading registration settings...
            </div>
          </div>
        </main>
      </OrganizerLayout>
    )
  }

  if (error && !eventName) {
    return (
      <OrganizerLayout>
        <main className="min-h-[calc(100vh-6rem)] bg-zinc-50 dark:bg-[#08080a]">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center">
            <AlertCircle className="h-6 w-6 text-zinc-500" />

            <h1 className="mt-4 text-xl font-semibold">
              Unable to load registration
            </h1>

            <p className="mt-2 text-sm text-zinc-500">{error}</p>

            <button
              type="button"
              onClick={() => navigate(`/events/${eventId}`)}
              className="mt-6 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
            >
              Back to Event
            </button>
          </div>
        </main>
      </OrganizerLayout>
    )
  }

  return (
    <OrganizerLayout>
      <div className="mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8 lg:px-10">

        {/* Header */}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Events / {eventId} / Registration
        </p>

        <h1 className="mt-4 font-['Quicksand'] text-3xl font-bold tracking-tight">
          Manage Registration
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Configure the event and choose exactly what information
          participants need to provide during registration.
        </p>

        {error && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Event information */}
        <section className="mt-8 rounded-[28px] border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-['Quicksand'] text-xl font-bold">
            Event Information
          </h2>

          <div className="mt-6 grid gap-5">
            <FieldInput
              label="Event Name"
              value={eventName}
              onChange={setEventName}
              required
            />

            <div>
              <label className="text-sm font-medium">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setSaved(false)
                }}
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FieldInput
                label="Event Date"
                type="date"
                value={eventDate}
                onChange={setEventDate}
                required
              />

              <FieldInput
                label="Organisation"
                value={organization}
                onChange={setOrganization}
                required
              />
            </div>
          </div>
        </section>

        {/* Registration fields */}
        <section className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-['Quicksand'] text-xl font-bold">
                Registration Fields
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                These fields will appear on the public registration form.
              </p>
            </div>

            <button
              type="button"
              onClick={addField}
              className="flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {fields.length === 0 && (
              <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center dark:border-zinc-700">
                <p className="text-sm text-zinc-500">
                  No registration fields yet.
                </p>

                <button
                  type="button"
                  onClick={addField}
                  className="mt-3 text-sm font-medium underline underline-offset-4"
                >
                  Add your first field
                </button>
              </div>
            )}

            {fields.map((field) => (
              <div
                key={field.id}
                className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-start gap-3">
                  <GripVertical className="mt-3 h-5 w-5 shrink-0 text-zinc-400" />

                  <div className="grid flex-1 gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Field name
                      </label>

                      <input
                        value={field.label}
                        onChange={(e) =>
                          updateField(
                            field.id,
                            "label",
                            e.target.value,
                          )
                        }
                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Field type
                      </label>

                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(
                            field.id,
                            "type",
                            e.target.value,
                          )
                        }
                        className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                      >
                        <option value="text">Short text</option>
                        <option value="textarea">Long text</option>
                        <option value="email">Email</option>
                        <option value="number">Number</option>
                        <option value="phone">Phone</option>
                        <option value="date">Date</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Multiple choice</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                      aria-label={`Remove ${field.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {(field.type === "select" || field.type === "radio") && (
                  <div className="ml-8 mt-4">
                    <label className="text-xs font-medium text-muted-foreground">
                      Options
                    </label>

                    <input
                      value={field.options.join(", ")}
                      onChange={(e) =>
                        updateOptions(field.id, e.target.value)
                      }
                      placeholder="e.g. Beginner, Intermediate, Advanced"
                      className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                    />

                    <p className="mt-1 text-xs text-zinc-400">
                      Separate options with commas.
                    </p>
                  </div>
                )}

                <label className="ml-8 mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      updateField(
                        field.id,
                        "required",
                        e.target.checked,
                      )
                    }
                    className="h-4 w-4 rounded"
                  />

                  Required field
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Save */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : null}

            {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
          </button>
        </div>

      </div>
    </OrganizerLayout>
  )
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="text-sm font-medium">
        {label}

        {required && (
          <span className="ml-1 text-zinc-400">*</span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  )
}