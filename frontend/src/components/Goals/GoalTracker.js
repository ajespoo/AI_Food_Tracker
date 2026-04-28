import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useFood } from "../../context/FoodContext";

const MACROS = [
  { key: "calories", label: "Calories", unit: "kcal", color: "bg-orange-400" },
  { key: "protein", label: "Protein", unit: "g", color: "bg-blue-400" },
  { key: "carbs", label: "Carbs", unit: "g", color: "bg-yellow-400" },
  { key: "fats", label: "Fats", unit: "g", color: "bg-red-400" },
  { key: "fiber", label: "Fiber", unit: "g", color: "bg-green-400" },
  { key: "water_ml", label: "Water", unit: "ml", color: "bg-cyan-400" },
];

export default function GoalTracker() {
  const { goals, progress, updateGoals } = useFood();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm({ ...goals });
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateGoals(form);
      toast.success("Goals updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update goals");
    } finally {
      setSaving(false);
    }
  };

  const consumed = progress?.consumed || {};
  const waterConsumed = progress?.water_consumed_ml || 0;
  const pct = progress?.progress || {};

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Daily Goals</h2>
        {!editing && (
          <button onClick={startEdit} className="text-sm text-green-600 hover:underline">Edit</button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-4">
          {MACROS.map(({ key, label, unit, color }) => {
            const goal = goals?.[key] || 0;
            const actual = key === "water_ml" ? waterConsumed : (consumed[key] || 0);
            const percent = pct[key === "water_ml" ? "water" : key] || 0;
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="text-gray-900 font-medium">
                    {Math.round(actual)}<span className="text-gray-400">/{Math.round(goal)} {unit}</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {MACROS.map(({ key, label, unit }) => (
              <div key={key}>
                <label className="text-xs text-gray-500">{label} ({unit})</label>
                <input
                  type="number"
                  min="0"
                  value={form[key] || ""}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "Saving..." : "Save Goals"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 border rounded-lg text-sm text-gray-600">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
