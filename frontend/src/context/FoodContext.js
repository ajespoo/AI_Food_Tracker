import React, { createContext, useContext, useState, useCallback } from "react";
import { format } from "date-fns";
import { API } from "./AuthContext";

const FoodContext = createContext(null);

export function FoodProvider({ children }) {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [goals, setGoals] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const loadDay = useCallback(async (dateStr) => {
    setLoading(true);
    try {
      const [recRes, progRes] = await Promise.all([
        API.get(`/food/records?date=${dateStr}`),
        API.get(`/goals/progress?date=${dateStr}`),
      ]);
      setRecords(recRes.data.records);
      setSummary(recRes.data);
      setProgress(progRes.data);
      setGoals(progRes.data.goals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRecord = (record) => {
    setRecords((prev) => [record, ...prev]);
  };

  const removeRecord = async (id) => {
    await API.delete(`/food/records/${id}`);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const updateGoals = async (data) => {
    const res = await API.put("/goals/macros", data);
    setGoals(res.data.goals);
  };

  return (
    <FoodContext.Provider value={{
      records, summary, goals, progress, loading,
      selectedDate, setSelectedDate,
      loadDay, addRecord, removeRecord, updateGoals,
    }}>
      {children}
    </FoodContext.Provider>
  );
}

export function useFood() {
  return useContext(FoodContext);
}
