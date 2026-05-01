// ==========================
//  Experiment Configuration
// ==========================
const TOTAL_CHARTS = 50;
const container = document.body;
let currentStep = 0;
const steps = [];
// ==========================
//  Attention Check Settings
// ==========================
const ATTENTION_CHECKS = [
  {
    id: "attn1",
    position: 15,
    question: "Is this visualization a bar chart?",
    image: "attn1.png"
  },
  {
    id: "attn2",
    position: 35,
    question: "Is this visualization a scatter plot?",
    image: "attn2.png"
  }
];

// Noise mask timing (in milliseconds)
const MASK_DURATION_MS = 500; // how long static shows
const FADE_DURATION_MS = 50; // how long fade-out lasts

// Load participant data
const participantData = JSON.parse(localStorage.getItem("participantData")) || {
  demographic: {},
  responses: []
};

// Set session start time once
if (!participantData.sessionStartTime) {
  participantData.sessionStartTime = Date.now();
  localStorage.setItem("participantData", JSON.stringify(participantData));
}

// ==========================
//  Fixed Chart Order
// ==========================
const chartOrder = Array.from({ length: TOTAL_CHARTS }, (_, i) => i + 1);

if (!participantData.chartOrder) {
  participantData.chartOrder = chartOrder;
  localStorage.setItem("participantData", JSON.stringify(participantData));
}

// ==========================
//  Progress Elements
// ==========================
const progressBarContainer = document.createElement('div');
progressBarContainer.id = "progress-bar-container";

const progressBar = document.createElement('div');
progressBar.id = "progress-bar";
progressBarContainer.appendChild(progressBar);

const questionCounter = document.createElement('div');
questionCounter.id = "question-counter";
questionCounter.textContent = `Question 1`;

container.insertBefore(progressBarContainer, container.firstChild);
container.insertBefore(questionCounter, container.children[1]);

// ==========================
//  Global Countdown Timer
// ==========================
const globalTimerContainer = document.createElement('div');
globalTimerContainer.id = "global-timer-container";

const globalTimerBar = document.createElement('div');
globalTimerBar.id = "global-timer-bar";
globalTimerContainer.appendChild(globalTimerBar);

// Insert timer bar between progress bar and question counter
container.insertBefore(globalTimerContainer, container.children[1]);

const noiseMask = document.createElement("div");
noiseMask.id = "noise-mask";
document.body.appendChild(noiseMask);

// ==========================
//  Build Step Configuration
// ==========================
const stepsConfig = [];
let displayIndex = 1;

for (let i = 0; i < TOTAL_CHARTS; i++) {
  const chartId = chartOrder[i];

  // Chart step
  stepsConfig.push({
    type: "chart",
    chartId,
    displayIndex
  });

  // Insert attention checks AFTER this chart
  ATTENTION_CHECKS.forEach(attn => {
    if (attn.position === displayIndex) {
      stepsConfig.push({
        type: "attention",
        attentionId: attn.id,
        question: attn.question,
        image: attn.image,
        displayIndex: displayIndex + 0.5
      });
    }
  });

  displayIndex++;
}

