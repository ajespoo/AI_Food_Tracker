import React from "react";
import { Trash2, Utensils } from "lucide-react";
import { toast } from "react-hot-toast";
import { useFood } from "../../context/FoodContext";

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];

export default function FoodTracker() {
  const { records, removeRecord } = useFood();

  const handleDelete = async (id, name) => {
    try {
      await removeRecord(id);
      toast.success(`Removed ${name}`);
    } catch {
      toast.error("Failed to remove");
    }
  };

  const grouped = MEAL_ORDER.reduce((acc, meal) => {
    const items = records.filter((r) => r.meal_type === meal);
    if (items.length) acc[meal] = items;
    return acc;
  }, {});

  if (!records.length) {
    return (
      <div className="bg-white rounded-2xl shadow p-8 text-center">
        <Utensils size={40} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No food logged today. Use the + button to add meals.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-bold text-gray-900">Today's Food Log</h2>
      </div>
      {Object.entries(grouped).map(([meal, items]) => (
        <div key={meal}>
          <div className="px-4 py-2 bg-gray-50 border-b">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {meal}
            </span>
          </div>
          <ul className="divide-y divide-gray-50">
            {items.map((r) => (
              <li key={r.id} className="flex items-center px-4 py-3 hover:bg-gray-50 transition">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.food_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {Math.round(r.calories)} kcal · {Math.round(r.protein)}g P · {Math.round(r.carbs)}g C · {Math.round(r.fats)}g F
                    {r.source === "ai_vision" && (
                      <span className="ml-2 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">AI</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(r.id, r.food_name)}
                  className="ml-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
