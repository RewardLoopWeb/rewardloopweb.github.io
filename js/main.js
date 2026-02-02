// main.js - renders homepage lists and handles click -> transition
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
  import { 
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc
  } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const firebaseConfig = {
    apiKey: "AIzaSyCAh_enaOplvVLLrPwWI2PmBe0t_nEWLQQ",
    authDomain: "giveawaysloop-c2d7b.firebaseapp.com",
    projectId: "giveawaysloop-c2d7b",
    storageBucket: "giveawaysloop-c2d7b.firebasestorage.app",
    messagingSenderId: "691273086302",
    appId: "1:691273086302:web:e00d77930eee12e4934bcf",
    measurementId: "G-P87DXJB5YH"
  };

  // --- INITIALIZE ---
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("Firebase initialized!");
  console.log("Firestore connected:", db);

  // --- SMALL TEST: READ A COLLECTION ---
  async function testFirestore() {
    try {
      const snap = await getDocs(collection(db, "test"));
      snap.forEach(doc => console.log(doc.id, "=>", doc.data()));
    } 
    catch (err) {
      console.error("Firestore test error:", err);
    }
  }

  testFirestore();
  async function loadActiveGiveaways() {
  const ref = collection(db, "giveawaysnoaccess");
  const snap = await getDocs(ref);

  const giveaways = [];

  snap.forEach(doc => {
    giveaways.push({
      id: doc.id,
      ...doc.data()
    });
  });
  return giveaways;
}
  const activeList = document.getElementById("active-list");
  const upcomingList = document.getElementById("upcoming-list");
  const endedList = document.getElementById("ended-list");
  const sessionText = document.getElementById("session-text");
  const resetBtn = document.getElementById("reset-session");
  const data = {};
  const client_date = new Date();
  async function loadActive() {
    let array = [];
    array = await loadActiveGiveaways();
    // Render active giveaways
    (array || []).forEach(g => {
    const card = document.createElement("div");
    card.className = "giveaway-card";
    card.innerHTML = `
      <img src="assets/${g.image}" alt="${escapeHtml(g.title)}" />
      <h3>${escapeHtml(g.title)}</h3>
      <p>Win a genuine ${escapeHtml(g.title).replace("Giveaway", "").trim()}. Enter daily — support the prize pool by viewing sponsored content.</p>
      <div style="margin-top:0.8rem">
        <button class="primary-btn enter-btn" data-id="${g.id}">Join Giveaway</button>
      </div>
    `
    if (g.end.toDate() < client_date) endedList.appendChild(card);
    else if (g.end.toDate() > client_date && g.start.toDate() < client_date) activeList.appendChild(card);
    else if (g.start.toDate() > client_date) upcomingList.appendChild(card);
  });
  }
  loadActive();

  function escapeHtml(str) {
    return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  // attach enter handlers
  document.querySelectorAll(".enter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      console.log(id)
      sessionStorage.setItem("rewardloop_targetGiveaway", id);
      // go to transition/consent page with giveaway id
      window.location.href = `transition.html?give=${encodeURIComponent(id)}`;
    });
  });

  // session info & reset
  resetBtn.addEventListener("click", () => {
    clearAllAccess();
    updateSessionText();
    alert("Local access keys cleared (testing).");
  });

  function updateSessionText() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("rewardloop_access_"));
    if (keys.length === 0) {
      sessionText.textContent = "You do not have any active sponsor sessions. Each giveaway requires a sponsor visit once every 24 hours.";
    } else {
      sessionText.textContent = `You have ${keys.length} active sponsor session(s).`;
    }
  }

  updateSessionText();
});

