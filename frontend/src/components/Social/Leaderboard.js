import React from "react";
import { Trophy, Medal } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const MOCK = [
  { name: "Alex K.", calories: 1820, streak: 14, avatar: "AK" },
  { name: "Sam L.", calories: 1950, streak: 9, avatar: "SL" },
  { name: "Jordan M.", calories: 1760, streak: 21, avatar: "JM" },
  { name: "Riley P.", calories: 2100, streak: 5, avatar: "RP" },
  { name: "Casey T.", calories: 1680, streak: 30, avatar: "CT" },
];

const medals = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const { user } = useAuth();
  const sorted = [...MOCK].sort((a, b) => b.streak - a.streak);

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <div className="p-4 border-b flex items-center gap-2">
        <Trophy size={20} className="text-yellow-500" />
        <h2 className="font-bold text-gray-900">Streak Leaderboard</h2>
      </div>
      <ul className="divide-y divide-gray-50">
        {sorted.map((member, i) => (
          <li key={member.name} className="flex items-center px-4 py-3">
            <span className="w-8 text-center text-lg">{medals[i] || i + 1}</span>
            <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center ml-2">
              {member.avatar}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{member.name}</p>
              <p className="text-xs text-gray-500">{member.calories} kcal today</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-orange-500">{member.streak}</p>
              <p className="text-xs text-gray-400">day streak</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="p-4 bg-green-50 text-center">
        <p className="text-xs text-green-700">Social features with real friends coming soon!</p>
      </div>
    </div>
  );
}
