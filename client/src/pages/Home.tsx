import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CodeSlots from "@/components/ui/code-slots"
import PatternWaves from "@/components/ui/pattern-waves"
import RubberSegment from "@/components/ui/rubber-segment"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import { useNavigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL

const Home = () => {
  const [mode, setMode] = useState<"Certificate" | "Verify">(
    "Certificate",
  )
  const [certificateCode, setCertificateCode] = useState("")
  const [status, setStatus] = useState<"idle" | "error" | "success">(
    "idle",
  )
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

    if (!/^[A-Z0-9]{8}$/.test(code)) {
      showError(
        code.length < 8
          ? "Please enter your 8-character access code."
          : "Access code can only contain letters and numbers."
      )
      return
    }

    // Open the tab synchronously during the click to avoid popup blocking.
    const certificateTab = window.open("about:blank", "_blank")

    if (!certificateTab) {
      showError("Please allow pop-ups for ecertify.tech and try again.")
      return
    }

    certificateTab.document.title = "Loading certificate..."
    certificateTab.document.body.innerHTML =
      '<p style="font-family: sans-serif; padding: 24px;">Loading your certificate...</p>'

    setLoading(true)
    clearError()

    try {
      const response = await fetch(
        `${API_URL}/api/certificates/access/${code}`
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.code === "NOT_ISSUED"
            ? "Your certificate has not been issued yet."
            : data.code === "REVOKED"
              ? "This certificate has been revoked."
              : data.code === "REMOVED"
                ? "This certificate is no longer available."
                : data.message || "Invalid access code."
        )
      }

      const pdfResponse = await fetch(
        `${API_URL}/api/certificates/access/${code}/pdf`
      )

      if (!pdfResponse.ok) {
        const pdfData = await pdfResponse.json().catch(() => null)
        throw new Error(
          pdfData?.message || "Unable to load your certificate."
        )
      }

      const blob = await pdfResponse.blob()

      if (blob.size === 0) {
        throw new Error("The certificate PDF is empty.")
      }

      const pdfUrl = URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" })
      )

      certificateTab.location.href = pdfUrl

      // Show the success checkmark briefly.
      setStatus("success")
      setErrorMessage("")

      window.setTimeout(() => {
        setCertificateCode("")
        setStatus("idle")
      }, 1200)

      // Keep the PDF URL alive while the new tab loads the certificate.
      window.setTimeout(() => {
        URL.revokeObjectURL(pdfUrl)
      }, 5 * 60 * 1000)
      } catch (error) {

      console.error("Get certificate error:", error)

      certificateTab.close()

      showError(
        error instanceof Error
          ? error.message
          : "Unable to retrieve certificate."
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
      showError("Certificate ID can only contain letters and numbers.")
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
    <main className="relative min-h-screen overflow-hidden bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {/* Light mode */}
        <div className="absolute inset-0 dark:hidden">
          <PatternWaves
            color="#111111"
            backgroundColor="#ffffff"
            opacity={0.3}
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

      
    {/* Floating Navigation Bar */}
    <header className="absolute left-1/2 top-5 z-40 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2">
      <nav className="flex h-16 items-center justify-between rounded-full border border-zinc-200/80 bg-white/90 px-5 shadow-lg shadow-black/[0.03] backdrop-blur-2xl transition-colors dark:border-white/10 dark:bg-[#080808]/90 sm:px-8">

        {/* Brand */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="shrink-0 font-['Quicksand'] text-xl font-bold tracking-tight text-zinc-950 transition-opacity hover:opacity-60 dark:text-white"
        >
          eCERTIFY
        </button>

        {/* Organizer Login */}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="group inline-flex h-10 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-[10px] font-bold tracking-[0.12em] text-white transition-all duration-200 hover:bg-zinc-700 active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 sm:px-6"
        >
          ORGANIZER LOGIN
          <span className="text-sm transition-transform duration-200 group-hover:translate-x-0.5">
            →
          </span>
        </button>

      </nav>
    </header>


      {/* Theme Switcher — original position and behavior preserved */}
      <div className="absolute right-6 top-6 z-50">
        <ThemeSwitcher />
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pb-10 pt-24">
        <div className="w-full max-w-md text-center">
          {/* Heading */}
          <h1 className="font-['Quicksand'] text-4xl font-bold tracking-tight sm:text-5xl">
            eCERTIFY
          </h1>

          <p className="mt-3 text-muted-foreground">
            Digital certificates for events
          </p>

          {/* Mode Switch */}
          <div className="mt-10 flex justify-center">
            <RubberSegment
              items={["Certificate", "Verify"]}
              value={mode}
              onChange={(value) => {
                setMode(value as "Certificate" | "Verify")
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

          {/* Certificate Access Code */}
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

          {/* Error Message */}
          <div className="mt-3 min-h-5">
            {status === "error" && (
              <p role="alert" className="text-sm text-red-500">
                {errorMessage}
              </p>
            )}
          </div>

          {/* Action Button */}
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
        </div>
      </div>
    </main>
  )
}

export default Home