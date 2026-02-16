"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { createCampaign } from "@/app/campaigns/actions";
interface AccountOption {
  id: string;
  label: string;
  sender_email: string;
}

const initialState = { error: "" };

export function CampaignForm({ emailAccounts }: { emailAccounts: AccountOption[] }) {
  const [state, formAction, pending] = useActionState(createCampaign, initialState);

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card-bg p-6 shadow-[var(--shadow-md)]">
      <h2 className="mb-4 text-lg font-semibold">Create Campaign</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">
            Campaign Name
          </label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Q1 Dentists Glasgow"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">
            Target Category
          </label>
          <input
            name="target_category"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="dentists"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">
            Target Location
          </label>
          <input
            name="target_location"
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Glasgow"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-muted">
            Send From
          </label>
          <select
            name="email_account_id"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Default (env vars)</option>
            {emailAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.label} ({account.sender_email})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-muted">
          Email Template
        </label>
        <textarea
          name="email_template"
          required
          rows={6}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
          placeholder={"Hi {{first_name}}, how are you doing?\n\nI'm Jack Stewart, I run a company called Mclean Stewart. Just wanted to introduce myself and what we do in case it's ever useful to you.\n\nWe build bespoke software, websites, and AI tools for businesses. The idea is simple — we look at how a business actually operates and build technology around that...\n\nIf you'd like to find out more, have a look at our website: mcleanstewart.co.uk.\n\nFeel free to get in touch if you ever have any enquiries — always happy to have a chat.\n\nAll the best.\n\nVariables: {{first_name}}, {{owner_name}}, {{business_name}}, {{website}}, {{role}}, {{category}}, {{location}}\n\n(Signature is added automatically — don't include a sign-off)"}
        />
      </div>
      {state.error && (
        <p className="mt-3 text-sm text-danger">{state.error}</p>
      )}
      <motion.button
        type="submit"
        disabled={pending}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="mt-4 rounded-lg bg-info px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-info/90 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create Campaign"}
      </motion.button>
    </form>
  );
}
