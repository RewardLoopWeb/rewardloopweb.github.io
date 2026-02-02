// utils: ad session management (LocalStorage)

const AD_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function getAccessKey(gid) {
  const raw = localStorage.getItem(`rewardloop_access_${gid}`);
  return raw ? JSON.parse(raw) : null;
}

function hasValidAccess(gid) {
  const rec = getAccessKey(gid);
  if (!rec) return false;
  return Date.now() < rec.expiresAt;
}

function grantAccess(gid) {
  const rec = { expiresAt: Date.now() + AD_COOLDOWN_MS };
  localStorage.setItem(`rewardloop_access_${gid}`, JSON.stringify(rec));
}

function clearAccess(gid) {
  localStorage.removeItem(`rewardloop_access_${gid}`);
}

function clearAllAccess() {
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith("rewardloop_access_")) localStorage.removeItem(k);
  });
}
