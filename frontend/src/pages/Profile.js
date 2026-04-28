import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth, API } from "../context/AuthContext";
import Subscription from "../components/Payments/Subscription";
import Leaderboard from "../components/Social/Leaderboard";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", phone_number: user?.phone_number || "" });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("profile"); // profile | subscription | leaderboard

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.patch("/auth/profile", form);
      updateUser(res.data.user);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
          <h1 className="font-bold text-gray-900">Profile</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-green-100 text-green-700 font-bold text-2xl flex items-center justify-center mb-3">
            {(user?.name || user?.email || "U")[0].toUpperCase()}
          </div>
          <p className="font-bold text-gray-900">{user?.name || "User"}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className={`mt-2 text-xs px-2 py-0.5 rounded-full font-semibold ${user?.subscription_status === "active" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
            {user?.subscription_status === "active" ? `${user?.subscription_plan} Premium` : "Free plan"}
          </span>
        </div>

        <div className="flex border-b bg-white rounded-t-xl overflow-hidden shadow-sm">
          {[["profile", "Profile"], ["subscription", "Billing"], ["leaderboard", "Community"]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-3 text-sm font-medium transition ${tab === key ? "border-b-2 border-green-500 text-green-600 bg-green-50" : "text-gray-500 hover:text-gray-700"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <form onSubmit={handleSave} className="bg-white rounded-b-2xl shadow p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-3 border rounded-lg bg-gray-50 text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={form.phone_number}
                onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50 transition">
              <Save size={16} />{saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        )}

        {tab === "subscription" && (
          <div className="bg-white rounded-b-2xl shadow p-5">
            <Subscription />
          </div>
        )}

        {tab === "leaderboard" && <Leaderboard />}
      </div>
    </div>
  );
}
