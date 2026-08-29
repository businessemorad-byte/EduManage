"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Plan = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  priceMonthly: number | null;
  priceYearly: number | null;
  currency: string;
  features: Array<{ feature: { key: string }; isEnabled: boolean; limit: number | null }>;
};

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [interval, setInterval] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/plans")
      .then((r) => r.json())
      .then(setPlans)
      .catch(() => {});
  }, []);

  const checkout = async (planId: string) => {
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingInterval: interval }),
      });
      const data = await res.json();
      if (data.checkout?.url) {
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = data.checkout.url;
      } else if (data.subscription) {
        router.push("/billing");
      }
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Choose Your Plan</h1>
        <div className="flex items-center gap-2 border rounded-lg p-1">
          <button onClick={() => setInterval("MONTHLY")} className={`px-3 py-1 rounded text-sm ${interval === "MONTHLY" ? "bg-blue-600 text-white" : ""}`}>Monthly</button>
          <button onClick={() => setInterval("YEARLY")} className={`px-3 py-1 rounded text-sm ${interval === "YEARLY" ? "bg-blue-600 text-white" : ""}`}>Yearly</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const price = interval === "YEARLY" ? plan.priceYearly ?? plan.priceMonthly : plan.priceMonthly;
          return (
            <div key={plan.id} className="border rounded-lg p-6 bg-white flex flex-col">
              <h3 className="text-xl font-semibold">{plan.displayName}</h3>
              {plan.description && <p className="text-sm text-zinc-500 mt-1">{plan.description}</p>}
              <div className="mt-4 mb-6">
                <span className="text-3xl font-bold">{price ?? 0}</span>
                <span className="text-sm text-zinc-500"> {plan.currency}/{interval === "YEARLY" ? "yr" : "mo"}</span>
              </div>
              <ul className="space-y-2 flex-1 text-sm">
                {plan.features.filter((f) => f.isEnabled).slice(0, 8).map((f) => (
                  <li key={f.feature.key} className="flex items-center gap-2">
                    <span className="text-green-500">&#10003;</span>
                    {f.feature.key.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    {f.limit !== null && <span className="text-zinc-400 ml-auto">up to {f.limit}</span>}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => checkout(plan.id)}
                disabled={loading === plan.id}
                className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading === plan.id ? "Processing..." : "Get Started"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
