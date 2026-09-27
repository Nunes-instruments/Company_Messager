"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <button
      className="iconButton"
      aria-label="Sign out"
      title="Sign out"
      disabled={loading}
      onClick={logout}
    >
      <LogOut size={19} />
    </button>
  );
}