// ==========================
//  Render Steps
// ==========================
stepsConfig.forEach((cfg, idx) => {
  const step = document.createElement("section");
  step.classList.add("step");
  if (idx === 0) step.classList.add("active");

  step.dataset.type = cfg.type;
  step.dataset.displayIndex = cfg.displayIndex;

  if (cfg.type === "chart") {
    step.dataset.chartId = cfg.chartId;

    step.innerHTML = `
      <div class="start-container1">
        <div class="study-container">
          <div class="chart-container">
            <img src="images/${cfg.chartId}_chart.png" alt="Chart ${cfg.chartId}">
          </div>
          <div class="study-question">
            <p><strong>What pattern can you see in the line chart?</strong></p>
            <div class="multiple-choice">
              <label><input type="radio" name="q_${cfg.displayIndex}" value="upward"> Upward/Increasing</label><br>
              <label><input type="radio" name="q_${cfg.displayIndex}" value="downward"> Downward/Decreasing</label><br>
              <label><input type="radio" name="q_${cfg.displayIndex}" value="peak"> Peak/Spike</label><br>
              <label><input type="radio" name="q_${cfg.displayIndex}" value="valley"> Valley/Drop</label><br>
              <label><input type="radio" name="q_${cfg.displayIndex}" value="periodic"> Periodic</label><br>
              <label><input type="radio" name="q_${cfg.displayIndex}" value="uniform"> Uniform</label><br>
              <label><input type="radio" name="q_${cfg.displayIndex}" value="irregular"> Irregular</label><br>
              <label><input type="radio" name="q_${cfg.displayIndex}" value="Other"> Other</label>
              <input type="text" id="other_${cfg.displayIndex}" style="display:none; margin-left:20px; padding:4px;">
            </div>
          </div>
        </div>
      </div>
      <button class="start-btn" onclick="manualNext()">Next</button>
    `;
  }

  if (cfg.type === "attention") {
    step.dataset.attentionId = cfg.attentionId;

    step.innerHTML = `
      <div class="start-container1">
        <div class="study-container">
          <div class="chart-container">
            <img src="${cfg.image}" alt="Attention Check">
          </div>
          <div class="study-question">
            <p><strong>${cfg.question}</strong></p>
            <label><input type="radio" name="attn_${cfg.attentionId}" value="Yes"> Yes</label><br>
            <label><input type="radio" name="attn_${cfg.attentionId}" value="No"> No</label>
          </div>
        </div>
      </div>
      <button class="start-btn" onclick="manualNext()">Next</button>
    `;
  }

  container.appendChild(step);
  steps.push(step);
});


// Show/hide "Other" input for chart questions only
document.addEventListener("change", (e) => {
  if (!e.target.matches('input[type="radio"]')) return;

  const name = e.target.name;

  // Only apply to chart questions (q_#)
  if (!name.startsWith("q_")) return;

  const displayIndex = name.split("_")[1];
  const input = document.getElementById(`other_${displayIndex}`);
  if (!input) return;

  if (e.target.value === "Other") {
    input.style.display = "inline-block";
  } else {
    input.style.display = "none";
    input.value = "";
  }
});


// ==========================
//  Timer + Navigation Logic
// ==========================
let timer;
let questionStartTime = null; // Tracks when the current question appeared


function startTimer() {
  stopTimer();
  questionStartTime = Date.now();
  animateGlobalTimer();

  timer = setTimeout(() => {
    completeCurrentStep("auto");
  }, 15000);
}


function animateGlobalTimer() {
  const bar = document.getElementById("global-timer-bar");
  if (!bar) return;

  const totalDuration = 15000; // 15 seconds
  const start = Date.now();

  // reset appearance each question
  bar.style.width = "100%";
  bar.style.backgroundColor = "#E53935"; // solid red

  function update() {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / totalDuration, 1);
    const remaining = 1 - progress;

    // shrink bar width
    bar.style.width = `${remaining * 100}%`;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}


function stopTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function manualNext() {
  const currentStepEl = steps[currentStep];
  const nextButton = currentStepEl.querySelector(".start-btn");

  const selected = currentStepEl.querySelector('input[type="radio"]:checked');
  const otherInput = currentStepEl.querySelector('input[type="text"]');

  if (!selected) {
    nextButton.classList.add("shake");
    setTimeout(() => nextButton.classList.remove("shake"), 400);
    return;
  }

  if (selected.value === "Other" && otherInput && otherInput.value.trim() === "") {
    otherInput.classList.add("shake");
    setTimeout(() => otherInput.classList.remove("shake"), 400);
    return;
  }

  completeCurrentStep("manual");
}


function showNoiseMaskAndNext() {
  const mask = document.getElementById("noise-mask");
  mask.style.display = "block";
  mask.classList.remove("fade-out");

  setTimeout(() => {
    mask.classList.add("fade-out");
    setTimeout(() => {
      mask.style.display = "none";
      nextStep();
    }, FADE_DURATION_MS);
  }, MASK_DURATION_MS);
}


