// ═══════════════════════════════════════════════
//  🔧 PASTE YOUR KEYS HERE
// ═══════════════════════════════════════════════
const GEMINI_KEY = "AIzaSyC3RI53QszawumymKsWkh_Xhoktid0sJy4";

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDqwyn8ARuRi2cwVsJA01LVuQjSN-MO2jk",
  authDomain:        "crop-doctor-b3193.firebaseapp.com",
  projectId:         "crop-doctor-b3193",
  storageBucket:     "crop-doctor-b3193.firebasestorage.app",
  messagingSenderId: "809328047970",
  appId:             "1:809328047970:web:3896f5124470fd80ed5e3b"
};
// ═══════════════════════════════════════════════

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

let currentFile = null;
let currentResult = null;
let db   = null;
let auth = null;
let currentUser = null;

// ── Firebase Init ──────────────────────────────
async function initFirebase() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc }
      = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
      = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

    const app = initializeApp(FIREBASE_CONFIG);
    db   = getFirestore(app);
    auth = getAuth(app);

    window._fs   = { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc };
    window._auth = { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged };

    // Listen for login/logout changes
    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      updateAuthUI(user);
      loadHistory();
    });

    console.log("✅ Firebase connected");
  } catch(e) {
    console.warn("Firebase not connected:", e.message);
    loadHistory();
  }
}

// ── Google Login ───────────────────────────────
async function googleLogin() {
  try {
    const provider = new window._auth.GoogleAuthProvider();
    await window._auth.signInWithPopup(auth, provider);
    toast("Welcome! Signed in successfully 👋");
  } catch(e) {
    toast("Sign-in failed: " + e.message);
  }
}

async function googleLogout() {
  try {
    await window._auth.signOut(auth);
    currentUser = null;
    toast("Signed out successfully");
  } catch(e) {
    toast("Sign-out failed");
  }
}

// ── Update Nav UI based on login state ─────────
function updateAuthUI(user) {
  const loginBtn  = document.getElementById("loginBtn");
  const userInfo  = document.getElementById("userInfo");
  const userPhoto = document.getElementById("userPhoto");
  const userName  = document.getElementById("userName");

  if (user) {
    // User is logged in
    loginBtn.classList.add("hidden");
    userInfo.classList.remove("hidden");
    userInfo.style.display = "flex";
    userPhoto.src = user.photoURL || "";
    userName.textContent = user.displayName || user.email;
    toast("Welcome back, " + (user.displayName?.split(" ")[0] || "Farmer") + "! 🌿");
  } else {
    // User is logged out
    loginBtn.classList.remove("hidden");
    userInfo.classList.add("hidden");
  }
}

// ── File Handling ──────────────────────────────
function onFileSelect(e) {
  const file = e.target.files[0];
  if (file) processFile(file);
}
function onDragOver(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.add('drag-over');
}
function onDragLeave() {
  document.getElementById('dropzone').classList.remove('drag-over');
}
function onDrop(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) processFile(file);
  else toast("Please drop an image file (JPG, PNG, WEBP)");
}

function processFile(file) {
  if (file.size > 15 * 1024 * 1024) { toast("Image too large! Max 15MB."); return; }
  currentFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('previewImg');
    img.src = e.target.result;
    img.classList.remove('hidden');
    document.getElementById('dzContent').classList.add('hidden');
    document.getElementById('previewOverlay').classList.remove('hidden');
    document.getElementById('analyzeBtn').disabled = false;
    document.getElementById('analyzeBtnText').textContent = '🔬  Analyze This Plant';
  };
  reader.readAsDataURL(file);
}

