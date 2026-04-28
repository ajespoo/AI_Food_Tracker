import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Replace these with your real AdSense publisher ID and slot IDs from adsense.google.com
const PUBLISHER_ID = "ca-pub-XXXXXXXXXXXXXXXX";

const SLOT_IDS = {
  leaderboard: "1234567890",   // 728x90 — homepage between sections
  rectangle:   "0987654321",   // 300x250 — dashboard in-feed
  banner:      "1122334455",   // responsive — mobile/narrow
};

export default function AdBanner({ slot = "rectangle", className = "" }) {
  const { user } = useAuth();
  const adRef = useRef(null);
  const pushed = useRef(false);

  // Premium users see no ads — ad-free is a premium perk
  if (user?.subscription_status === "active") return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      // adsbygoogle not loaded yet (dev/adblocker)
    }
  }, []);

  const slotId = SLOT_IDS[slot] || SLOT_IDS.rectangle;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Sponsored</span>
        {user && (
          <Link to="/profile" className="text-[10px] text-green-600 hover:underline">
            Remove ads →
          </Link>
        )}
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slotId}
        data-ad-format={slot === "leaderboard" ? "horizontal" : "auto"}
        data-full-width-responsive="true"
      />
    </div>
  );
}
