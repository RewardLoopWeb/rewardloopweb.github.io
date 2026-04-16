// main.js — renders homepage lists, handles click → transition or direct giveaway

import { loadActiveGiveaways, clearAllAccess, hasValidAccess } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const activeList   = document.getElementById("active-list");
  const upcomingList = document.getElementById("upcoming-list");
  const endedList    = document.getElementById("ended-list");
  const resetBtn     = document.getElementById("reset-session");
  const now          = new Date();

  async function loadAndRender() {
    const giveaways = await loadActiveGiveaways();

    const active   = [];
    const upcoming = [];
    const ended    = [];

    (giveaways || []).forEach(g => {
      const start = g.start?.toDate?.() ?? null;
      const end   = g.end?.toDate?.()   ?? null;

      if (end && end < now)                          ended.push(g);
      else if (start && end && start <= now && end >= now) active.push(g);
      else if (start && start > now)                 upcoming.push(g);
    });

    renderList(activeList,   active,   "active");
    renderList(upcomingList, upcoming, "upcoming");
    renderList(endedList,    ended,    "ended");

    document.querySelectorAll(".enter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;

        // FIX: if user already has a valid 24h session, skip transition entirely
        if (hasValidAccess(id)) {
          window.location.href = `giveaway.html?id=${encodeURIComponent(id)}`;
        } else {
          sessionStorage.setItem("rewardloop_targetGiveaway", id);
          window.location.href = `transition.html?give=${encodeURIComponent(id)}`;
        }
      });
    });
  }

  function renderList(container, items, type) {
    container.innerHTML = "";

    if (!items.length) {
      const msg = {
        active:   "No active giveaways right now — check back soon!",
        upcoming: "No upcoming giveaways announced yet.",
        ended:    "No ended giveaways yet."
      }[type] ?? "None.";
      container.innerHTML = `<p class="empty-state">${msg}</p>`;
      return;
    }

    items.forEach(g => {
      const card = document.createElement("div");
      card.className = "giveaway-card" + (type === "ended" ? " ended-card" : "");

      const endDate   = g.end?.toDate?.();
      const startDate = g.start?.toDate?.();
      let metaText = "";
      if (type === "active"   && endDate)   metaText = `Ends ${formatDate(endDate)}`;
      if (type === "upcoming" && startDate) metaText = `Starts ${formatDate(startDate)}`;
      if (type === "ended"    && endDate)   metaText = `Ended ${formatDate(endDate)}`;

      // Show "Rejoin" label if user already has access for this giveaway
      const hasAccess  = type === "active" && hasValidAccess(g.id);
      const btnLabel   = hasAccess ? "Rejoin Giveaway ✓" : "Join Giveaway";

      card.innerHTML = `
        <img src="assets/${escapeHtml(g.image || "")}" alt="${escapeHtml(g.title)}" loading="lazy" />
        <h3>${escapeHtml(g.title)}</h3>
        <p>Win a genuine ${escapeHtml(g.title.replace(/giveaway/i, "").trim())}. Enter daily — support the prize pool by viewing sponsored content.</p>
        ${metaText ? `<p class="card-meta">${metaText}</p>` : ""}
        ${type === "active" ? `<div style="margin-top:0.5rem"><button class="primary-btn enter-btn${hasAccess ? " btn-rejoin" : ""}" data-id="${escapeHtml(g.id)}">${btnLabel}</button></div>` : ""}
      `;

      container.appendChild(card);
    });
  }

  function updateSessionText() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("rewardloop_access_"));
    const dot  = document.getElementById("session-dot");
    const text = document.getElementById("session-text");
    if (keys.length === 0) {
      dot?.classList.remove("active");
      if (text) text.textContent = "No active sessions — visit a sponsor link to unlock a giveaway.";
    } else {
      dot?.classList.add("active");
      if (text) text.textContent = `${keys.length} active session${keys.length > 1 ? "s" : ""} — you can re-enter unlocked giveaways freely.`;
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  resetBtn?.addEventListener("click", () => {
    clearAllAccess();
    updateSessionText();
    // Re-render to update button labels
    loadAndRender();
    alert("Local access sessions cleared.");
  });

  loadAndRender();
  updateSessionText();
});
