import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CodeSlots from "@/components/ui/code-slots"
import PatternWaves from "@/components/ui/pattern-waves"
import RubberSegment from "@/components/ui/rubber-segment"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import { useNavigate } from "react-router-dom"

const API_URL = "http://localhost:5001"

const Home = () => {
  const [mode, setMode] = useState<"Certificate" | "Verify">("Certificate")
  const [certificateCode, setCertificateCode] = useState("")
  const [status, setStatus] = useState<
    "idle" | "error" | "success"
  >("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const showError = (message: string) => {
    setStatus("error")
    setErrorMessage(message)
  }

  useEffect(() => {
    if (status !== "error") return

    const timer = setTimeout(() => {
      setStatus("idle")
      setErrorMessage("")
    }, 2000)

    return () => clearTimeout(timer)
  }, [status])

  const clearError = () => {
    setStatus("idle")
    setErrorMessage("")
  }

  const handleGetCertificate = async () => {
    const code = certificateCode.trim().toUpperCase()

    if (code.length < 8) {
      showError("Please enter your 8-character access code.")
      return
    }

    if (!/^[A-Z0-9]{8}$/.test(code)) {
      showError(
        "Access code can only contain letters and numbers.",
      )
      return
    }

    setLoading(true)
    clearError()

    try {
      const response = await fetch(
        `${API_URL}/api/certificates/access/${code}`,
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        if (data.code === "NOT_ISSUED") {
          showError(
            "Your certificate has not been issued yet.",
          )
        } else if (data.code === "REVOKED") {
          showError(
            "This certificate has been revoked.",
          )
        } else if (data.code === "REMOVED") {
          showError(
            "This certificate is no longer available.",
          )
        } else {
          showError(
            data.message || "Invalid access code.",
          )
        }

        return
      }

      setStatus("success")

      /*
       * Fetch the actual certificate PDF.
       */
      const pdfResponse = await fetch(
        `${API_URL}/api/certificates/access/${code}/pdf`,
      )

      if (!pdfResponse.ok) {
        const pdfData = await pdfResponse
          .json()
          .catch(() => null)

        throw new Error(
          pdfData?.message ||
            "Unable to load your certificate.",
        )
      }

      const blob = await pdfResponse.blob()
      const pdfUrl = URL.createObjectURL(blob)

      window.open(
        pdfUrl,
        "_blank",
        "noopener,noreferrer",
      )

      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 60_000)
    } catch (error) {
      console.error(
        "Get certificate error:",
        error,
      )

      showError(
        error instanceof Error
          ? error.message
          : "Unable to retrieve certificate.",
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCertificate = () => {
    const code = certificateCode.trim().toUpperCase()

    if (!code) {
      showError("Please enter a certificate ID.")
      return
    }

    if (!/^[A-Z0-9]+$/.test(code)) {
      showError(
        "Certificate ID can only contain letters and numbers.",
      )
      return
    }

    setStatus("success")
    setErrorMessage("")

    navigate(`/verify/${code}`)
  }

  const handleAction = () => {
    if (loading) return

    if (mode === "Certificate") {
      void handleGetCertificate()
      return
    }

    handleVerifyCertificate()
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white dark:bg-zinc-950">

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
      <div className="absolute right-6 top-6 z-20">
        <ThemeSwitcher />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6">

        <div className="w-full max-w-md text-center">

          {/* Logo */}
          <h1 className="font-['Quicksand'] text-4xl font-bold tracking-tight">
            eCERTIFY
          </h1>

          <p className="mt-3 text-muted-foreground">
            Digital certificates for events
          </p>

          {/* Mode switch */}
          <div className="mt-10 flex justify-center">
            <RubberSegment
              items={["Certificate", "Verify"]}
              value={mode}
              onChange={(value) => {
                setMode(
                  value as "Certificate" | "Verify",
                )
                setCertificateCode("")
                setLoading(false)
                clearError()
              }}
              size="md"
              equalSlots
              draggable
              trackColor="#e5e7eb"
              thumbColor="#18181b"
              textColor="#18181b"
              activeTextColor="#ffffff"
              radius={20}
              inset={3}
              stretch={100}
              squash={3}
              speed={1}
              glide={75}
              aria-label="Certificate actions"
            />
          </div>

          {/* Certificate access code */}
          {mode === "Certificate" ? (
            <div className="mt-10 flex justify-center">
              <CodeSlots
                length={8}
                value={certificateCode}
                status={status}
                onChange={(code) => {
                  setCertificateCode(code)
                  if (status === "error") {
                    clearError()
                  }
                }}
                onComplete={(code) => {
                  setCertificateCode(code)
                }}
                accentColor="#18181b"
                inkColor="#18181b"
                slotColor="#d1d5db"
                digitColor="#ffffff"
                dangerColor="#ff3b30"
                slotSize={44}
                gap={8}
                radius={12}
                bounce={0.2}
                settle={0.3}
                rise={8}
                cascade={20}
                mask={false}
                caret
                disabled={loading}
                ariaLabel="Certificate access code"
              />
            </div>
          ) : (

            /* Certificate ID */
            <div className="mt-10">
              <Input
                value={certificateCode}
                onChange={(e) => {
                  const value = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")

                  setCertificateCode(value)

                  if (status === "error") {
                    clearError()
                  }
                }}
                placeholder="CERT2026004821"
                disabled={loading}
                className={`h-12 text-center text-base uppercase ${
                  status === "error"
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
                aria-label="Certificate ID"
              />
            </div>
          )}

          {/* Error message */}
          <div className="mt-3 min-h-5">
            {status === "error" && (
              <p className="text-sm text-red-500">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Action button */}
          <Button
            className="mt-3 w-full"
            onClick={handleAction}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : mode === "Certificate"
                ? "Get Certificate"
                : "Verify Certificate"}
          </Button>

          {/* Organizer login */}
          <div className="mt-8">
            <button
              type="button"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => navigate("/login")}
            >
              Organizer Login →
            </button>
          </div>

        </div>
      </div>
    </main>
  )
}

export default Home