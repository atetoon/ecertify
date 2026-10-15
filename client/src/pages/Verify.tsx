import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import PatternWaves from "@/components/ui/pattern-waves"
import { VerifiedBadge } from "@/components/ui/verified-badge"

import {
  Loader2,
  AlertTriangle,
  XCircle,
  Trash2,
} from "lucide-react"

type VerificationStatus =
  | "loading"
  | "verified"
  | "invalid"
  | "revoked"
  | "removed"

interface Certificate {
  recipient?: string
  event?: string
  organization?: string
  certificateId: string
  issuedDate?: string
  revokedDate?: string | null
}

interface VerificationResponse {
  success: boolean
  status?: "VERIFIED" | "REVOKED" | "REMOVED" | "INVALID"
  message?: string
  certificate?: Certificate
}

const API_URL = import.meta.env.VITE_API_URL

const formatDate = (value?: string | null) => {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

const Verify = () => {
  const { certificateId } = useParams()

  const [status, setStatus] =
    useState<VerificationStatus>("loading")

  const [certificate, setCertificate] = useState<Certificate>({
    certificateId: certificateId || "",
  })

  useEffect(() => {
    let cancelled = false

    const verifyCertificate = async () => {
      if (!certificateId) {
        setStatus("invalid")
        return
      }

      setStatus("loading")
      setCertificate({
        certificateId,
      })

      try {
        const response = await fetch(
          `${API_URL}/api/certificates/${encodeURIComponent(
            certificateId,
          )}`,
        )

        const data =
          (await response.json()) as VerificationResponse

        if (cancelled) return

        if (!response.ok) {
          setStatus("invalid")
          return
        }

        if (data.status === "VERIFIED") {
          setCertificate({
            ...data.certificate,
            certificateId:
              data.certificate?.certificateId || certificateId,
            issuedDate: formatDate(
              data.certificate?.issuedDate,
            ),
          })

          setStatus("verified")
          return
        }

        if (data.status === "REVOKED") {
          setCertificate({
            ...data.certificate,
            certificateId:
              data.certificate?.certificateId || certificateId,
            issuedDate: formatDate(
              data.certificate?.issuedDate,
            ),
            revokedDate: formatDate(
              data.certificate?.revokedDate,
            ),
          })

          setStatus("revoked")
          return
        }

        if (data.status === "REMOVED") {
          setCertificate({
            certificateId:
              data.certificate?.certificateId || certificateId,
          })

          setStatus("removed")
          return
        }

        setStatus("invalid")
      } catch (error) {
        console.error(
          "Certificate verification failed:",
          error,
        )

        if (!cancelled) {
          setStatus("invalid")
        }
      }
    }

    void verifyCertificate()

    return () => {
      cancelled = true
    }
  }, [certificateId])

  const renderStatus = () => {
    switch (status) {
      case "loading":
        return (
          <>
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />

              <span className="text-sm font-bold tracking-[0.18em]">
                VERIFYING
              </span>
            </div>

            <h2 className="mt-5 font-['Quicksand'] text-2xl font-bold sm:text-3xl">
              Checking Certificate
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we verify this certificate.
            </p>
          </>
        )

      case "verified":
        return (
          <>
            <div className="flex items-center gap-2">
              <VerifiedBadge
                variant="shimmer"
                size={24}
              />

              <span className="text-sm font-bold tracking-[0.18em]">
                VERIFIED
              </span>
            </div>

            <h2 className="mt-5 font-['Quicksand'] text-2xl font-bold sm:text-3xl">
              Certificate Authentic
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              This certificate has been successfully verified.
            </p>
          </>
        )

      case "invalid":
        return (
          <>
            <div className="flex items-center gap-2 text-red-500">
              <XCircle className="h-6 w-6" />

              <span className="text-sm font-bold tracking-[0.18em]">
                INVALID
              </span>
            </div>

            <h2 className="mt-5 font-['Quicksand'] text-2xl font-bold sm:text-3xl">
              Certificate Not Found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              We couldn't find a certificate matching this ID.
            </p>
          </>
        )

      case "revoked":
        return (
          <>
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-6 w-6" />

              <span className="text-sm font-bold tracking-[0.18em]">
                REVOKED
              </span>
            </div>

            <h2 className="mt-5 font-['Quicksand'] text-2xl font-bold sm:text-3xl">
              Certificate Revoked
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              This certificate was previously issued but is no longer valid.
            </p>
          </>
        )

      case "removed":
        return (
          <>
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Trash2 className="h-5 w-5" />

              <span className="text-sm font-bold tracking-[0.18em]">
                REMOVED
              </span>
            </div>

            <h2 className="mt-5 font-['Quicksand'] text-2xl font-bold sm:text-3xl">
              Certificate No Longer Available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              This certificate has been removed from the eCERTIFY
              verification database and can no longer be verified.
            </p>
          </>
        )
    }
  }

  const showDetails =
    status === "verified" ||
    status === "revoked"

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {/* Light mode */}
        <div className="absolute inset-0 dark:hidden">
          <PatternWaves
            color="#111111"
            backgroundColor="#ffffff"
            opacity={0.30}
            interactive={false}
            preset="silk"
            fade="edges"
          />
        </div>

        {/* Dark mode */}
        <div className="absolute inset-0 hidden dark:block">
          <PatternWaves
            color="#ffffff"
            backgroundColor="#09090b"
            opacity={0.35}
            interactive={false}
            preset="silk"
            fade="edges"
          />
        </div>
      </div>

      {/* Theme switcher */}
      <div className="fixed right-6 top-6 z-30">
        <ThemeSwitcher />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-20">
        {/* Header */}
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            eCERTIFY
          </p>

          <h1 className="font-['Quicksand'] text-4xl font-bold tracking-tight sm:text-5xl">
            Verification page
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            Verify the authenticity and details of an event certificate
            issued through eCERTIFY.
          </p>
        </div>

        {/* Verification card */}
        <section className="mt-12 w-full max-w-2xl rounded-[28px] border border-zinc-200/80 bg-white/80 p-7 shadow-[0_20px_70px_-30px_rgba(0,0,0,0.25)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/75 dark:shadow-black/30">
          {/* Status */}
          <div className="flex flex-col items-center text-center">
            {renderStatus()}
          </div>

          {/* Divider */}
          <div className="my-10 h-px bg-zinc-200 dark:bg-zinc-800" />

          {/* Loading */}
          {status === "loading" && (
            <div className="flex flex-col items-center py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Certificate ID
              </p>

              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                <code className="text-sm font-medium tracking-wider">
                  {certificate.certificateId}
                </code>
              </div>
            </div>
          )}

          {/* Invalid */}
          {status === "invalid" && (
            <div className="flex flex-col items-center py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Certificate ID
              </p>

              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 dark:border-red-900/50 dark:bg-red-950/20">
                <code className="text-sm font-medium tracking-wider text-red-600 dark:text-red-400">
                  {certificate.certificateId}
                </code>
              </div>
            </div>
          )}

          {/* Removed */}
          {status === "removed" && (
            <div className="flex flex-col items-center py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Certificate ID
              </p>

              <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                <code className="text-sm font-medium tracking-wider">
                  {certificate.certificateId}
                </code>
              </div>

              <p className="mt-6 max-w-md text-xs leading-5 text-muted-foreground">
                If you believe this certificate was removed in error,
                please contact the issuing organization.
              </p>
            </div>
          )}

          {/* Certificate details */}
          {showDetails && (
            <div className="space-y-7">
              {/* Issued to */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Issued to
                </p>

                <p className="mt-2 font-['Quicksand'] text-xl font-semibold">
                  {certificate.recipient}
                </p>
              </div>

              {/* Event */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Event
                </p>

                <p className="mt-2 text-lg font-medium">
                  {certificate.event}
                </p>
              </div>

              {/* Organization */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Organization
                </p>

                <p className="mt-2 text-lg font-medium">
                  {certificate.organization}
                </p>
              </div>

              {/* Certificate ID */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Certificate ID
                </p>

                <div className="mt-2 inline-flex rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                  <code className="text-sm font-medium tracking-wider">
                    {certificate.certificateId}
                  </code>
                </div>
              </div>

              {/* Issued */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Issued
                </p>

                <p className="mt-2 text-base font-medium">
                  {certificate.issuedDate}
                </p>
              </div>

              {/* Revoked */}
              {status === "revoked" && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500">
                    Revoked
                  </p>

                  <p className="mt-2 text-base font-medium">
                    {certificate.revokedDate}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Card footer */}
          <div className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <p className="text-center text-xs text-muted-foreground">
              {status === "verified"
                ? "Verified by "
                : "Information provided by "}

              <span className="font-semibold text-foreground">
                eCERTIFY
              </span>
            </p>
          </div>
        </section>

        {/* Page footer */}
        <p className="mt-7 text-center text-xs text-muted-foreground">
          Certificate information is provided by the issuing organization.
        </p>
      </div>
    </main>
  )
}

export default Verify