// ── MAIN ANALYZE FUNCTION ──────────────────────
async function analyze() {
  if (!currentFile) return;

  showCard('loadingCard');
  runStepAnimation();

  try {
    // Convert to base64
    const base64 = await toBase64(currentFile);
    const mime   = currentFile.type || 'image/jpeg';

    const prompt = `You are CropDoctor AI, an expert agricultural disease detection system.

Analyze this plant image carefully. Respond ONLY with a valid JSON object — no markdown, no backticks, no extra text.

{
  "isPlant": true,
  "cropName": "Tomato",
  "diseaseName": "Early Blight",
  "diseaseScientificName": "Alternaria solani",
  "severity": "Medium",
  "confidencePercent": 88,
  "emoji": "🍅",
  "symptoms": ["Brown circular spots with yellow rings on leaves", "Spots start on older lower leaves", "Dark concentric rings forming a bullseye pattern"],
  "causes": ["Fungal infection by Alternaria solani", "Warm humid weather above 24°C", "Spreads through infected soil and rain splash"],
  "treatment": {
    "immediate": "Remove and destroy all infected leaves immediately. Do not compost them.",
    "organic": ["Spray neem oil solution (2ml per litre water) every 7 days", "Apply copper-based fungicide spray on leaves", "Remove all fallen leaves from soil surface"],
    "chemical": ["Apply Mancozeb 75% WP at 2.5g per litre water", "Spray Chlorothalonil fungicide every 10-14 days", "Alternate between different fungicides to prevent resistance"]
  },
  "prevention": ["Maintain proper spacing between plants for air circulation", "Avoid overhead watering — use drip irrigation", "Rotate crops — do not plant tomatoes in same spot for 2 years"],
  "weatherCondition": "Early blight thrives in warm humid conditions 24-29°C. Reduce watering during rainy season.",
  "affectedCropLoss": "20-50% yield loss if left untreated for 2+ weeks",
  "recoveryChance": "High"
}

Rules:
- severity must be exactly one of: Healthy, Low, Medium, High, Critical
- confidencePercent must be a number between 60-99
- If NOT a plant image, return: {"isPlant": false, "diseaseName": "Not a plant"}
- All arrays must have 3 items minimum
- Be specific to the actual crop and disease you see`;

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: base64 } }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();

    // Safely extract text
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("Empty response from Gemini. Please try again.");

    // Extract JSON robustly
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not read AI response. Please try again.");

    const result = JSON.parse(match[0]);

    if (!result.isPlant) {
      showError("Not a Plant 🌱", "The AI could not detect a plant in this image. Please upload a clear photo of a crop leaf or plant.");
      return;
    }

    currentResult = result;
    renderResult(result);
    saveHistory(result);
    loadHistory();

  } catch(err) {
    console.error(err);
    if (err.message.includes("API key") || err.message.includes("API_KEY") || err.message.includes("400")) {
      showError("Invalid API Key 🔑", "Your Gemini API key is missing or wrong. Open index.html, find GEMINI_KEY at the top and paste your key from aistudio.google.com/app/apikey");
    } else if (err.message.includes("Failed to fetch") || err.message.includes("network")) {
      showError("No Internet 📡", "Please check your internet connection and try again.");
    } else {
      showError("Analysis Failed ⚠️", err.message || "Something went wrong. Please try again with a clearer photo.");
    }
  }
}

// ── Render Result ──────────────────────────────
function renderResult(r) {
  document.getElementById('rEmoji').textContent   = r.emoji || '🌿';
  document.getElementById('rDisease').textContent = r.diseaseName;
  document.getElementById('rCrop').textContent    = r.cropName + (r.diseaseScientificName ? ` · ${r.diseaseScientificName}` : '');
  document.getElementById('rLabel').textContent   = r.severity === 'Healthy' ? '✅ HEALTHY PLANT' : '🔬 DISEASE DETECTED';

  const sevEl = document.getElementById('rSev');
  sevEl.textContent = r.severity;
  sevEl.className   = `sev-badge sev-${r.severity}`;

  const pct = r.confidencePercent || 80;
  document.getElementById('confPct').textContent = pct + '%';
  setTimeout(() => { document.getElementById('confFill').style.width = pct + '%'; }, 400);

  // Symptoms
  document.getElementById('symptoms').innerHTML = buildList(r.symptoms);

  // Causes
  document.getElementById('causes').innerHTML = buildList(r.causes);

  // Treatment
  let t = '';
  if (r.treatment?.immediate) {
    t += `<div class="immediate-box"><strong>⚡ Do This Right Now:</strong>${r.treatment.immediate}</div>`;
  }
  if (r.treatment?.organic?.length) {
    t += `<div class="treat-section"><div class="treat-label organic">🌿 Organic Treatment</div>`;
    t += r.treatment.organic.map((s,i) =>
      `<div class="treat-step"><div class="treat-num">${i+1}</div><div>${s}</div></div>`).join('') + '</div>';
  }
  if (r.treatment?.chemical?.length) {
    t += `<div class="treat-section"><div class="treat-label chemical">🧪 Chemical Treatment</div>`;
    t += r.treatment.chemical.map((s,i) =>
      `<div class="treat-step"><div class="treat-num blue">${i+1}</div><div>${s}</div></div>`).join('') + '</div>';
  }
  document.getElementById('treatment').innerHTML = t || '<p>No treatment data.</p>';

  // Prevention
  let p = buildList(r.prevention);
  if (r.affectedCropLoss || r.recoveryChance) {
    p += `<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);font-size:12px;color:var(--text2);">
      ${r.affectedCropLoss ? `<div style="margin-bottom:4px;">📉 <strong>Yield Risk:</strong> ${r.affectedCropLoss}</div>` : ''}
      ${r.recoveryChance   ? `<div>💪 <strong>Recovery Chance:</strong> ${r.recoveryChance}</div>` : ''}
    </div>`;
  }
  document.getElementById('prevention').innerHTML = p;

  // Weather
  if (r.weatherCondition) {
    document.getElementById('weatherText').textContent = r.weatherCondition;
    document.getElementById('weatherBox').style.display = 'flex';
  }

  // Reset to first tab
  switchTab('symptoms', document.querySelectorAll('.tab')[0]);
  showCard('resultCard');
}