function nextStep() {
  stopTimer();
  steps[currentStep].classList.remove('active');
  currentStep++;

  if (currentStep >= steps.length) {
    submitData();
    return;
  }

  steps[currentStep].classList.add('active');
  updateProgress();
  window.scrollTo(0, 0);
  startTimer(); // restart timer for next question
}

function redirectToProlific() {
  window.location.href =
    "https://app.prolific.com/submissions/complete?cc=C17IY5E8";
}

function submitData() {
  stopTimer();

  // Detect Prolific
  const prolificPid = localStorage.getItem("PROLIFIC_PID");
  const isProlific = Boolean(prolificPid);

  // Load participant data from localStorage
  const participantData =
    JSON.parse(localStorage.getItem("participantData")) || {};

  // Attach recruitment metadata ONCE
  participantData.prolificPid =
    participantData.prolificPid || prolificPid || null;
  participantData.recruitmentSource = isProlific ? "prolific" : "direct";

  participantData.participantId =
    participantData.participantId || `participant_${Date.now()}`;
  participantData.completedAt = new Date().toISOString();

  // Compute total session time
  const startTime = participantData.sessionStartTime;
  const endTime = Date.now();
  const totalSessionMs = startTime ? endTime - startTime : null;
  const totalSessionSeconds =
    totalSessionMs !== null ? Math.round(totalSessionMs / 1000) : null;

  // Get screen size
  const screenWidth =
    window.innerWidth || document.documentElement.clientWidth;
  const screenHeight =
    window.innerHeight || document.documentElement.clientHeight;

  // Ensure demographic exists
  if (!participantData.demographic) participantData.demographic = {};

  // Add session metrics
  participantData.demographic.totalSessionSeconds = totalSessionSeconds;
  participantData.demographic.screenSize = `${screenWidth}x${screenHeight}`;

  // Determine endpoint
  const endpoint =
    window.location.hostname === "localhost" ? "/submit" : "/api/submit";

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(participantData)
  })
    .then(res => {
      if (!res.ok) throw new Error("Initial submit failed");
      return res.json();
    })
    .then(data => {
      if (!data.success) return;

      // Render thank-you + email UI
      container.innerHTML = `
        <div class="container">
          <div class="start-container">
            <h1>Thank You!</h1>
            <p>Your responses have been submitted successfully.</p>

            ${
              isProlific
                ? `<p>
                    If you are participating via Prolific, providing an email is optional
                    and not required for compensation.
                  </p>`
                : `<p>
                    Please enter your email so we can contact you if you win the $50 raffle.
                  </p>`
            }

            <input
              type="email"
              id="raffle-email"
              placeholder="you@example.com"
              style="padding:8px; width:300px; margin:10px 0; border:2px solid #ddd; border-radius:6px;"
            />

            <br />

            <button class="start-btn" id="save-email-btn">
              ${isProlific ? "Submit Email (optional)" : "Submit Email"}
            </button>

            ${
              isProlific
                ? `<button class="start-btn" id="skip-email-btn" style="margin-left:10px;">
                    Skip & return to Prolific
                  </button>`
                : ""
            }
          </div>
        </div>
      `;

      if (isProlific) {
        const skipBtn = document.getElementById("skip-email-btn");
        if (skipBtn) {
          skipBtn.addEventListener("click", () => {
            localStorage.removeItem("participantData");
            redirectToProlific();
          });
        }
      }

      const lastParticipant = JSON.parse(JSON.stringify(participantData));
      const btn = document.getElementById("save-email-btn");

      btn.addEventListener("click", () => {
        btn.disabled = true;

        const emailInput = document.getElementById("raffle-email");
        const emailVal = emailInput.value.trim();

        if (!emailVal && !isProlific) {
          btn.disabled = false;
          emailInput.classList.add("shake");
          setTimeout(() => emailInput.classList.remove("shake"), 400);
          return;
        }

        if (!emailVal && isProlific) {
          localStorage.removeItem("participantData");
          redirectToProlific();
          return;
        }

        if (!lastParticipant.demographic)
          lastParticipant.demographic = {};
        lastParticipant.demographic.email = emailVal;

        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...lastParticipant,
            updateOnly: true
          })
        })
          .then(res => {
            if (!res.ok) throw new Error("Email update failed");
          })
          .then(() => {
            localStorage.removeItem("participantData");
            localStorage.removeItem("PROLIFIC_PID");

            if (isProlific) {
              redirectToProlific();
              return;
            }

            container.innerHTML = `
              <div class="container">
                <div class="start-container">
                  <h1>Thank You!</h1>
                  <p>Your email has been recorded.</p>
                  <p>You may now close this window.</p>
                </div>
              </div>
            `;
          })
          .catch(err => {
            console.error("❌ Email update failed:", err);
            alert("There was a problem saving your email. Please try again.");
            btn.disabled = false;
          });
      });
    })
    .catch(err => {
      console.error("❌ Initial submit failed:", err);
      alert("There was a problem submitting your responses. Please try again.");
    });
}

