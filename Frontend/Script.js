/* ═══════════════════════════════════════
   REALIFY — script.js (FINAL CLEAN)
═══════════════════════════════════════ */

/* ── UTILS ── */
const $ = id => document.getElementById(id);

function showToast(icon, msg) {
  const t = $('toast');
  $('ticon').textContent = icon;
  $('tmsg').textContent  = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3200);
}

function valEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/* ── NAV HELPERS ── */
function toggleBurger() { $('mob-nav').classList.toggle('open'); }
function closeBurger()  { $('mob-nav').classList.remove('open'); }

/* ── AUTH MODAL ── */
function openModal(mode) {
  switchModal(mode);
  $('auth-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('auth-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function switchModal(mode) {
  const si = mode === 'signin';
  $('mf-signin').style.display = si ? 'block' : 'none';
  $('mf-signup').style.display = si ? 'none' : 'block';
}

/* ── PASSWORD STRENGTH ── */
function pwStrength(v) {
  const b = $('pstr-bar');
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;

  b.style.width = ['0%','25%','55%','80%','100%'][s];
  b.style.background = ['','#f55f5f','#f4a61e','#4d8ef6','#1ed49c'][s];
}

/* ── REGISTER (API CONNECTED) ── */
async function doRegister() {
  const firstName = $('su-fn').value.trim();
  const lastName  = $('su-ln').value.trim();
  const email     = $('su-em').value.trim();
  const password  = $('su-pw').value;

  if (!firstName || !valEmail(email) || password.length < 8) {
    showToast("⚠️", "Please fill all fields correctly");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ firstName, lastName, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      showToast("✅", "Account created successfully");

      // redirect after small delay
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);

    } else {
      showToast("❌", data.message);
    }

  } catch (error) {
    console.error(error);
    showToast("❌", "Server error");
  }
}

/* ── LOGIN (API CONNECTED) ── */
async function doLogin() {
  const email = document.getElementById("si-em").value;
  const password = document.getElementById("si-pw").value;

  if (!email || !password) {
    alert("Enter email & password");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log(data);

    if (data.success) {
      // ✅ store real user from DB
      localStorage.removeItem("realify_user");
      localStorage.setItem("realify_user", JSON.stringify(data.user));

      window.location.href = "dashboard.html";
    } else {
      alert(data.message || "Invalid credentials");
    }

  } catch (err) {
    console.error(err);
    alert("Server error");
  }
}

/* ── PREVENT FORM RELOAD ── */
document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form");
  forms.forEach(f => {
    f.addEventListener("submit", e => e.preventDefault());
  });
});


function forgotPassword() {
  const email = prompt("Enter your email");

  if (!email) return;

  fetch("http://localhost:5000/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
  });
}

function submitContactForm() {
  const name = document.getElementById("cf-name").value.trim();
  const email = document.getElementById("cf-email").value.trim();
  const message = document.getElementById("cf-msg").value.trim();

  // Error elements
  const nameErr = document.getElementById("cf-name-err");
  const emailErr = document.getElementById("cf-email-err");
  const msgErr = document.getElementById("cf-msg-err");

  let valid = true;

  // Reset errors
  nameErr.style.display = "none";
  emailErr.style.display = "none";
  msgErr.style.display = "none";

  // Validation
  if (!name) {
    nameErr.style.display = "block";
    valid = false;
  }

  if (!email || !email.includes("@")) {
    emailErr.style.display = "block";
    valid = false;
  }

  if (!message || message.length < 10) {
    msgErr.style.display = "block";
    valid = false;
  }

  if (!valid) return;

  // Button loading
  document.getElementById("cf-btn-txt").style.display = "none";
  document.getElementById("cf-btn-ld").style.display = "flex";

  // 🔥 API CALL
  fetch("http://localhost:5000/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      email,
      message
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Response:", data);

    if (data.success) {
      document.getElementById("cf-form-body").style.display = "none";
      document.getElementById("cf-success").style.display = "block";
    } else {
      alert("Something went wrong!");
    }
  })
  .catch(err => {
    console.error(err);
    alert("Server error!");
  })
  .finally(() => {
    document.getElementById("cf-btn-txt").style.display = "inline";
    document.getElementById("cf-btn-ld").style.display = "none";
  });
}