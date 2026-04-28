import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User, Calendar, Trophy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardContent from "../components/Dashboard/Dashboard";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🥗</span>
            <span className="font-bold text-gray-900 text-sm">AI Food Tracker</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/calendar" className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600">
              <Calendar size={20} />
            </Link>
            <Link to="/profile" className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600">
              <User size={20} />
            </Link>
            <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-lg transition text-gray-400 hover:text-red-500">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <DashboardContent />
      </main>
    </div>
  );
}
