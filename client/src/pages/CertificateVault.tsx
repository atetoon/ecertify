import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Download,
  ExternalLink,
  FileCheck2,
  Loader2,
  Search,
  ShieldCheck,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import OrganizerLayout from "@/components/organizer/organizer-layout"

const API_URL = import.meta.env.VITE_API_URL

type CertificateStatus = "ISSUED" | "VERIFIED" | "REVOKED" | "REMOVED"

interface Certificate {
  id: string
  certificateId: string
  participantId: string
  participant: string
  email: string
  issuedAt: string
  verifiedAt: string | null
  status: CertificateStatus
}

interface CertificateResponse {
  success: boolean
  certificates: Certificate[]
  message?: string
}

interface StatItem {
  label: string
  value: number
  icon: LucideIcon
}

export default function CertificateVault() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem("ecertify_token")

  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null)
  const [revoking, setRevoking] = useState(false)

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

    void fetchCertificates()
  }, [eventId, navigate, token])

  async function fetchCertificates() {
    if (!eventId || !token) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/api/events/${eventId}/certificates`,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (response.status === 401) {
        localStorage.removeItem("ecertify_token")
        navigate("/login")
        return
      }

      const data = (await response.json()) as CertificateResponse

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Unable to load certificates")
      }

      setCertificates(data.certificates)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load certificates",
      )
    } finally {
      setLoading(false)
    }
  }

  const filteredCertificates = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return certificates

    return certificates.filter(
      (certificate) =>
        certificate.certificateId.toLowerCase().includes(query) ||
        certificate.participant.toLowerCase().includes(query) ||
        certificate.email.toLowerCase().includes(query),
    )
  }, [certificates, search])

  const verifiedCount = certificates.filter(
    (certificate) => certificate.status === "VERIFIED",
  ).length

  const revokedCount = certificates.filter(
    (certificate) => certificate.status === "REVOKED",
  ).length

  const stats: StatItem[] = [
    {
      label: "Issued",
      value: certificates.length,
      icon: FileCheck2,
    },
    {
      label: "Verified",
      value: verifiedCount,
      icon: ShieldCheck,
    },
    {
      label: "Revoked",
      value: revokedCount,
      icon: AlertCircle,
    },
  ]

  async function openCertificate(certificate: Certificate) {
    if (!eventId || !token) return

    setOpeningId(certificate.certificateId)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/api/events/${eventId}/certificates/${certificate.certificateId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (response.status === 401) {
        localStorage.removeItem("ecertify_token")
        navigate("/login")
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message ?? "Unable to open certificate")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      window.open(url, "_blank", "noopener,noreferrer")

      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to open certificate",
      )
    } finally {
      setOpeningId(null)
    }
  }

  async function downloadCertificate(certificate: Certificate) {
    if (!eventId || !token) return

    setOpeningId(certificate.certificateId)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/api/events/${eventId}/certificates/${certificate.certificateId}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } },
      )

      if (response.status === 401) {
        localStorage.removeItem("ecertify_token")
        navigate("/login")
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.message ?? "Unable to download certificate")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url
      link.download = `${certificate.certificateId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()

      URL.revokeObjectURL(url)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to download certificate",
      )
    } finally {
      setOpeningId(null)
    }
  }

  async function revokeCertificate() {
    if (!eventId || !token || !revokeTarget) return

    setRevoking(true)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/api/events/${eventId}/certificates/${revokeTarget.certificateId}/revoke`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (response.status === 401) {
        localStorage.removeItem("ecertify_token")
        navigate("/login")
        return
      }

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Unable to revoke certificate")
      }

      setCertificates((current) =>
        current.map((certificate) =>
          certificate.certificateId === revokeTarget.certificateId
            ? { ...certificate, status: "REVOKED" }
            : certificate,
        ),
      )

      setRevokeTarget(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to revoke certificate",
      )
    } finally {
      setRevoking(false)
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  function statusLabel(status: CertificateStatus) {
    if (status === "VERIFIED") return "Verified"
    if (status === "REVOKED") return "Revoked"
    if (status === "REMOVED") return "Removed"
    return "Issued"
  }

  function statusClasses(status: CertificateStatus) {
    if (status === "VERIFIED") {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
    }

    if (status === "REVOKED") {
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
    }

    if (status === "REMOVED") {
      return "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
    }

    return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
  }

  return (
    <OrganizerLayout>
      <main className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <button
              type="button"
              onClick={() => navigate(`/events/${eventId}`)}
              className="mb-4 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Event Overview
            </button>

            <h1 className="font-['Quicksand'] text-3xl font-bold tracking-tight">
              Certificate Vault
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              View and manage certificates issued for this event.
            </p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#0d0d0f]"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                </div>

                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                  {label}
                </p>

                <p className="mt-1 text-2xl font-semibold">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>

              <button type="button" onClick={() => setError("")}>
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mb-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search certificates..."
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-[#0d0d0f] dark:focus:border-zinc-600"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0d0d0f]">
            {loading ? (
              <div className="flex min-h-90 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="flex min-h-90 flex-col items-center justify-center px-6 text-center">
                <FileCheck2 className="mb-4 h-8 w-8 text-zinc-300 dark:text-zinc-700" />

                <h2 className="text-sm font-semibold">
                  {certificates.length === 0
                    ? "No certificates yet"
                    : "No certificates found"}
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {certificates.length === 0
                    ? "Certificates issued for this event will appear here."
                    : "Try a different search."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Certificate ID
                      </th>
                      <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Participant
                      </th>
                      <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Issued
                      </th>
                      <th className="px-4 py-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Status
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCertificates.map((certificate) => {
                      const busy =
                        openingId === certificate.certificateId || revoking

                      const canRevoke =
                        certificate.status !== "REVOKED" &&
                        certificate.status !== "REMOVED"

                      return (
                        <tr
                          key={certificate.id}
                          className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                        >
                          <td className="px-5 py-4">
                            <span className="font-mono text-sm font-medium">
                              {certificate.certificateId}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <p className="text-sm font-medium">
                              {certificate.participant}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              {certificate.email}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-sm text-zinc-500">
                            {formatDate(certificate.issuedAt)}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={[
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                                statusClasses(certificate.status),
                              ].join(" ")}
                            >
                              {certificate.status === "VERIFIED" && (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}

                              {statusLabel(certificate.status)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void openCertificate(certificate)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                              >
                                {openingId === certificate.certificateId ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ExternalLink className="h-3.5 w-3.5" />
                                )}
                                View
                              </button>

                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void downloadCertificate(certificate)
                                }
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-950 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </button>

                              {canRevoke && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => setRevokeTarget(certificate)}
                                  className="inline-flex h-8 items-center rounded-lg border border-amber-200 px-3 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-900/60 dark:text-amber-400 dark:hover:bg-amber-950/30"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#111113]"
          >
            <h2 className="text-lg font-semibold">
              Revoke certificate?
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              This will mark the certificate as revoked. Public verification
              will no longer consider this certificate valid.
            </p>

            <div className="mt-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <p className="font-mono text-sm font-medium">
                {revokeTarget.certificateId}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {revokeTarget.participant}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={revoking}
                onClick={() => setRevokeTarget(null)}
                className="h-9 rounded-lg border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={revoking}
                onClick={() => void revokeCertificate()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {revoking && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {revoking ? "Revoking..." : "Revoke Certificate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </OrganizerLayout>
  )
}
