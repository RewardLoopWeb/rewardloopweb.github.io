// giveaway.js — single giveaway page: gating, sponsor flow, Gleam widget, 24h timer, ended view

import { loadActiveGiveaways, grantAccess, hasValidAccess, clearAccess, getAccessRecord_public } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get("id");
  const joined = params.get("joined");
  const ended  = params.get("ended"); // ended=1 means view-only, no ads

  const titleEl        = document.getElementById("giveaway-title");
  const subEl          = document.getElementById("giveaway-sub");
  const imgEl          = document.getElementById("giveaway-image");
  const descEl         = document.getElementById("giveaway-desc");
  const acceptCheckbox = document.getElementById("accept-sponsor");
  const gotoAdBtn      = document.getElementById("goto-ad");
  const continueBtn    = document.getElementById("continue-to-giveaway");
  const sponsorArea    = document.getElementById("sponsor-area");
  const gleamArea      = document.getElementById("gleam-area");
  const gleamHolder    = document.getElementById("gleam-placeholder");
  const gleamError     = document.getElementById("gleam-error");
  const timerArea      = document.getElementById("timer-area");
  const timerBar       = document.getElementById("timer-bar");
  const timerText      = document.getElementById("timer-text");
  const skeleton       = document.getElementById("loading-skeleton");
  const content        = document.getElementById("giveaway-content");
  const endedBanner    = document.getElementById("ended-banner");
  const winnerName     = document.getElementById("winner-name");

  async function init() {
    if (!id) { showError("No giveaway ID provided."); return; }

    const all      = await loadActiveGiveaways();
    const giveaway = all.find(g => g.id === id);

    if (!giveaway) { showError("Giveaway not found."); return; }

    // Reveal content, hide skeleton
    skeleton.style.display = "none";
    content.style.display  = "block";

    titleEl.textContent = giveaway.title;
    imgEl.src           = "assets/" + (giveaway.image || "");
    imgEl.alt           = giveaway.title;

    const endDate = giveaway.end?.toDate?.();

    // ── ENDED VIEW MODE (no ads, no session check) ────────────────────────────
    if (ended === "1") {
      subEl.textContent = endDate ? `Ended ${endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "Ended";
      descEl.textContent = giveaway.description || "";

      // Show ended banner with winner if available in Firebase
      endedBanner.style.display = "block";
      if (giveaway.winner) {
        winnerName.textContent = `🏆 Winner: ${giveaway.winner}`;
      } else {
        winnerName.textContent = "Winner will be announced soon.";
      }

      // Show Gleam widget for results — no timer, no sponsor
      showGleam(giveaway, false);
      return;
    }

    // ── ACTIVE GIVEAWAY FLOW ──────────────────────────────────────────────────
    subEl.textContent  = endDate ? `Ends ${endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "";
    descEl.textContent = `Win a genuine ${giveaway.title.replace(/giveaway/i, "").trim()}. Enter daily — support the prize pool by viewing sponsored content.`;

    if (joined === "1") {
      sessionStorage.removeItem("rewardloop_pending");
      grantAccess(id);
      history.replaceState(null, "", `giveaway.html?id=${encodeURIComponent(id)}`);
      showGleam(giveaway, true);
      return;
    }

    if (sessionStorage.getItem("rewardloop_pending") === id) {
      sessionStorage.removeItem("rewardloop_pending");
      grantAccess(id);
      history.replaceState(null, "", `giveaway.html?id=${encodeURIComponent(id)}`);
      showGleam(giveaway, true);
      return;
    }

    if (hasValidAccess(id)) {
      showGleam(giveaway, true);
      return;
    }

    window.location.href = `transition.html?give=${encodeURIComponent(id)}`;
  }

  acceptCheckbox?.addEventListener("change", () => {
    const checked        = acceptCheckbox.checked;
    gotoAdBtn.disabled   = !checked;
    continueBtn.disabled = !checked;
  });

  // showTimer param controls whether to start the 24h countdown
  function showGleam(giveaway, showTimer) {
    sponsorArea.style.display = "none";
    gleamArea.style.display   = "block";
    gleamError.style.display  = "none";
    if (showTimer) startTimer(id);

    try {
      const gleamUrl    = atob(giveaway.link);
      const a           = document.createElement("a");
      a.className       = "e-widget no-button giveaway-widget-text";
      a.href            = gleamUrl;
      a.setAttribute("rel", "nofollow");
      a.textContent     = giveaway.title;
      gleamHolder.innerHTML = "";
      gleamHolder.appendChild(a);

      if (!document.querySelector('script[src="https://widget.gleamjs.io/e.js"]')) {
        const s   = document.createElement("script");
        s.type    = "text/javascript";
        s.async   = true;
        s.src     = "https://widget.gleamjs.io/e.js";
        document.body.appendChild(s);
      }

      detectWidget(gleamHolder, onWidgetLoaded, onWidgetFailed);
    } catch (e) {
      gleamHolder.innerHTML = "<p style='color:var(--muted)'>Gleam embed not configured correctly.</p>";
    }
  }

  function startTimer(gid) {
    timerArea.style.display = "block";
    const rec = getAccessRecord_public(gid);
    if (!rec || !rec.expiresAt) return;

    const interval = setInterval(() => {
      const remaining = rec.expiresAt - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        timerBar.className    = "timer-bar expired";
        timerText.textContent = "Access expired — please view sponsored content again.";
        clearAccess(gid);
        return;
      }
      const hrs  = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining / (1000 * 60)) % 60);
      const secs = Math.floor((remaining / 1000) % 60);
      timerText.textContent = `Access active — refreshes in ${hrs}h ${mins}m ${secs}s`;
    }, 1000);
  }

  function onWidgetLoaded() { gleamError.style.display = "none"; }
  function onWidgetFailed() { gleamHolder.innerHTML = ""; gleamError.style.display = "block"; }

  function detectWidget(container, onSuccess, onFail) {
    const MIN_SUCCESS_HEIGHT = 300;
    const TIMEOUT_MS = 8000;
    let handled = false;

    function resolve(success) {
      if (handled) return;
      handled = true;
      observer.disconnect();
      clearTimeout(timer);
      success ? onSuccess() : onFail();
    }

    const domWatcher = new MutationObserver(() => {
      const iframe = document.getElementsByClassName("e-embed-frame")[0];
      if (!iframe) return;
      domWatcher.disconnect();

      const observer = new MutationObserver(() => {
        const height = parseInt(iframe.style.height, 10);
        if (!height) return;
        if (height >= MIN_SUCCESS_HEIGHT) resolve(true);
        else if (height > 0 && height < MIN_SUCCESS_HEIGHT) {
          setTimeout(() => {
            const h = parseInt(iframe.style.height, 10);
            resolve(h >= MIN_SUCCESS_HEIGHT);
          }, 2000);
        }
      });
      observer.observe(iframe, { attributes: true, attributeFilter: ["style"] });

      const timer = setTimeout(() => resolve(false), TIMEOUT_MS);
    });

    domWatcher.observe(container, { childList: true, subtree: true });

    setTimeout(() => {
      domWatcher.disconnect();
      if (!handled) resolve(false);
    }, TIMEOUT_MS + 1000);
  }

  function showError(msg) {
    skeleton.style.display    = "none";
    content.style.display     = "block";
    titleEl.textContent       = "Not Found";
    descEl.textContent        = msg;
    sponsorArea.style.display = "none";
    gleamArea.style.display   = "none";
    timerArea.style.display   = "none";
    endedBanner.style.display = "none";
  }

  init();
});
