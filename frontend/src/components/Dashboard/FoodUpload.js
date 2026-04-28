import React, { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { Camera, Upload, Search, X } from "lucide-react";
import { API } from "../../context/AuthContext";
import { useFood } from "../../context/FoodContext";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function FoodUpload({ onClose }) {
  const [tab, setTab] = useState("image"); // image | manual | search
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mealType, setMealType] = useState("snack");
  const [manual, setManual] = useState({ food_name: "", calories: "", protein: "", carbs: "", fats: "", serving_size: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const fileRef = useRef();
  const { addRecord } = useFood();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setAiResult(null);
  };

  const handleImageAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("meal_type", mealType);
      const res = await API.post("/food/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      setAiResult(res.data.nutrition);
      addRecord(res.data.food);
      toast.success(`Logged: ${res.data.food.food_name}`);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.error || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleManualLog = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/food/log", { ...manual, meal_type: mealType, source: "manual" });
      addRecord(res.data.food);
      toast.success(`Logged: ${manual.food_name}`);
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.error || "Log failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await API.get(`/food/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.results);
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = async (food) => {
    setLoading(true);
    try {
      const res = await API.post("/food/log", { ...food, meal_type: mealType, source: "usda" });
      addRecord(res.data.food);
      toast.success(`Logged: ${food.food_name}`);
      onClose?.();
    } catch {
      toast.error("Failed to log food");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold text-gray-900">Log Food</h2>
        {onClose && <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>}
      </div>

      <div className="flex border-b">
        {[["image", "📷 AI Scan"], ["manual", "✏️ Manual"], ["search", "🔍 Search"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-medium transition ${tab === key ? "border-b-2 border-green-500 text-green-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Meal Type</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {MEAL_TYPES.map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
          </select>
        </div>

        {tab === "image" && (
          <div className="space-y-4">
            {!preview ? (
              <button
                onClick={() => fileRef.current.click()}
                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-green-400 transition"
              >
                <Camera size={32} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Tap to upload food photo</span>
              </button>
            ) : (
              <div className="relative">
                <img src={preview} alt="food" className="w-full h-48 object-cover rounded-xl" />
                <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                  <X size={16} />
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              onClick={handleImageAnalyze}
              disabled={!file || loading}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50 transition"
            >
              {loading ? "Analyzing with AI..." : "Analyze & Log"}
            </button>
          </div>
        )}

        {tab === "manual" && (
          <form onSubmit={handleManualLog} className="space-y-3">
            <input
              type="text"
              placeholder="Food name"
              value={manual.food_name}
              onChange={(e) => setManual((p) => ({ ...p, food_name: e.target.value }))}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="grid grid-cols-2 gap-3">
              {[["calories", "Calories (kcal)"], ["protein", "Protein (g)"], ["carbs", "Carbs (g)"], ["fats", "Fats (g)"]].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500">{label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={manual[key]}
                    onChange={(e) => setManual((p) => ({ ...p, [key]: e.target.value }))}
                    required={key === "calories"}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50 transition">
              {loading ? "Logging..." : "Log Food"}
            </button>
          </form>
        )}

        {tab === "search" && (
          <div className="space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search USDA database..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button type="submit" disabled={loading} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">
                <Search size={16} />
              </button>
            </form>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {searchResults.map((food, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectResult(food)}
                  className="w-full text-left p-3 border rounded-lg hover:bg-green-50 hover:border-green-300 transition"
                >
                  <div className="font-medium text-sm text-gray-900">{food.food_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {Math.round(food.calories)} kcal · {Math.round(food.protein)}g protein · {Math.round(food.carbs)}g carbs · {Math.round(food.fats)}g fat
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
