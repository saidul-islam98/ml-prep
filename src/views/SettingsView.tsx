/**
 * Settings view (WEBAPP_SPEC.md sections 6.8, 9, 13): fixed reminder with
 * installed/verified status, Google Calendar + ICS controls, account and
 * sign-out, canonical plan window, optional-track status, data export, and
 * documented account-deletion path. No admin authority in the browser.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TEMPLATE_V1 } from "../template/templateV1";
import { generateReminderIcs } from "../reminder/ical";
import { buildGoogleCalendarUrl } from "../reminder/googleCalendar";
import { isValidHttpsUrl } from "../lib/constants";
import { useApi } from "../hooks/useApi";
import { useProfile } from "../hooks/useProfile";
import { signOut, useSession } from "../auth/useSession";
import { Badge, Button, PageHeader } from "../components/ui";

/** The deployed Today URL for this installation. */
export function deployedTodayUrl(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/today`;
}

export function SettingsView() {
  const api = useApi();
  const queryClient = useQueryClient();
  const session = useSession();
  const { data: profile } = useProfile();
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const updateProfile = useMutation({
    mutationFn: (fields: { reminder_installed_at?: string; reminder_verified_at?: string }) =>
      api.updateProfileReminder(fields),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const appUrl = deployedTodayUrl();

  function googleCalendarUrl(): string {
    return buildGoogleCalendarUrl({
      planStartDate: TEMPLATE_V1.windowStart,
      appUrl,
    });
  }

  function downloadIcs() {
    try {
      const ics = generateReminderIcs({
        planStartDate: TEMPLATE_V1.windowStart,
        appUrl,
      });
      const blob = new Blob([ics], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "cohere-preparation-reminder.ics";
      anchor.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setError(null);
    } catch {
      setError("The reminder file could not be generated. Check the deployed URL.");
    }
  }

  const installed = profile?.reminder_installed_at ?? null;
  const verified = profile?.reminder_verified_at ?? null;
  const reminderStatus = verified
    ? "verified on device"
    : installed
      ? "installed"
      : "not installed";

  const email =
    session.status === "authenticated" ? (session.session.user.email ?? "unknown") : "unknown";

  return (
    <div className="settings-view">
      <PageHeader title="Settings" description="Reminder, plan, and private account controls." />

      <section aria-labelledby="account-title" className="settings-section settings-account">
        <h2 id="account-title">Account</h2>
        <p>
          Signed in as <strong>{email}</strong>
        </p>
        <Button variant="danger" onClick={() => void signOut()}>
          Sign out
        </Button>
        <p className="overdue-note">
          Signing out clears the session and all cached data on this device.
        </p>
      </section>

      <section aria-labelledby="reminder-title" className="settings-section settings-reminder">
        <h2 id="reminder-title">Daily reminder</h2>
        <p>
          Fixed at <strong>5:00 PM America/Toronto</strong>, every day, for the canonical plan
          window ({TEMPLATE_V1.windowStart} to {TEMPLATE_V1.windowEnd}). Changing the time or
          timezone is deferred: an imported calendar event cannot be reliably edited by this app.
        </p>
        <p>
          {`Status: ${reminderStatus}${
            installed
              ? ` - added ${new Date(installed).toLocaleString("en-CA", { timeZone: "America/Toronto" })}`
              : ""
          }${
            verified
              ? ` - verified ${new Date(verified).toLocaleString("en-CA", { timeZone: "America/Toronto" })}`
              : ""
          }`}
        </p>
        <p className="overdue-note">
          The event contains no private task details. If you re-import,
          <strong> delete the old event first</strong> - Google Calendar may otherwise create a
          duplicate.
        </p>
        <div className="task-actions">
          <a
            className="button-link"
            href={googleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              updateProfile.mutate({ reminder_installed_at: new Date().toISOString() })
            }
          >
            Add to Google Calendar
          </a>
          <button type="button" onClick={downloadIcs}>
            Download .ics
          </button>
        </div>
        {downloaded && (
          <p role="status" className="overdue-note">
            Reminder file downloaded. Import it into Google Calendar, then mark it verified after
            checking the next occurrence on your device.
          </p>
        )}
        <div className="task-actions">
          <button
            type="button"
            disabled={!installed || updateProfile.isPending}
            onClick={() => updateProfile.mutate({ reminder_verified_at: new Date().toISOString() })}
          >
            Mark verified on device
          </button>
        </div>
        {error && (
          <p role="alert" className="task-error-text">
            {error}
          </p>
        )}
      </section>

      <section aria-labelledby="plan-title" className="settings-section settings-plan">
        <h2 id="plan-title">Plan window</h2>
        <p>
          Canonical window:{" "}
          <strong>
            {TEMPLATE_V1.windowStart} - {TEMPLATE_V1.windowEnd}
          </strong>{" "}
          (14 weeks, America/Toronto). Dates are not globally movable in MVP.
        </p>
        <p>
          Optional Post-Training track:{" "}
          <Badge tone={profile?.post_training_enabled ? "success" : "warning"}>
            {profile?.post_training_enabled ? "enabled" : "locked"}
          </Badge>{" "}
          - enable it from the Projects view after both required projects' completion gates pass.
        </p>
      </section>

      <ExportSection />

      <section aria-labelledby="deletion-title" className="settings-section settings-deletion">
        <h2 id="deletion-title">Account deletion</h2>
        <p className="overdue-note">
          Deletion is performed by the operator in the Supabase Dashboard: deleting the Auth user
          cascades every owned application row. The browser never receives admin authority. See{" "}
          <code>docs/runbook.md</code> for the exact steps and recovery limits.
        </p>
      </section>
    </div>
  );
}

function ExportSection() {
  const api = useApi();
  const [error, setError] = useState<string | null>(null);
  const exportMutation = useMutation({
    mutationFn: () => api.exportAllData(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ml-prep-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setError(null);
    },
    onError: () => setError("Export failed. Check your connection and try again."),
  });

  return (
    <section aria-labelledby="export-title" className="settings-section settings-export">
      <h2 id="export-title">Data export</h2>
      <p className="overdue-note">
        Downloads every row you own as a local JSON file. The export never contains credentials -
        the app never holds any.
      </p>
      <Button
        type="button"
        onClick={() => exportMutation.mutate()}
        disabled={exportMutation.isPending}
      >
        {exportMutation.isPending ? "Exporting…" : "Export all data (JSON)"}
      </Button>
      {error && (
        <p role="alert" className="task-error-text">
          {error}
        </p>
      )}
    </section>
  );
}

export { isValidHttpsUrl };
