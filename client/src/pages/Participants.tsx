import { useEffect, useMemo, useState } from "react"

import { useNavigate, useParams } from "react-router-dom"

import {

  AlertCircle,

  Check,

  CheckCircle2,

  ChevronLeft,

  Download,

  Loader2,

  Mail,

  Search,

  UserCheck,

  Users,

  X,

} from "lucide-react"



import OrganizerLayout from "@/components/organizer/organizer-layout"



const API_URL = "http://localhost:5001"



interface Participant {

  id: string

  name: string

  email: string

  eligible: boolean

  createdAt: string

}



interface ParticipantsResponse {

  success: boolean

  participants: Participant[]

  total: number

  eligible: number

  message?: string

}



interface IssueResponse {

  success: boolean

  issued: {

    participantId: string

    certificateId: string

    accessCode?: string

  }[]

  errors: {

    participantId: string

    message: string

  }[]

  message?: string

}



export default function Participants() {

  const { eventId } = useParams()

  const navigate = useNavigate()



  const [participants, setParticipants] = useState<

    Participant[]

  >([])



  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")



  const [search, setSearch] = useState("")

  const [selectedIds, setSelectedIds] = useState<

    string[]

  >([])



  const [updatingIds, setUpdatingIds] = useState<

    string[]

  >([])



  const [issuing, setIssuing] = useState(false)



  const [successMessage, setSuccessMessage] =

    useState("")



  const [issueErrors, setIssueErrors] = useState<

    {

      participantId: string

      message: string

    }[]

  >([])



  const token = localStorage.getItem(

    "ecertify_token",

  )



  useEffect(() => {

    if (!eventId) {

      setError("Event ID is missing")

      setLoading(false)

      return

    }



    if (!token) {

      navigate("/login")

      return

    }



    fetchParticipants()

  }, [eventId, navigate, token])



  async function fetchParticipants() {

    if (!eventId || !token) return



    setLoading(true)

    setError("")



    try {

      const response = await fetch(

        `${API_URL}/api/events/${eventId}/participants`,

        {

          headers: {

            Authorization: `Bearer ${token}`,

          },

        },

      )



      if (response.status === 401) {

        localStorage.removeItem(

          "ecertify_token",

        )

        navigate("/login")

        return

      }



      const data =

        (await response.json()) as ParticipantsResponse



      if (!response.ok || !data.success) {

        throw new Error(

          data.message ??

            "Unable to load participants",

        )

      }



      setParticipants(data.participants)

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Unable to load participants",

      )

    } finally {

      setLoading(false)

    }

  }



  const filteredParticipants = useMemo(() => {

    const query = search.trim().toLowerCase()



    if (!query) {

      return participants

    }



    return participants.filter(

      (participant) =>

        participant.name

          .toLowerCase()

          .includes(query) ||

        participant.email

          .toLowerCase()

          .includes(query),

    )

  }, [participants, search])



  const eligibleCount = participants.filter(

    (participant) => participant.eligible,

  ).length



  const selectedParticipants =

    participants.filter((participant) =>

      selectedIds.includes(participant.id),

    )



  const selectedEligibleParticipants =

    selectedParticipants.filter(

      (participant) => participant.eligible,

    )



  const allFilteredSelected =

    filteredParticipants.length > 0 &&

    filteredParticipants.every((participant) =>

      selectedIds.includes(participant.id),

    )



  function toggleSelected(id: string) {

    setSelectedIds((current) =>

      current.includes(id)

        ? current.filter(

            (participantId) =>

              participantId !== id,

          )

        : [...current, id],

    )

  }



  function toggleSelectAll() {

    const filteredIds =

      filteredParticipants.map(

        (participant) => participant.id,

      )



    if (allFilteredSelected) {

      setSelectedIds((current) =>

        current.filter(

          (id) => !filteredIds.includes(id),

        ),

      )

    } else {

      setSelectedIds((current) => [

        ...new Set([

          ...current,

          ...filteredIds,

        ]),

      ])

    }

  }



  async function updateEligibility(

    participantId: string,

    eligible: boolean,

  ) {

    if (!eventId || !token) return



    setUpdatingIds((current) => [

      ...current,

      participantId,

    ])



    setSuccessMessage("")

    setIssueErrors([])



    try {

      const response = await fetch(

        `${API_URL}/api/events/${eventId}/participants/${participantId}`,

        {

          method: "PATCH",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,

          },

          body: JSON.stringify({

            eligible,

          }),

        },

      )



      if (response.status === 401) {

        localStorage.removeItem(

          "ecertify_token",

        )

        navigate("/login")

        return

      }



      const data = await response.json()



      if (!response.ok || !data.success) {

        throw new Error(

          data.message ??

            "Unable to update eligibility",

        )

      }



      setParticipants((current) =>

        current.map((participant) =>

          participant.id === participantId

            ? {

                ...participant,

                eligible,

              }

            : participant,

        ),

      )

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Unable to update eligibility",

      )

    } finally {

      setUpdatingIds((current) =>

        current.filter(

          (id) => id !== participantId,

        ),

      )

    }

  }



  async function markSelectedEligible() {

    if (

      !eventId ||

      !token ||

      selectedIds.length === 0

    ) {

      return

    }



    const idsToUpdate = selectedIds.filter((id) => {

      const participant = participants.find(

        (item) => item.id === id,

      )



      return participant && !participant.eligible

    })



    if (idsToUpdate.length === 0) {

      return

    }



    setUpdatingIds(idsToUpdate)

    setSuccessMessage("")

    setIssueErrors([])



    try {

      const response = await fetch(

        `${API_URL}/api/events/${eventId}/participants`,

        {

          method: "PATCH",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,

          },

          body: JSON.stringify({

            participantIds: idsToUpdate,

            eligible: true,

          }),

        },

      )



      if (response.status === 401) {

        localStorage.removeItem(

          "ecertify_token",

        )

        navigate("/login")

        return

      }



      const data = await response.json()



      if (!response.ok || !data.success) {

        throw new Error(

          data.message ??

            "Unable to mark participants eligible",

        )

      }



      setParticipants((current) =>

        current.map((participant) =>

          idsToUpdate.includes(

            participant.id,

          )

            ? {

                ...participant,

                eligible: true,

              }

            : participant,

        ),

      )



      setSuccessMessage(

        `${idsToUpdate.length} participant${

          idsToUpdate.length === 1

            ? ""

            : "s"

        } marked eligible.`,

      )

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Unable to mark participants eligible",

      )

    } finally {

      setUpdatingIds([])

    }

  }



  async function issueCertificates() {

    if (

      !eventId ||

      !token ||

      selectedEligibleParticipants.length ===

        0

    ) {

      return

    }



    setIssuing(true)

    setSuccessMessage("")

    setIssueErrors([])

    setError("")



    try {

      const participantIds =

        selectedEligibleParticipants.map(

          (participant) => participant.id,

        )



      const response = await fetch(

        `${API_URL}/api/events/${eventId}/certificates/issue`,

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,

          },

          body: JSON.stringify({

            participantIds,

          }),

        },

      )



      if (response.status === 401) {

        localStorage.removeItem(

          "ecertify_token",

        )

        navigate("/login")

        return

      }



      const data =

        (await response.json()) as IssueResponse



      if (!response.ok || !data.success) {

        throw new Error(

          data.message ??

            "Unable to issue certificates",

        )

      }



      setIssueErrors(data.errors)



      if (data.issued.length > 0) {

        setSuccessMessage(

          `${data.issued.length} certificate${

            data.issued.length === 1

              ? ""

              : "s"

          } issued successfully.`,

        )

      }



      setSelectedIds([])



      await fetchParticipants()

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Unable to issue certificates",

      )

    } finally {

      setIssuing(false)

    }

  }



  function exportCsv() {

    if (participants.length === 0) return



    const header = [

      "Name",

      "Email",

      "Registered",

      "Eligible",

    ]



    const rows = participants.map(

      (participant) => [

        participant.name,

        participant.email,

        new Date(

          participant.createdAt,

        ).toLocaleDateString("en-IN"),

        participant.eligible

          ? "Yes"

          : "No",

      ],

    )



    const csv = [

      header,

      ...rows,

    ]

      .map((row) =>

        row

          .map(

            (value) =>

              `"${String(value).replaceAll(

                '"',

                '""',

              )}"`,

          )

          .join(","),

      )

      .join("\n")



    const blob = new Blob([csv], {

      type: "text/csv;charset=utf-8;",

    })



    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")



    link.href = url

    link.download =

      "participants.csv"



    document.body.appendChild(link)

    link.click()

    link.remove()



    URL.revokeObjectURL(url)

  }



  function formatDate(date: string) {

    return new Date(date).toLocaleDateString(

      "en-IN",

      {

        day: "2-digit",

        month: "short",

        year: "numeric",

      },

    )

  }



  return (

    <OrganizerLayout>

      <main className="px-5 py-8 pb-28 sm:px-8">

        <div className="mx-auto max-w-7xl">

          {/* Header */}

          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <button

                type="button"

                onClick={() =>

                  navigate(

                    `/events/${eventId}`,

                  )

                }

                className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white"

              >

                <ChevronLeft className="h-4 w-4" />

                Event Overview

              </button>



              <h1 className="font-['Quicksand'] text-3xl font-bold tracking-tight">

                Participants

              </h1>



              <p className="mt-2 text-sm text-zinc-500">

                Manage registrations and select

                participants for certificates.

              </p>

            </div>



            <button

              type="button"

              onClick={exportCsv}

              disabled={participants.length === 0}

              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"

            >

              <Download className="h-4 w-4" />

              Export CSV

            </button>

          </div>



          {/* Stats */}

          <div className="mb-6 grid gap-4 sm:grid-cols-3">

            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#0d0d0f]">

              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">

                <Users className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />

              </div>



              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">

                Registered

              </p>



              <p className="mt-1 text-2xl font-semibold">

                {participants.length}

              </p>

            </div>



            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#0d0d0f]">

              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">

                <UserCheck className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />

              </div>



              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">

                Eligible

              </p>



              <p className="mt-1 text-2xl font-semibold">

                {eligibleCount}

              </p>

            </div>



            <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#0d0d0f]">

              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">

                <CheckCircle2 className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />

              </div>



              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">

                Selected

              </p>



              <p className="mt-1 text-2xl font-semibold">

                {selectedIds.length}

              </p>

            </div>

          </div>



          {/* Feedback */}

          {successMessage && (

            <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400">

              <CheckCircle2 className="h-4 w-4 shrink-0" />

              <span>{successMessage}</span>

            </div>

          )}



          {error && (

            <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">

              <div className="flex items-center gap-3">

                <AlertCircle className="h-4 w-4 shrink-0" />

                <span>{error}</span>

              </div>



              <button

                type="button"

                onClick={() => setError("")}

                className="shrink-0"

              >

                <X className="h-4 w-4" />

              </button>

            </div>

          )}



          {issueErrors.length > 0 && (

            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">

              <p className="mb-2 text-sm font-medium text-amber-800 dark:text-amber-300">

                Some certificates could not be

                issued:

              </p>



              <div className="space-y-1">

                {issueErrors.map((item) => (

                  <p

                    key={item.participantId}

                    className="text-xs text-amber-700 dark:text-amber-400"

                  >

                    {item.message}

                  </p>

                ))}

              </div>

            </div>

          )}



          {/* Search */}

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="relative w-full sm:max-w-sm">

              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />



              <input

                value={search}

                onChange={(event) =>

                  setSearch(event.target.value)

                }

                placeholder="Search participants..."

                className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-[#0d0d0f] dark:focus:border-zinc-600"

              />

            </div>



            {selectedIds.length > 0 && (

              <p className="text-sm text-zinc-500">

                {selectedIds.length} selected

              </p>

            )}

          </div>



          {/* Table */}

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0d0d0f]">

            {loading ? (

              <div className="flex min-h-[360px] items-center justify-center">

                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />

              </div>

            ) : participants.length === 0 ? (

              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">

                <Users className="mb-4 h-8 w-8 text-zinc-300 dark:text-zinc-700" />



                <h2 className="text-sm font-semibold">

                  No participants yet

                </h2>



                <p className="mt-1 max-w-sm text-sm text-zinc-500">

                  Participants will appear here

                  after they register for the event.

                </p>

              </div>

            ) : filteredParticipants.length ===

              0 ? (

              <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">

                <Search className="mb-4 h-7 w-7 text-zinc-300 dark:text-zinc-700" />



                <h2 className="text-sm font-semibold">

                  No participants found

                </h2>



                <p className="mt-1 text-sm text-zinc-500">

                  Try a different name or email.

                </p>

              </div>

            ) : (

              <>

                {/* Desktop */}

                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full text-left">

                    <thead>

                      <tr className="border-b border-zinc-200 dark:border-zinc-800">

                        <th className="w-12 px-5 py-4">

                          <input

                            type="checkbox"

                            checked={

                              allFilteredSelected

                            }

                            onChange={

                              toggleSelectAll

                            }

                            className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:border-zinc-700 dark:accent-white"

                          />

                        </th>



                        <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider text-zinc-400">

                          Participant

                        </th>



                        <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider text-zinc-400">

                          Email

                        </th>



                        <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider text-zinc-400">

                          Registered

                        </th>



                        <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider text-zinc-400">

                          Eligibility

                        </th>

                      </tr>

                    </thead>



                    <tbody>

                      {filteredParticipants.map(

                        (participant) => {

                          const selected =

                            selectedIds.includes(

                              participant.id,

                            )



                          const updating =

                            updatingIds.includes(

                              participant.id,

                            )



                          return (

                            <tr

                              key={

                                participant.id

                              }

                              className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"

                            >

                              <td className="px-5 py-4">

                                <input

                                  type="checkbox"

                                  checked={

                                    selected

                                  }

                                  onChange={() =>

                                    toggleSelected(

                                      participant.id,

                                    )

                                  }

                                  className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:border-zinc-700 dark:accent-white"

                                />

                              </td>



                              <td className="px-4 py-4">

                                <div className="flex items-center gap-3">

                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">

                                    {participant.name

                                      .split(" ")

                                      .map(

                                        (part) =>

                                          part[0],

                                      )

                                      .join("")

                                      .slice(

                                        0,

                                        2,

                                      )

                                      .toUpperCase()}

                                  </div>



                                  <span className="text-sm font-medium">

                                    {

                                      participant.name

                                    }

                                  </span>

                                </div>

                              </td>



                              <td className="px-4 py-4">

                                <div className="flex items-center gap-2 text-sm text-zinc-500">

                                  <Mail className="h-3.5 w-3.5" />

                                  {

                                    participant.email

                                  }

                                </div>

                              </td>



                              <td className="px-4 py-4 text-sm text-zinc-500">

                                {formatDate(

                                  participant.createdAt,

                                )}

                              </td>



                              <td className="px-4 py-4">

                                <button

                                  type="button"

                                  disabled={

                                    updating

                                  }

                                  onClick={() =>

                                    updateEligibility(

                                      participant.id,

                                      !participant.eligible,

                                    )

                                  }

                                  className={[

                                    "inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors",

                                    participant.eligible

                                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/60"

                                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",

                                    updating

                                      ? "cursor-wait opacity-60"

                                      : "",

                                  ].join(" ")}

                                >

                                  {updating ? (

                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />

                                  ) : participant.eligible ? (

                                    <Check className="h-3.5 w-3.5" />

                                  ) : null}



                                  {participant.eligible

                                    ? "Eligible"

                                    : "Not eligible"}

                                </button>

                              </td>

                            </tr>

                          )

                        },

                      )}

                    </tbody>

                  </table>

                </div>



                {/* Mobile */}

                <div className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-900">

                  <div className="flex items-center gap-3 px-4 py-3">

                    <input

                      type="checkbox"

                      checked={

                        allFilteredSelected

                      }

                      onChange={

                        toggleSelectAll

                      }

                      className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:border-zinc-700 dark:accent-white"

                    />



                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">

                      Select all

                    </span>

                  </div>



                  {filteredParticipants.map(

                    (participant) => {

                      const selected =

                        selectedIds.includes(

                          participant.id,

                        )



                      const updating =

                        updatingIds.includes(

                          participant.id,

                        )



                      return (

                        <div

                          key={

                            participant.id

                          }

                          className="p-4"

                        >

                          <div className="flex items-start gap-3">

                            <input

                              type="checkbox"

                              checked={

                                selected

                              }

                              onChange={() =>

                                toggleSelected(

                                  participant.id,

                                )

                              }

                              className="mt-1 h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:border-zinc-700 dark:accent-white"

                            />



                            <div className="min-w-0 flex-1">

                              <div className="flex items-center justify-between gap-3">

                                <div className="min-w-0">

                                  <p className="truncate text-sm font-medium">

                                    {

                                      participant.name

                                    }

                                  </p>



                                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-zinc-500">

                                    <Mail className="h-3 w-3 shrink-0" />

                                    {

                                      participant.email

                                    }

                                  </p>

                                </div>



                                <button

                                  type="button"

                                  disabled={

                                    updating

                                  }

                                  onClick={() =>

                                    updateEligibility(

                                      participant.id,

                                      !participant.eligible,

                                    )

                                  }

                                  className={[

                                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",

                                    participant.eligible

                                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"

                                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400",

                                  ].join(" ")}

                                >

                                  {updating

                                    ? "..."

                                    : participant.eligible

                                      ? "Eligible"

                                      : "Not eligible"}

                                </button>

                              </div>



                              <p className="mt-3 text-xs text-zinc-400">

                                Registered{" "}

                                {formatDate(

                                  participant.createdAt,

                                )}

                              </p>

                            </div>

                          </div>

                        </div>

                      )

                    },

                  )}

                </div>

              </>

            )}

          </div>

        </div>

      {/* Bottom action bar */}

      {selectedIds.length > 0 && (

        <div className="sticky bottom-0 z-40 -mx-5 mt-5 sm:-mx-8 border-t border-zinc-200 bg-white/95 px-5 py-3 backdrop-blur dark:border-zinc-800 dark:bg-[#0b0b0d]/95">

          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">

                {selectedIds.length} participant

                {selectedIds.length === 1

                  ? ""

                  : "s"} selected

              </p>



              <p className="text-xs text-zinc-500 dark:text-zinc-400">

                {

                  selectedEligibleParticipants.length

                } eligible for certificates

              </p>

            </div>



            <div className="flex flex-wrap gap-2">

              <button

                type="button"

                onClick={() =>

                  setSelectedIds([])

                }

                disabled={issuing}

                className="h-9 rounded-lg px-3 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50 dark:hover:bg-zinc-900 dark:hover:text-white"

              >

                Clear

              </button>



              <button

                type="button"

                onClick={

                  markSelectedEligible

                }

                disabled={

                  issuing ||

                  selectedIds.every((id) => {

                    const participant =

                      participants.find(

                        (item) =>

                          item.id === id,

                      )



                    return (

                      participant?.eligible ??

                      false

                    )

                  })

                }

                className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"

              >

                <UserCheck className="h-4 w-4" />

                Mark Eligible

              </button>



              <button

                type="button"

                onClick={

                  issueCertificates

                }

                disabled={

                  issuing ||

                  selectedEligibleParticipants.length ===

                    0

                }

                className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"

              >

                {issuing ? (

                  <Loader2 className="h-4 w-4 animate-spin" />

                ) : (

                  <CheckCircle2 className="h-4 w-4" />

                )}



                {issuing

                  ? "Issuing..."

                  : "Issue Certificates"}

              </button>

            </div>

          </div>

        </div>

      )}

      </main>

    </OrganizerLayout>
  )
}
