import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, Droplets } from "lucide-react";
import { toast } from "react-hot-toast";
import { useFood } from "../../context/FoodContext";
import { API } from "../../context/AuthContext";
import GoalTracker from "../Goals/GoalTracker";
import FoodTracker from "../Goals/FoodTracker";
import FoodUpload from "./FoodUpload";

export default function Dashboard() {
  const { selectedDate, setSelectedDate, loadDay, progress } = useFood();
  const [showUpload, setShowUpload] = useState(false);
  const [waterLoading, setWaterLoading] = useState(false);

  useEffect(() => {
    loadDay(selectedDate);
  }, [selectedDate, loadDay]);

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    if (d <= new Date()) setSelectedDate(format(d, "yyyy-MM-dd"));
  };

  const logWater = async (amount) => {
    setWaterLoading(true);
    try {
      await API.post("/goals/water", { amount_ml: amount });
      toast.success(`+${amount}ml water logged`);
      loadDay(selectedDate);
    } catch {
      toast.error("Failed to log water");
    } finally {
      setWaterLoading(false);
    }
  };

  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");
  const consumed = progress?.consumed || {};
  const goals = progress?.goals || {};
  const calPct = goals.calories ? Math.min((consumed.calories / goals.calories) * 100, 100) : 0;
  const remaining = Math.max((goals.calories || 0) - (consumed.calories || 0), 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronLeft size={20} /></button>
        <div className="text-center">
          <p className="font-bold text-gray-900">{isToday ? "Today" : format(new Date(selectedDate + "T00:00:00"), "EEEE, MMM d")}</p>
          <p className="text-xs text-gray-500">{selectedDate}</p>
        </div>
        <button onClick={() => changeDate(1)} disabled={isToday} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition"><ChevronRight size={20} /></button>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-green-100 text-sm">Calories consumed</p>
            <p className="text-4xl font-bold">{Math.round(consumed.calories || 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-sm">Remaining</p>
            <p className="text-2xl font-bold">{Math.round(remaining)}</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3">
          <div
            className="bg-white h-3 rounded-full transition-all duration-700"
            style={{ width: `${calPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-green-100">
          <span>Goal: {Math.round(goals.calories || 0)} kcal</span>
          <span>{Math.round(calPct)}% complete</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
          {[["Protein", consumed.protein, "g"], ["Carbs", consumed.carbs, "g"], ["Fats", consumed.fats, "g"]].map(([label, val, unit]) => (
            <div key={label} className="text-center">
              <p className="text-xl font-bold">{Math.round(val || 0)}{unit}</p>
              <p className="text-xs text-green-100">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets size={18} className="text-cyan-500" />
            <span className="font-medium text-gray-900 text-sm">Water</span>
            <span className="text-sm text-gray-500">{Math.round(progress?.water_consumed_ml || 0)} / {goals.water_ml || 2000} ml</span>
          </div>
        </div>
        <div className="flex gap-2">
          {[150, 250, 350, 500].map((ml) => (
            <button
              key={ml}
              onClick={() => logWater(ml)}
              disabled={waterLoading}
              className="flex-1 py-2 text-xs font-medium bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg disabled:opacity-50 transition"
            >
              +{ml}ml
            </button>
          ))}
        </div>
      </div>

      <GoalTracker />
      <FoodTracker />

      {isToday && (
        <button
          onClick={() => setShowUpload(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-xl flex items-center justify-center transition"
        >
          <Plus size={28} />
        </button>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <FoodUpload onClose={() => { setShowUpload(false); loadDay(selectedDate); }} />
        </div>
      )}
    </div>
  );
}
