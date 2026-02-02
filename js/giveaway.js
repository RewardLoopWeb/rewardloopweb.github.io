// giveaway.js - loads a single giveaway, gating, widget injection, detection, 24h access

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const joined = params.get("joined"); // if short link redirects with joined=1
  const giveaway = findGiveawayById(id);

  const titleEl = document.getElementById("giveaway-title");
  const subEl = document.getElementById("giveaway-sub");
  const imgEl = document.getElementById("giveaway-image");
  const descEl = document.getElementById("giveaway-desc");
  const acceptCheckbox = document.getElementById("accept-sponsor");
  const gotoAdBtn = document.getElementById("goto-ad");
  const continueBtn = document.getElementById("continue-to-giveaway");
  const gleamArea = document.getElementById("gleam-area");
  const gleamPlaceholder = document.getElementById("gleam-placeholder");
  const gleamError = document.getElementById("gleam-error");
  const sponsorArea = document.getElementById("sponsor-area");
  const timerArea = document.getElementById("timer-area");
  const timerText = document.getElementById("timer-text");

  if (!giveaway) {
    titleEl.textContent = "Giveaway not found";
    descEl.textContent = "Invalid ID or no giveaway exists with this identifier.";
    sponsorArea.style.display = "none";
    return;
  }

  titleEl.textContent = giveaway.title;
  subEl.textContent = `${giveaway.ends ? 'Ends: ' + giveaway.ends : ''}`;
  imgEl.src = giveaway.image;
  descEl.textContent = giveaway.description;

  // If arrived via short link redirect (joined=1) OR pending flag matches id
  if (joined === "1" || sessionStorage.getItem("rewardloop_pending") === id) {
    sessionStorage.removeItem("rewardloop_pending");
    grantAccess(id);
    showGleam();
    return;
  }

  // If user already has valid access for this giveaway
  if (hasValidAccess(id)) {
    showGleam();
    return;
  }

  // Otherwise show sponsor consent area before redirect
  sponsorArea.style.display = "block";

  // decode short link for this giveaway
  const decodedShort = (() => {
    try { return atob(giveaway.short); } catch(e) { return null; }
  })();

  // enable the ad button only when checkbox checked
  acceptCheckbox.addEventListener("change", () => {
    gotoAdBtn.disabled = !acceptCheckbox.checked;
    continueBtn.disabled = !acceptCheckbox.checked;
  });

  gotoAdBtn.addEventListener("click", () => {
    if (!decodedShort) { alert("Sponsor link not configured."); return; }
    sessionStorage.setItem("rewardloop_pending", id);
    window.open(decodedShort, "_blank", "noopener");
    continueBtn.disabled = true;
    continueBtn.textContent = "Please return after viewing sponsor...";
    setTimeout(() => {
      continueBtn.disabled = false;
      continueBtn.textContent = "Continue to Giveaway";
    }, 12000);
  });

  continueBtn.addEventListener("click", () => {
    // user indicates they've viewed sponsor; grant access and show gleam
    grantAccess(id);
    showGleam();
  });

  // show gleam by injecting anchor + script (only when allowed)
  function showGleam() {
    sponsorArea.style.display = "none";
    gleamArea.style.display = "block";
    gleamError.style.display = "none";
    timerArea.style.display = "block";
    updateTimerDisplay(id);

    try {
      const gleamUrl = atob(giveaway.link);
      const a = document.createElement("a");
      a.className = "e-widget no-button giveaway-widget-text";
      a.href = gleamUrl;
      a.setAttribute("rel", "nofollow");
      a.textContent = giveaway.title;
      gleamPlaceholder.innerHTML = "";
      gleamPlaceholder.appendChild(a);

      // inject gleam script (only once)
      if (!document.querySelector('script[src="https://widget.gleamjs.io/e.js"]')) {
        const s = document.createElement("script");
        s.type = "text/javascript";
        s.async = true;
        s.src = "https://widget.gleamjs.io/e.js";
        document.body.appendChild(s);
      }

      // detect widget success/failure
      detectWidget(gleamPlaceholder, onWidgetLoaded, onWidgetFailed);
    } catch (e) {
      gleamPlaceholder.innerHTML = "<p style='color:var(--muted)'>Gleam embed not configured correctly.</p>";
    }
  }

  function updateTimerDisplay(gid) {
    const rec = JSON.parse(localStorage.getItem(`rewardloop_access_${gid}`) || "{}");
    if (!rec || !rec.expiresAt) return;
    timerArea.style.display = "block";
    const interval = setInterval(() => {
      const remaining = rec.expiresAt - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        timerText.textContent = "Access expired. Please view sponsored content again.";
        clearAccess(gid);
        return;
      }
      const hrs = Math.floor(remaining / (1000*60*60));
      const mins = Math.floor((remaining / (1000*60)) % 60);
      timerText.textContent = `Access active — next sponsor required in ${hrs}h ${mins}m.`;
    }, 1000);
  }

  function onWidgetLoaded() {
    gleamError.style.display = "none";
  }

  function onWidgetFailed() {
    gleamPlaceholder.innerHTML = "";
    gleamError.style.display = "block";
  }
});

// helper: find giveaway by id
function findGiveawayById(id) {
  if (!id) return null;
  const all = (data.active || []).concat(data.upcoming || []).concat(data.ended || []);
  return all.find(g => g.id === id);
}

/*
  detectWidget(container, onSuccess, onFail)
  - observes DOM for an iframe with src containing gleam.io
  - if iframe appears, attach load event listener and count loads; success when 2 loads observed
  - if no iframe or second load within timeout => fail
*/
function detectWidget(container, onSuccess, onFail) {
  const WAIT_MS = 400;
  let iframe = null;
  let image = document.getElementById("giveaway-image");
  let loadCount = 0;
  let handled = false;

  setTimeout(() => {
    iframe = document.getElementsByClassName("e-embed-frame")[0];
      const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "attributes" && mutation.attributeName === "style") {
          scale = parseInt(image.height) / 267;
          height = parseInt(iframe.style.height);
          if (!handled && loadCount >= 2) {
            if (height == scale * 449 || height < scale * 100) {
              onFail();
              handled = true;
            }
          }
          if (!handled) loadCount++;
        }
      }
    });
    observer.observe(iframe, { attributes: true });
  }, WAIT_MS);
}
