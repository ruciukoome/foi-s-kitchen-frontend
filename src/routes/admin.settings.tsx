import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleAlert, KeyRound, Mail, Send } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth";
import {
  getEmailSettings,
  saveResendKey,
  sendTestEmail,
  type EmailSettings,
} from "@/lib/email.functions";
import { fieldClass, primaryButtonClass, outlineButtonClass } from "@/lib/ui";

export const Route = createFileRoute("/admin/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Email Settings — Foi's Kitchen" },
      { name: "description", content: "Connect Resend and manage order email addresses." },
      { property: "og:title", content: "Email Settings — Foi's Kitchen" },
      { property: "og:description", content: "Internal email integration settings." },
    ],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { client } = useAuth();
  const loadSettings = useServerFn(getEmailSettings);
  const saveKey = useServerFn(saveResendKey);
  const sendTest = useServerFn(sendTestEmail);

  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const getToken = useCallback(async () => {
    if (!client) throw new Error("Not signed in");
    const { data } = await client.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Not signed in");
    return token;
  }, [client]);

  const refresh = useCallback(async () => {
    try {
      const token = await getToken();
      setSettings(await loadSettings({ data: { accessToken: token } }));
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load settings.");
    }
  }, [getToken, loadSettings]);

  useEffect(() => {
    if (client) void refresh();
  }, [client, refresh]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const token = await getToken();
      const res = await saveKey({ data: { accessToken: token, apiKey: apiKey.trim() } });
      if (!res.ok) {
        setSaveMsg({ kind: "err", text: res.error ?? "Could not save the key." });
      } else {
        setSaveMsg({ kind: "ok", text: apiKey.trim() ? "Resend key saved. Email sending is now live." : "Saved key removed." });
        setApiKey("");
        await refresh();
      }
    } catch (err) {
      setSaveMsg({ kind: "err", text: err instanceof Error ? err.message : "Could not save the key." });
    } finally {
      setSaving(false);
    }
  };

  const onTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestMsg(null);
    try {
      const token = await getToken();
      const res = await sendTest({ data: { accessToken: token, to: testTo.trim() } });
      setTestMsg(
        res.ok
          ? { kind: "ok", text: `Test email sent to ${testTo.trim()}. Check the inbox (and spam folder).` }
          : { kind: "err", text: res.error ?? "The test email failed." },
      );
    } catch (err) {
      setTestMsg({ kind: "err", text: err instanceof Error ? err.message : "The test email failed." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminShell title="Email settings" note="Connect Resend so orders and quotations arrive by email.">
      {loadError ? <p role="alert" className="mb-4 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">{loadError}</p> : null}

      {/* Connection status */}
      <section className="rounded-2xl border border-foreground/10 bg-card p-6">
        <div className="flex items-start gap-3">
          {settings?.connected ? (
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden />
          ) : (
            <CircleAlert className="mt-0.5 h-6 w-6 shrink-0 text-gold" aria-hidden />
          )}
          <div>
            <h2 className="font-display text-lg font-semibold">
              {settings?.connected ? "Resend is connected" : "Resend is not connected yet"}
            </h2>
            <p className="mt-1 text-sm text-foreground/70">
              {settings?.connected
                ? `Using a key from ${settings.source === "environment" ? "your hosting environment" : "this dashboard"} (${settings.keyPreview}).`
                : "Paste your Resend API key below to switch on order and quotation emails."}
            </p>
          </div>
        </div>
        {settings ? (
          <dl className="mt-5 grid gap-3 border-t border-gold/40 pt-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="label-caps text-foreground/60">Order emails from</dt>
              <dd className="mt-1 break-all">{settings.ordersFrom}</dd>
            </div>
            <div>
              <dt className="label-caps text-foreground/60">Quotation emails from</dt>
              <dd className="mt-1 break-all">{settings.supportFrom}</dd>
            </div>
            <div>
              <dt className="label-caps text-foreground/60">New orders go to</dt>
              <dd className="mt-1 break-all">{settings.inbox}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      {/* API key form */}
      <section className="mt-6 rounded-2xl border border-foreground/10 bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <KeyRound className="h-5 w-5 text-primary" aria-hidden /> Resend API key
        </h2>
        <p className="mt-1 text-sm text-foreground/70">
          In Resend, open <strong>API Keys → Create API Key</strong>, copy it, and paste it here.
          The key is stored in your database and only admins can see this page. Leave the box empty
          and save to remove a previously saved key.
        </p>
        <form onSubmit={onSave} className="mt-4 space-y-3">
          <label className="block">
            <span className="label-caps mb-1 block text-foreground/70">API key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="re_••••••••••••••••"
              autoComplete="off"
              className={fieldClass}
            />
          </label>
          {saveMsg ? <p role="status" className={`rounded-xl px-4 py-3 text-sm ${saveMsg.kind === "ok" ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary"}`}>{saveMsg.text}</p> : null}
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? "Saving…" : "Save key"}
          </button>
        </form>
      </section>

      {/* Test email */}
      <section className="mt-6 rounded-2xl border border-foreground/10 bg-card p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Mail className="h-5 w-5 text-primary" aria-hidden /> Send a test email
        </h2>
        <p className="mt-1 text-sm text-foreground/70">
          Until your domain is verified in Resend, test emails only reach the email address on your
          Resend account.
        </p>
        <form onSubmit={onTest} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="you@example.com"
            className={`${fieldClass} sm:flex-1`}
            aria-label="Test email address"
          />
          <button type="submit" disabled={testing || !settings?.connected} className={outlineButtonClass}>
            <Send className="mr-2 h-4 w-4" aria-hidden />
            {testing ? "Sending…" : "Send test"}
          </button>
        </form>
        {testMsg ? (
          <div className="mt-3">
            <p role="status" className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary">{testMsg.text}</p>
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
