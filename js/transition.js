// transition.js - shows consent and redirects to the encoded short link

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const giveId = params.get("give"); // id passed from index
  const consentCheckbox = document.getElementById("consentCheckbox");
  const continueBtn = document.getElementById("continueBtn");

  // find giveaway
  const giveaway = (data.active || []).find(g => g.id === giveId);
  if (!giveaway) {
    document.getElementById("t-title").textContent = "Giveaway not found";
    document.getElementById("t-desc").textContent = "Invalid giveaway ID.";
    continueBtn.style.display = "none";
    consentCheckbox.style.display = "none";
    return;
  }

  // enable continue only when checked
  consentCheckbox.addEventListener("change", () => {
    continueBtn.disabled = !consentCheckbox.checked;
  });

  continueBtn.addEventListener("click", () => {
    try {
      const short = atob(giveaway.short);
      // mark pending so giveaway can grant access when redirected back
      sessionStorage.setItem("rewardloop_pending", giveId);
      // open sponsor short link in new tab (user gesture)
      window.open(short, "_self", "noopener");
      // Optionally navigate the user to a friendly "waiting" page in the current tab.
      // For now, keep them on transition page and instruct them to return after sponsor completes.
      continueBtn.textContent = "Sponsor opened — return after viewing";
      continueBtn.disabled = true;
    } catch (e) {
      alert("Redirect failed (invalid short link).");
    }
  });
});
