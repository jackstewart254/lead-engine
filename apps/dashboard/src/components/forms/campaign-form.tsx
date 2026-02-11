"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { createCampaign } from "@/app/campaigns/actions";

const initialState = { error: "" };

export function CampaignForm() {
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
          placeholder="Hi {{owner_name}}, I noticed {{business_name}}..."
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
