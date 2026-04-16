// transition.js — consent screen → redirect to short sponsor link

import { loadActiveGiveaways } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const params          = new URLSearchParams(window.location.search);
  const giveId          = params.get("give");
  const consentCheckbox = document.getElementById("consentCheckbox");
  const consentLabel    = document.getElementById("consentLabel");
  const consentDivider  = document.getElementById("consentDivider");
  const continueBtn     = document.getElementById("continueBtn");
  const btnText         = document.getElementById("btnText");
  const afterNote       = document.getElementById("afterNote");
  const tTitle          = document.getElementById("t-title");
  const tDesc           = document.getElementById("t-desc");
  const now             = new Date();

  async function init() {
    // No giveaway ID in URL
    if (!giveId) {
      showError("Missing giveaway", "No giveaway ID was provided. <a href='index.html'>Go back home</a>.");
      return;
    }

    // Firebase fetch
    const all      = await loadActiveGiveaways();
    const giveaway = (all || []).find(g => {
      const start = g.start?.toDate?.();
      const end   = g.end?.toDate?.();
      return g.id === giveId && start && end && start <= now && end >= now;
    });

    // Giveaway not found or expired
    if (!giveaway) {
      showError("Giveaway not found", "This giveaway may have ended or the link is invalid. <a href='index.html'>Browse all giveaways →</a>");
      return;
    }

    // Firebase loaded — reveal the consent UI
    consentLabel.style.display   = "flex";
    consentDivider.style.display = "block";
    afterNote.style.visibility   = "visible";

    // Button stays disabled until checkbox ticked — update label
    btnText.textContent      = "Continue to Sponsor →";
    continueBtn.disabled     = true;
    continueBtn.classList.remove("loading-btn");

    // Remove spinner once loaded
    const spinner = continueBtn.querySelector(".btn-spinner");
    if (spinner) spinner.remove();

    consentCheckbox.addEventListener("change", () => {
      continueBtn.disabled = !consentCheckbox.checked;
    });

    continueBtn.addEventListener("click", () => {
      try {
        const shortUrl = atob(giveaway.short);
        sessionStorage.setItem("rewardloop_pending", giveId);
        btnText.textContent  = "Opening sponsor page…";
        continueBtn.disabled = true;
        window.location.href = shortUrl;
      } catch (e) {
        alert("Redirect failed — the sponsor link may not be configured yet.");
      }
    });
  }

  function showError(title, descHtml) {
    tTitle.textContent        = title;
    tDesc.innerHTML           = descHtml;
    continueBtn.style.display = "none";
    consentLabel.style.display = "none";
    consentDivider.style.display = "none";
    afterNote.style.display   = "none";
    // Remove spinner too
    const spinner = continueBtn.querySelector(".btn-spinner");
    if (spinner) spinner.remove();
  }

  init();
});