function switchTab(name, btn) {
  ['symptoms','causes','treatment','prevention'].forEach(t => document.getElementById(t).classList.add('hidden'));
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.getElementById(name).classList.remove('hidden');
  btn.classList.add('active');
}

// ── History ────────────────────────────────────
function saveHistory(result) {
  // 1. Always save to localStorage (instant, offline)
  const h = getLocalHistory();
  h.unshift({
    id: Date.now(),
    diseaseName: result.diseaseName,
    cropName:    result.cropName,
    severity:    result.severity,
    emoji:       result.emoji || "🌿",
    createdAt:   new Date().toISOString(),
    result:      JSON.stringify(result)
  });
  localStorage.setItem("cdHistory", JSON.stringify(h.slice(0,20)));

  // 2. If logged in → also save to Firestore (cloud, per user)
  if (db && currentUser && window._fs) {
    const { collection, addDoc } = window._fs;
    addDoc(collection(db, "scans"), {
      userId:      currentUser.uid,
      userName:    currentUser.displayName || "",
      diseaseName: result.diseaseName,
      cropName:    result.cropName,
      severity:    result.severity,
      confidence:  result.confidencePercent,
      emoji:       result.emoji || "🌿",
      symptoms:    result.symptoms || [],
      createdAt:   new Date().toISOString()
    })
    .then(() => toast("✅ Scan saved to cloud!"))
    .catch(e => console.warn("Firestore save failed:", e.message));
  }
}

function getLocalHistory() {
  try { return JSON.parse(localStorage.getItem("cdHistory") || "[]"); }
  catch { return []; }
}