function completeCurrentStep(method) {
  stopTimer();
  saveStepResponse(method);

  // If this was the last step, submit immediately
  if (currentStep === steps.length - 1) {
    submitData();
    return;
  }

  showNoiseMaskAndNext();
}


function saveStepResponse(method = "auto") {
  const stepEl = steps[currentStep];

  if (stepEl.dataset.completed) return;
  stepEl.dataset.completed = "true";
  const stepType = stepEl.dataset.type;
  const endTime = Date.now();
  const responseTimeMs = questionStartTime ? endTime - questionStartTime : null;

  let finalMethod = method;

  let response = {
    displayIndex: currentStep + 1,
    timestamp: new Date().toISOString(),
    responseTimeMs
  };

  // ==========================
  // Chart response
  // ==========================
  if (stepType === "chart") {
    const chartId = Number(stepEl.dataset.chartId);
    const displayIndex = Number(stepEl.dataset.displayIndex);

    const selected = stepEl.querySelector('input[type="radio"]:checked');
    const otherInput = stepEl.querySelector('input[type="text"]');

    if (finalMethod === "auto" && selected) {
      finalMethod = "auto_with_selection";
    }

    response.chartId = chartId;
    response.displayIndex = displayIndex;
    response.method = finalMethod;

    if (selected) {
      response.choice = selected.value;
      response.other =
        selected.value === "Other" && otherInput
          ? otherInput.value.trim()
          : "";
    } else {
      response.choice =
        finalMethod === "auto"
          ? "Not answered (auto)"
          : "Not answered";
      response.other = "";
    }
  }

  // ==========================
  // Attention check response
  // ==========================
  else if (stepType === "attention") {
    const attnId = stepEl.dataset.attentionId;
    const selected = stepEl.querySelector('input[type="radio"]:checked');

    response.attentionCheckId = attnId;
    response.choice = selected ? selected.value : "Not answered";
    response.method = finalMethod;
  }

  participantData.responses.push(response);
  localStorage.setItem("participantData", JSON.stringify(participantData));
}


// ==========================
//  Progress Update + Init
// ==========================
function updateProgress() {
  const progressPercent = ((currentStep + 1) / steps.length) * 100;
  progressBar.style.width = progressPercent + '%';

  const completedRealCharts = steps
    .slice(0, currentStep + 1)
    .filter(s => s.dataset.type === "chart").length;

  const totalRealCharts = TOTAL_CHARTS;

  const counter = document.getElementById('question-counter');
  if (counter) {
    counter.textContent = `Chart ${Math.min(completedRealCharts, totalRealCharts)} of ${totalRealCharts}`;
  }
}


updateProgress();

// Set study start time ONCE per session
if (!participantData.sessionStartTime) {
  participantData.sessionStartTime = Date.now();
  localStorage.setItem("participantData", JSON.stringify(participantData));
}

// start first timer
startTimer();
