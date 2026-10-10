import { useState, useRef, } from "react"
import { useNavigate } from "react-router-dom"

const API_URL = "http://localhost:5001"

const Login = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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
        body: JSON.stringify({
          email,
          password,
        }),
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

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* Left Panel */}
        <section className="relative hidden min-h-screen overflow-hidden p-5 lg:flex">

          <div className="absolute inset-5 rounded-2xl bg-gradient-to-b from-zinc-800 via-zinc-500 to-zinc-100" />

          <div
            className="absolute inset-5 rounded-2xl opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, black 1px, transparent 0)",
              backgroundSize: "4px 4px",
            }}
          />

          <div className="relative z-10 flex min-h-[calc(100vh-2.5rem)] w-full flex-col justify-between rounded-2xl p-8 text-black sm:p-10">

            {/* Brand */}
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

            {/* Main Statement */}
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

            {/* Left Footer */}
            <p className="font-mono text-[10px] tracking-[0.12em] text-black/40">
              DIGITAL CERTIFICATES FOR EVENTS
            </p>
          </div>
        </section>

        {/* Right Panel */}
        <section className="relative flex min-h-screen flex-col bg-[#090909] px-6 py-7 sm:px-10 lg:px-14 xl:px-20">

          {/* Top */}
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
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-200"
            >
              Back to eCERTIFY
            </button>
          </div>

          {/* Login Content */}
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-md">

              {/* Heading */}
              <div>
                <h1 className="font-['Quicksand'] text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  Sign in to your
                  <br />
                  organizer workspace
                </h1>

                <p className="mt-4 max-w-md text-sm leading-6 text-zinc-500">
                  Manage your events, participants and certificates
                  from your eCERTIFY workspace.
                </p>
              </div>

              {/* Divider */}
              <div className="my-8 h-px bg-zinc-800" />

              {/* Error */}
              {error && (
                <div className="mb-6 border border-red-900/60 bg-red-950/30 px-4 py-3">
                  <p className="text-sm text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-6">

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2.5 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500"
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
                    className="h-11 w-full border border-zinc-800 bg-transparent px-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={() => console.log("Forgot password")}
                      className="text-xs text-zinc-600 transition-colors hover:text-zinc-300"
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
                    className="h-11 w-full border border-zinc-800 bg-transparent px-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Login */}
                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-white text-sm font-semibold tracking-wide text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {loading ? "SIGNING IN..." : "LOG IN"}
                </button>

              </form>

              {/* Access Note */}
              <div className="mt-7 border-t border-zinc-800 pt-5">
                <p className="text-center text-xs leading-5 text-zinc-600">
                  Organizer access is restricted to authorized accounts.
                </p>
              </div>

              {/* Footer */}
              <p className="mt-7 translate-y-16 text-center text-xs text-zinc-700">
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