
import { useEffect, useState, type FormEvent } from "react";
import {
  UserRound,
  ShieldCheck,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";

import OrganizerLayout from "@/components/organizer/organizer-layout";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

const API_URL = import.meta.env.VITE_API_URL;

interface Organizer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

async function settingsRequest(
  endpoint: string,
  options: RequestInit = {},
) {
  const token = localStorage.getItem("ecertify_token");

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  const response = await fetch(`${API_URL}/api/settings${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (response.status === 401) {
    localStorage.removeItem("ecertify_token");
    localStorage.removeItem("ecertify_organizer");
    window.location.assign("/login");
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export default function SettingsPage() {
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);
  const [securityFeedback, setSecurityFeedback] = useState<Feedback>(null);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        const data = await settingsRequest("");

        if (cancelled) return;

        setOrganizer(data.organizer);
        setName(data.organizer.name);

        // Keep the cached display details in sync with the database.
        localStorage.setItem(
          "ecertify_organizer",
          JSON.stringify(data.organizer),
        );
      } catch (error) {
        if (!cancelled) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to load your settings.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileFeedback(null);

    if (!name.trim()) {
      setProfileFeedback({
        type: "error",
        message: "Name cannot be empty.",
      });
      return;
    }

    setSavingProfile(true);

    try {
      const data = await settingsRequest("/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });

      setOrganizer(data.organizer);
      setName(data.organizer.name);

      localStorage.setItem(
        "ecertify_organizer",
        JSON.stringify(data.organizer),
      );

      setProfileFeedback({
        type: "success",
        message: "Your profile has been updated.",
      });
    } catch (error) {
      setProfileFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to update your profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSecurityFeedback(null);

    if (newPassword.length < 8) {
      setSecurityFeedback({
        type: "error",
        message: "Your new password must be at least 8 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityFeedback({
        type: "error",
        message: "New passwords do not match.",
      });
      return;
    }

    setChangingPassword(true);

    try {
      const data = await settingsRequest("/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSecurityFeedback({
        type: "success",
        message: data.message || "Password changed successfully.",
      });
    } catch (error) {
      setSecurityFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to change your password.",
      });
    } finally {
      setChangingPassword(false);
    }
  }

  const inputClass =
    "mt-2 h-11 w-full rounded-lg border border-zinc-200 bg-transparent px-3 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:focus:border-zinc-400";

  const labelClass = "text-sm font-medium";

  function FeedbackMessage({ feedback }: { feedback: Feedback }) {
    if (!feedback) return null;

    return (
      <p
        role="status"
        className={`text-sm ${
          feedback.type === "success"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {feedback.message}
      </p>
    );
  }

  return (
    <OrganizerLayout>
      <main className="mx-auto max-w-5xl space-y-8 p-5 sm:p-8 lg:p-10">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Settings
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Manage your profile, account security, and dashboard preferences.
          </p>
        </header>

        {pageError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          >
            {pageError}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-zinc-200 p-8 text-sm text-zinc-500 dark:border-zinc-800">
            Loading settings...
          </div>
        ) : (
          <>
            {/* Profile */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#0b0b0d] sm:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
                  <UserRound size={21} />
                </div>
                <div>
                  <h2 className="font-semibold">Profile settings</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Edit your organizer name and view your account details.
                  </p>
                </div>
              </div>

              <form onSubmit={saveProfile} className="mt-7 space-y-5">
                <div>
                  <label htmlFor="organizer-name" className={labelClass}>
                    Organizer name
                  </label>
                  <input
                    id="organizer-name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setProfileFeedback(null);
                    }}
                    maxLength={100}
                    required
                    className={inputClass}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="organizer-email" className={labelClass}>
                    Email address
                  </label>
                  <input
                    id="organizer-email"
                    type="email"
                    value={organizer?.email ?? ""}
                    readOnly
                    className={`${inputClass} cursor-not-allowed text-zinc-500`}
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Email address changes are not supported here.
                  </p>
                </div>

                {organizer?.createdAt && (
                  <p className="text-xs text-zinc-500">
                    Account created{" "}
                    {new Date(organizer.createdAt).toLocaleDateString()}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    {savingProfile ? "Saving..." : "Save profile"}
                  </button>
                  <FeedbackMessage feedback={profileFeedback} />
                </div>
              </form>
            </section>

            {/* Security */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#0b0b0d] sm:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
                  <ShieldCheck size={21} />
                </div>
                <div>
                  <h2 className="font-semibold">Security</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Change your password to keep your account secure.
                  </p>
                </div>
              </div>

              <form onSubmit={changePassword} className="mt-7 space-y-5">
                <div>
                  <label htmlFor="current-password" className={labelClass}>
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) =>
                      setCurrentPassword(event.target.value)
                    }
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className={labelClass}>
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    minLength={8}
                    required
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs text-zinc-500">
                    Use at least 8 characters.
                  </p>
                </div>

                <div>
                  <label htmlFor="confirm-password" className={labelClass}>
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    minLength={8}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    {changingPassword ? "Updating..." : "Change password"}
                  </button>
                  <FeedbackMessage feedback={securityFeedback} />
                </div>
              </form>
            </section>

            {/* Preferences */}
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#0b0b0d] sm:p-8">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
                  <SlidersHorizontal size={21} />
                </div>
                <div>
                  <h2 className="font-semibold">Preferences</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Customize the appearance of your dashboard.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-between gap-5 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <p className="text-sm font-medium">Dashboard appearance</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Switch between light and dark themes using your appearance control.
                  </p>
                </div>
                <ThemeSwitcher />
              </div>

              <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <CheckCircle2 size={15} />
                Theme selection is handled by your existing theme provider.
              </p>
            </section>
          </>
        )}
      </main>
    </OrganizerLayout>
  );
}
