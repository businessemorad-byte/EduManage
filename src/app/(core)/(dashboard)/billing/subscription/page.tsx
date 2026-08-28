"use client";

import { useEffect, useState } from "react";

type Subscription = {
  id: string;
  status: string;
  billingInterval: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  plan: { displayName: string; priceMonthly: number | null; priceYearly: number | null };
};

export default function SubscriptionPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/billing/subscription")
      .then((r) => r.json())
      .then(setSub)
      .catch(() => {});
  }, []);

  const cancel = async (atPeriodEnd: boolean) => {
    if (!sub) return;
    setLoading(true);
    try {
      await fetch("/api/billing/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: sub.id, action: "cancel", atPeriodEnd }),
      });
      setSub((prev) => prev ? { ...prev, cancelAtPeriodEnd: atPeriodEnd } : null);
    } catch {}
    setLoading(false);
  };

  const reactivate = async () => {
    if (!sub) return;
    setLoading(true);
    try {
      await fetch("/api/billing/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: sub.id, action: "reactivate" }),
      });
      setSub((prev) => prev ? { ...prev, cancelAtPeriodEnd: false } : null);
    } catch {}
    setLoading(false);
  };

  if (!sub) return <div className="p-8 text-center text-zinc-500">No active subscription</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>

      <div className="border rounded-lg p-6 bg-white dark:bg-zinc-900 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-zinc-500">Plan</p>
            <p className="font-medium">{sub.plan.displayName}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Status</p>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              sub.status === "ACTIVE" ? "bg-green-100 text-green-800" :
              sub.status === "TRIAL" ? "bg-blue-100 text-blue-800" :
              sub.status === "PAST_DUE" ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }`}>{sub.status}</span>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Billing Interval</p>
            <p className="font-medium">{sub.billingInterval}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Current Period</p>
            <p className="font-medium">
              {sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString() : "-"} - {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "-"}
            </p>
          </div>
        </div>

        {sub.cancelAtPeriodEnd && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">Your subscription will be canceled at the end of the current billing period.</p>
            <button onClick={reactivate} disabled={loading} className="mt-2 text-sm text-green-600 hover:underline disabled:opacity-50">Reactivate subscription</button>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          {!sub.cancelAtPeriodEnd ? (
            <>
              <button onClick={() => cancel(true)} disabled={loading} className="px-4 py-2 border rounded-lg text-sm hover:bg-zinc-50 disabled:opacity-50">
                Cancel at Period End
              </button>
              <button onClick={() => cancel(false)} disabled={loading} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50">
                Cancel Immediately
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
