import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Camera, Target, BarChart2, Smartphone, Check } from "lucide-react";

// Standalone ad unit for the public landing page (no auth required)
const PUBLISHER_ID = "ca-pub-XXXXXXXXXXXXXXXX";
function LandingAd({ slot, className = "" }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (pushed.current) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); pushed.current = true; } catch {}
  }, []);
  return (
    <div className={`w-full text-center ${className}`}>
      <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

const FEATURES = [
  { icon: <Camera size={28} />, title: "AI Food Scanning", desc: "Photograph any meal and get instant macro breakdown with GPT-4o vision." },
  { icon: <Target size={28} />, title: "Custom Goals", desc: "Set personalized calorie and macro targets tailored to your lifestyle." },
  { icon: <BarChart2 size={28} />, title: "Progress Analytics", desc: "Track trends over days, weeks, and months with visual charts." },
  { icon: <Smartphone size={28} />, title: "Mobile App", desc: "Native iOS & Android app for tracking on the go." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥗</span>
          <span className="font-bold text-gray-900">AI Food Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Log in</Link>
          <Link to="/register" className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition">
            Start free
          </Link>
        </div>
      </nav>

      <section className="text-center py-20 px-6 bg-gradient-to-b from-green-50 to-white">
        <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          Powered by GPT-4o Vision
        </span>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          Track nutrition<br />with a single photo
        </h1>
        <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
          Point your camera at any meal. Our AI identifies the food and calculates calories, protein, carbs, and fats instantly.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to="/register" className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition text-lg">
            Get started free
          </Link>
          <Link to="/login" className="px-8 py-4 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition text-lg">
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">No credit card required · Free forever tier</p>
      </section>

      {/* Ad below hero — high-visibility placement */}
      <div className="max-w-3xl mx-auto px-6 py-4">
        <LandingAd slot="1234567890" />
      </div>

      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything you need</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                {icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ad between features and CTA */}
      <div className="max-w-3xl mx-auto px-6 pb-4">
        <LandingAd slot="0987654321" />
      </div>

      <section className="py-16 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Start tracking smarter today</h2>
        <p className="text-green-100 mb-8">Join thousands using AI to hit their nutrition goals.</p>
        <Link to="/register" className="inline-block px-8 py-4 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition text-lg">
          Create free account
        </Link>
      </section>

      <footer className="text-center py-8 text-sm text-gray-400 border-t">
        © {new Date().getFullYear()} AI Food Tracker. Built with 🥗 and GPT-4o.
      </footer>
    </div>
  );
}
