import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isFuture } from "date-fns";
import { API } from "../context/AuthContext";
import { useFood } from "../context/FoodContext";

export default function CalendarPage() {
  const { setSelectedDate } = useFood();
  const [month, setMonth] = useState(new Date());
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [month]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await API.get("/food/history?days=30");
      const map = {};
      res.data.records.forEach((r) => {
        if (!map[r.date]) map[r.date] = { calories: 0, count: 0 };
        map[r.date].calories += r.calories;
        map[r.date].count += 1;
      });
      setHistory(map);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startPad = getDay(days[0]);

  const changeMonth = (dir) => {
    setMonth((m) => {
      const nm = new Date(m);
      nm.setMonth(nm.getMonth() + dir);
      return nm;
    });
  };

  const selectDay = (d) => {
    if (isFuture(d) && !isToday(d)) return;
    setSelectedDate(format(d, "yyyy-MM-dd"));
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></Link>
          <h1 className="font-bold text-gray-900">History</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
            <h2 className="font-bold text-gray-900">{format(month, "MMMM yyyy")}</h2>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const data = history[key];
              const future = isFuture(day) && !isToday(day);
              const today = isToday(day);
              return (
                <button
                  key={key}
                  onClick={() => selectDay(day)}
                  disabled={future}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium transition
                    ${today ? "bg-green-500 text-white" : ""}
                    ${data && !today ? "bg-green-50 text-green-700" : ""}
                    ${!data && !today && !future ? "hover:bg-gray-50 text-gray-700" : ""}
                    ${future ? "text-gray-200 cursor-not-allowed" : ""}
                  `}
                >
                  <span>{format(day, "d")}</span>
                  {data && <span className="text-[10px] opacity-80">{Math.round(data.calories)}</span>}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-50 border border-green-200 inline-block" />Logged</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" />Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