async function loadHistory() {
  // If logged in → load from Firestore
  if (db && currentUser && window._fs) {
    try {
      const { collection, getDocs, query, where, orderBy } = window._fs;
      const q = query(
        collection(db, "scans"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const scans = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      renderHistory(scans, true);
      return;
    } catch(e) {
      console.warn("Firestore load failed, using localStorage:", e.message);
    }
  }
  // Fallback → load from localStorage
  renderHistory(getLocalHistory(), false);
}

function renderHistory(scans, fromCloud) {
  const card = document.getElementById("historyCard");
  const list = document.getElementById("historyList");
  if (!scans.length) { card.classList.add("hidden"); return; }
  card.classList.remove("hidden");

  // Update title to show source
  document.querySelector("#historyCard .history-header h3").textContent =
    fromCloud ? "☁️ Cloud Scan History" : "📋 Recent Scans (Local)";

  list.innerHTML = scans.map(s => `
    <div class="hist-item" onclick="loadScan('${s.id}')">
      <div class="hist-emoji">${s.emoji || "🌿"}</div>
      <div class="hist-info">
        <div class="hist-disease">${s.diseaseName}</div>
        <div class="hist-meta">${s.cropName} · ${fmtDate(s.createdAt)}</div>
      </div>
      <div class="sev-badge sev-${s.severity}" style="font-size:10px;padding:4px 10px">${s.severity}</div>
    </div>`).join("");
}

function loadScan(id) {
  const s = getLocalHistory().find(x => x.id == id);
  if (!s) return;
  currentResult = JSON.parse(s.result);
  renderResult(currentResult);
  toast("Previous scan loaded 📋");
}

async function clearHistory() {
  // Clear localStorage
  localStorage.removeItem("cdHistory");

  // If logged in → also clear Firestore scans for this user
  if (db && currentUser && window._fs) {
    try {
      const { collection, getDocs, query, where, deleteDoc, doc } = window._fs;
      const q = query(collection(db, "scans"), where("userId", "==", currentUser.uid));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(d => deleteDoc(doc(db, "scans", d.id)));
      toast("☁️ Cloud history cleared");
    } catch(e) {
      console.warn(e);
    }
  }

  document.getElementById("historyCard").classList.add("hidden");
  toast("History cleared");
}

// ── Save / Share ───────────────────────────────
function saveReport() {
  if (!currentResult) return;
  const r = currentResult;
  const txt = `CROPDOCTOR AI — SCAN REPORT
${'='.repeat(40)}
Date:       ${new Date().toLocaleString('en-IN')}
Crop:       ${r.cropName}
Disease:    ${r.diseaseName}
Severity:   ${r.severity}
Confidence: ${r.confidencePercent}%

SYMPTOMS:
${(r.symptoms||[]).map((s,i)=>`${i+1}. ${s}`).join('\n')}

IMMEDIATE ACTION:
${r.treatment?.immediate||'N/A'}

ORGANIC TREATMENT:
${(r.treatment?.organic||[]).map((s,i)=>`${i+1}. ${s}`).join('\n')}

CHEMICAL TREATMENT:
${(r.treatment?.chemical||[]).map((s,i)=>`${i+1}. ${s}`).join('\n')}

PREVENTION TIPS:
${(r.prevention||[]).map((s,i)=>`${i+1}. ${s}`).join('\n')}

Yield Risk:      ${r.affectedCropLoss||'N/A'}
Recovery Chance: ${r.recoveryChance||'N/A'}

Generated by CropDoctor AI — Powered by Google Gemini`;

  const blob = new Blob([txt], {type:'text/plain'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `CropDoctor_${r.diseaseName.replace(/\s/g,'_')}.txt`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Report downloaded! 💾");
}

function shareResult() {
  if (!currentResult) return;
  const txt = `🌿 CropDoctor AI Result\nCrop: ${currentResult.cropName}\nDisease: ${currentResult.diseaseName}\nSeverity: ${currentResult.severity}\nConfidence: ${currentResult.confidencePercent}%\n\nPowered by Gemini AI`;
  if (navigator.share) navigator.share({title:'CropDoctor Result', text: txt});
  else { navigator.clipboard.writeText(txt); toast("Copied to clipboard! 📋"); }
}

// ── Reset ──────────────────────────────────────
function resetApp() {
  currentFile = null; currentResult = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('previewImg').src  = '';
  document.getElementById('previewImg').classList.add('hidden');
  document.getElementById('dzContent').classList.remove('hidden');
  document.getElementById('previewOverlay').classList.add('hidden');
  document.getElementById('dropzone').classList.remove('drag-over');
  document.getElementById('analyzeBtn').disabled = true;
  document.getElementById('analyzeBtnText').textContent = 'Select a Photo First';
  document.getElementById('confFill').style.width = '0%';
  document.getElementById('weatherBox').style.display = 'none';
  showCard('uploadCard');
}

// ── Step Animation ─────────────────────────────
function runStepAnimation() {
  ['s1','s2','s3'].forEach(s => {
    document.getElementById(s).className = 'step';
  });
  let i = 0;
  const steps = ['s1','s2','s3'];
  const iv = setInterval(() => {
    if (i > 0) {
      document.getElementById(steps[i-1]).classList.remove('active');
      document.getElementById(steps[i-1]).classList.add('done');
    }
    if (i < steps.length) {
      document.getElementById(steps[i]).classList.add('active');
      i++;
    } else clearInterval(iv);
  }, 1400);
}

// ── Helpers ────────────────────────────────────
function showCard(id) {
  ['uploadCard','loadingCard','resultCard','errorCard'].forEach(c =>
    document.getElementById(c).classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  window.scrollTo({top: document.querySelector('.main').offsetTop - 20, behavior:'smooth'});
}
function showError(title, msg) {
  document.getElementById('errTitle').textContent = title;
  document.getElementById('errMsg').textContent   = msg;
  showCard('errorCard');
}
function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = e => res(e.target.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function buildList(arr) {
  if (!arr?.length) return '<p style="color:var(--text3)">No data available.</p>';
  return '<ul>' + arr.map(i => `<li>${i}</li>`).join('') + '</ul>';
}
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'});
}
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── Boot ───────────────────────────────────────
initFirebase();
