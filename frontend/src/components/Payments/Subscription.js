import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Check, Zap, Crown } from "lucide-react";
import { API } from "../../context/AuthContext";
import { useAuth } from "../../context/AuthContext";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$9.99",
    period: "/ month",
    icon: <Zap size={20} />,
    features: [
      "Unlimited AI food scans",
      "Barcode & USDA search",
      "Advanced macro tracking",
      "Water intake tracker",
      "7-day history",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$79.99",
    period: "/ year",
    badge: "Save 33%",
    icon: <Crown size={20} />,
    features: [
      "Everything in Monthly",
      "365-day history & trends",
      "Google Fit integration",
      "Priority support",
      "Export to CSV",
    ],
  },
];

export default function Subscription() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState("");

  useEffect(() => {
    API.get("/payments/status")
      .then((r) => setStatus(r.data))
      .catch(() => {});
  }, []);

  const handleSubscribe = async (plan) => {
    setLoading(plan);
    try {
      const res = await API.post("/payments/checkout", { plan });
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.error || "Checkout failed");
      setLoading("");
    }
  };

  const handleManage = async () => {
    setLoading("manage");
    try {
      const res = await API.post("/payments/portal");
      window.location.href = res.data.url;
    } catch (err) {
      toast.error("Could not open billing portal");
      setLoading("");
    }
  };

  if (status?.is_premium) {
    return (
      <div className="bg-white rounded-2xl shadow p-6 text-center">
        <Crown size={48} className="text-yellow-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900">You're Premium</h2>
        <p className="text-gray-500 mt-1 mb-4">
          {status.subscription_plan} plan · {status.subscription_status}
        </p>
        {status.subscription_expires_at && (
          <p className="text-sm text-gray-400 mb-4">
            Renews {new Date(status.subscription_expires_at).toLocaleDateString()}
          </p>
        )}
        <button
          onClick={handleManage}
          disabled={loading === "manage"}
          className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {loading === "manage" ? "Opening..." : "Manage Subscription"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 text-center">Upgrade to Premium</h2>
      <p className="text-gray-500 text-center text-sm">Unlock AI-powered nutrition tracking</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border-2 p-6 flex flex-col ${plan.id === "yearly" ? "border-green-500 shadow-lg" : "border-gray-200"}`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                {plan.badge}
              </span>
            )}
            <div className="flex items-center gap-2 mb-2 text-green-600">{plan.icon}<span className="font-bold">{plan.name}</span></div>
            <div className="text-3xl font-bold text-gray-900">{plan.price}<span className="text-sm font-normal text-gray-500">{plan.period}</span></div>
            <ul className="mt-4 space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-green-500 mt-0.5 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={!!loading}
              className={`mt-5 w-full py-3 rounded-xl font-semibold transition disabled:opacity-50 ${
                plan.id === "yearly"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "border border-green-500 text-green-600 hover:bg-green-50"
              }`}
            >
              {loading === plan.id ? "Redirecting..." : `Get ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
