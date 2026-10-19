
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "next-themes"

const API_URL = import.meta.env.VITE_API_URL

const Login = () => {
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()

  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    setError("")
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Invalid email or password")
        return
      }

      localStorage.setItem("ecertify_token", data.token)
      localStorage.setItem(
        "ecertify_organizer",
        JSON.stringify(data.organizer),
      )

      navigate("/dashboard")
    } catch {
      setError(
        "Unable to connect to the server. Make sure the backend is running.",
      )
    } finally {
      setLoading(false)
    }
  }

  const pageBg = isDark ? "bg-[#090909]" : "bg-white"
  const primaryText = isDark ? "text-white" : "text-zinc-950"
  const secondaryText = isDark ? "text-zinc-500" : "text-zinc-600"
  const borderColor = isDark ? "border-zinc-800" : "border-zinc-200"
  const inputText = isDark ? "text-white" : "text-zinc-950"
  const placeholder = isDark
    ? "placeholder:text-zinc-700"
    : "placeholder:text-zinc-400"

  return (
    <main className={`min-h-screen ${pageBg} ${primaryText}`}>
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* Left Panel */}
        <section
          className={`relative hidden min-h-screen overflow-hidden p-5 lg:flex ${
            isDark ? "bg-[#090909]" : "bg-white"
          }`}
        >
          <div
            className={`absolute inset-5 rounded-2xl bg-gradient-to-b ${
              isDark
                ? "from-zinc-800 via-zinc-500 to-zinc-100"
                : "from-zinc-500 via-zinc-300 to-zinc-100"
            }`}
          />

          <div
            className="absolute inset-5 rounded-2xl opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, black 1px, transparent 0)",
              backgroundSize: "4px 4px",
            }}
          />

          <div className="relative z-10 flex min-h-[calc(100vh-2.5rem)] w-full flex-col justify-between rounded-2xl p-8 text-black sm:p-10">
            <div className="flex items-center justify-between">
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

            <div className="max-w-xl py-16">
              <h2 className="font-['Quicksand'] text-4xl font-semibold leading-[1.05] tracking-tight xl:text-5xl">
                Issue certificates,
                <br />
                <span className="font-normal italic">
                  verify authenticity.
                </span>
              </h2>

              <p className="mt-6 max-w-md text-sm leading-6 text-black/60">
                Create, manage and verify digital certificates for your
                events through one simple platform.
              </p>
            </div>

            <p className="font-mono text-[10px] tracking-[0.12em] text-black/40">
              DIGITAL CERTIFICATES FOR EVENTS
            </p>
          </div>
        </section>

        {/* Right Panel */}
        <section className={`relative flex min-h-screen flex-col px-6 pt-10 pb-7 sm:px-10 sm:pt-12 sm:pb-7 lg:px-14 lg:pt-14 lg:pb-7 xl:px-20 ${pageBg}`}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-['Quicksand'] text-xl font-bold tracking-tight"
            >
              eCERTIFY
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className={`text-sm ${secondaryText} transition-colors ${
                isDark ? "hover:text-zinc-200" : "hover:text-zinc-950"
              }`}
            >
              Back to eCERTIFY
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-md">
              <div>
                <h1 className="font-['Quicksand'] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  Sign in to your
                  <br />
                  organizer workspace
                </h1>

                <p className={`mt-4 max-w-md text-sm leading-6 ${secondaryText}`}>
                  Manage your events, participants and certificates
                  from your eCERTIFY workspace.
                </p>
              </div>

              <div className={`my-8 h-px ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`} />

              {error && (
                <div className="mb-6 border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className={`mb-2.5 block text-xs font-medium uppercase tracking-[0.18em] ${secondaryText}`}
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="organizer@example.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                    className={`h-11 w-full border ${borderColor} bg-transparent px-4 text-sm ${inputText} ${placeholder} outline-none transition-colors focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50`}
                  />
                </div>

                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className={`text-xs font-medium uppercase tracking-[0.18em] ${secondaryText}`}
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={() => console.log("Forgot password")}
                      className={`text-xs transition-colors ${
                        isDark
                          ? "text-zinc-600 hover:text-zinc-300"
                          : "text-zinc-500 hover:text-zinc-950"
                      }`}
                    >
                      Forgot?
                    </button>
                  </div>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className={`h-11 w-full border ${borderColor} bg-transparent px-4 text-sm ${inputText} ${placeholder} outline-none transition-colors focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`h-11 w-full text-sm font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    isDark
                      ? "bg-white text-black hover:bg-zinc-200"
                      : "bg-zinc-950 text-white hover:bg-zinc-800"
                  }`}
                >
                  {loading ? "SIGNING IN..." : "LOG IN"}
                </button>
              </form>

              <div className={`mt-7 border-t ${borderColor} pt-5`}>
                <p className={`text-center text-xs leading-5 ${secondaryText}`}>
                  Organizer access is restricted to authorized accounts.
                </p>
              </div>

              <p className={`absolute bottom-20 left-0 right-0 text-center text-xs ${isDark ? "text-zinc-700" : "text-zinc-400"}`}>
                © 2026 eCERTIFY
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export default Login