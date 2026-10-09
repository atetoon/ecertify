import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { useNavigate } from "react-router-dom"

import OrganizerLayout from "@/components/organizer/organizer-layout"

const API_URL = "http://localhost:5001"

function Event() {
  const navigate = useNavigate()

  const [eventName, setEventName] = useState("")
  const [description, setDescription] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [organization, setOrganization] = useState("IGNITE")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eventName.trim() || !eventDate || !organization.trim()) {
      setError("Event name, event date and organisation are required.")
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
      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: eventName.trim(),
          description: description.trim(),
          date: eventDate,
          organization: organization.trim(),
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem("ecertify_token")
        navigate("/login")
        return
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to create event")
      }

      if (!data.event?.id) {
        throw new Error("Event was created but no event ID was returned.")
      }

      navigate(`/events/${data.event.id}`)
    } catch (err) {
      console.error("Create event error:", err)

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create event. Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <OrganizerLayout>
      <main className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-[#08080a]">
        <div className="mx-auto max-w-4xl">

          {/* Heading */}
          <div className="mb-10">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Events
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
              Create Event
            </h1>

            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Create an event and start collecting registrations.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleCreateEvent}
            className="
              max-w-2xl
              rounded-2xl
              border border-zinc-200
              bg-white
              p-7
              dark:border-zinc-800
              dark:bg-[#0d0d10]
            "
          >

            {/* Event Name */}
            <div>
              <label
                htmlFor="event-name"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Event Name
              </label>

              <input
                id="event-name"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Enter event name"
                disabled={loading}
                className="
                  h-11
                  w-full
                  rounded-xl
                  border border-zinc-200
                  bg-white
                  px-4
                  text-sm
                  outline-none
                  transition
                  placeholder:text-zinc-400
                  focus:border-zinc-400
                  focus:ring-2
                  focus:ring-zinc-200
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:border-zinc-800
                  dark:bg-zinc-900
                  dark:text-zinc-100
                  dark:focus:border-zinc-600
                  dark:focus:ring-zinc-800
                "
              />
            </div>

            {/* Description */}
            <div className="mt-7">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your event"
                rows={4}
                disabled={loading}
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border border-zinc-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  outline-none
                  transition
                  placeholder:text-zinc-400
                  focus:border-zinc-400
                  focus:ring-2
                  focus:ring-zinc-200
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:border-zinc-800
                  dark:bg-zinc-900
                  dark:text-zinc-100
                  dark:focus:border-zinc-600
                  dark:focus:ring-zinc-800
                "
              />
            </div>

            {/* Event Date */}
            <div className="mt-7">
              <label
                htmlFor="event-date"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Event Date
              </label>

              <div className="relative">
                <CalendarDays
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    h-4
                    w-4
                    -translate-y-1/2
                    text-zinc-400
                  "
                />

                <input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  disabled={loading}
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border border-zinc-200
                    bg-white
                    pl-10
                    pr-4
                    text-sm
                    outline-none
                    transition
                    focus:border-zinc-400
                    focus:ring-2
                    focus:ring-zinc-200
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    dark:border-zinc-800
                    dark:bg-zinc-900
                    dark:text-zinc-100
                    dark:focus:border-zinc-600
                    dark:focus:ring-zinc-800
                  "
                />
              </div>
            </div>

            {/* Organisation */}
            <div className="mt-7">
              <label
                htmlFor="organization"
                className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                Organisation
              </label>

              <input
                id="organization"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Enter organisation"
                disabled={loading}
                className="
                  h-11
                  w-full
                  rounded-xl
                  border border-zinc-200
                  bg-white
                  px-4
                  text-sm
                  outline-none
                  transition
                  placeholder:text-zinc-400
                  focus:border-zinc-400
                  focus:ring-2
                  focus:ring-zinc-200
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:border-zinc-800
                  dark:bg-zinc-900
                  dark:text-zinc-100
                  dark:focus:border-zinc-600
                  dark:focus:ring-zinc-800
                "
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Create Event */}
            <div className="mt-10 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="
                  rounded-xl
                  bg-zinc-950
                  px-6
                  py-3
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:bg-zinc-800
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:bg-zinc-100
                  dark:text-zinc-950
                  dark:hover:bg-zinc-300
                "
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </div>

          </form>
        </div>
      </main>
    </OrganizerLayout>
  )
}

export default Event