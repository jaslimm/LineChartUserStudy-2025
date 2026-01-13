// ==========================
//  Experiment Configuration
// ==========================
const TOTAL_CHARTS = 50;
const TOTAL_STEPS = TOTAL_CHARTS;
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

// ==========================
//  Fixed Chart Order
// ==========================
const chartOrder = Array.from({ length: TOTAL_CHARTS }, (_, i) => i + 1);

participantData.chartOrder = chartOrder;
localStorage.setItem("participantData", JSON.stringify(participantData));

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
questionCounter.textContent = `Question 1 of ${TOTAL_STEPS}`;

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
//  Generate One Step per Chart
// ==========================
for (let i = 0; i < TOTAL_CHARTS; i++) {
  const chartId = chartOrder[i];
  const displayIndex = i + 1;

  // Create and append chart step
  const step = document.createElement('section');
  step.classList.add('step');
  if (i === 0) step.classList.add('active');
  step.dataset.attention = "false"; // default

  step.innerHTML = `
    <div class="start-container1">
      <div class="study-container">
        <div class="chart-container" id="chart-container-${displayIndex}">
          <img src="images/${chartId}_chart.png" alt="Chart ${chartId}" id="chart-img-${displayIndex}">
        </div>
        <div class="study-question">
          <p><strong>What pattern can you see in the line chart?</strong></p>
          <div class="multiple-choice">
            <label><input type="radio" name="q_${displayIndex}" value="upward" required> Upward/Increasing</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="downward"> Downward/Decreasing</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="peak"> Peak/Spike</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="valley"> Valley/Drop</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="periodic"> Periodic</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="uniform"> Uniform</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="irregular"> Irregular</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="Other"> Other</label>
            <input type="text" id="other_${displayIndex}" style="margin-left:20px; padding:4px;" placeholder="Specify if other">
          </div>
        </div>
      </div>
    </div>
    <button class="start-btn" onclick="manualNext()">Next</button>
  `;
  container.appendChild(step);
  steps.push(step);
  // ✅ Check if an attention check should follow this chart
  const attn = ATTENTION_CHECKS.find(a => a.position === displayIndex);
  if (attn) {
    const attnStep = document.createElement('section');
    attnStep.classList.add('step');
    attnStep.dataset.attention = "true";
    attnStep.innerHTML = `
      <div class="study-container">
        <div class="chart-container">
          <img src="${attn.image}" alt="Attention Check">
        </div>
        <div class="study-question">
          <p><strong>${attn.question}</strong></p>
          <label><input type="radio" name="q_attn_${attn.id}" value="Yes"> Yes</label><br>
          <label><input type="radio" name="q_attn_${attn.id}" value="No"> No</label><br>
        </div>
      </div>
      <button class="start-btn" onclick="manualNext()">Next</button>
    `;
    steps.push(attnStep);
    container.appendChild(attnStep);
  }
}

// Show/hide "Other" input when selected
document.addEventListener("change", (e) => {
  // Check if the changed element is one of the radio buttons
  if (e.target.matches('input[type="radio"]')) {
    const name = e.target.name; // e.g., q_5
    const displayIndex = name.split("_")[1];
    const input = document.getElementById(`other_${displayIndex}`);

    if (!input) return;

    // Show only when "Other" is selected; hide otherwise
    if (e.target.value === "Other") {
      input.style.display = "inline-block";
    } else {
      input.style.display = "none";
      input.value = ""; // clear text if switching away
    }
  }
});

// ==========================
//  Timer + Navigation Logic
// ==========================
let timer;
let questionStartTime = null; // Tracks when the current question appeared


function startTimer() {
  stopTimer();
  questionStartTime = Date.now(); // record when the chart appeared
  animateGlobalTimer();

  timer = setTimeout(() => {
    saveChartResponse("auto"); // save as auto-advanced if time runs out
    showNoiseMaskAndNext();
  }, 15000); // 15 seconds per question
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
  clearTimeout(timer);
}

function manualNext() {
  const displayIndex = currentStep + 1;
  const currentStepEl = steps[currentStep];
  const nextButton = currentStepEl.querySelector(".start-btn");

  // Look for any checked radio input inside this step
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

  stopTimer();
  saveChartResponse("manual");
  showNoiseMaskAndNext();
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
    "https://app.prolific.com/submissions/complete?cc=C1E0CZOP";
}

function submitData() {
  stopTimer();
  // Detect Prolific
  const prolificPid = localStorage.getItem("PROLIFIC_PID");
  const isProlific = Boolean(prolificPid);

  // Load participant data from localStorage
  const participantData = JSON.parse(localStorage.getItem("participantData")) || {};

  // Attach recruitment metadata ONCE
  participantData.prolificPid = participantData.prolificPid || prolificPid || null;
  participantData.recruitmentSource = isProlific ? "prolific" : "direct";

  participantData.participantId =
    participantData.participantId || `participant_${Date.now()}`;
  participantData.completedAt = new Date().toISOString();

  // Compute total session time
  const startTime = parseInt(localStorage.getItem("studyStartTime"), 10);
  const endTime = Date.now();
  const totalSessionMs = endTime - startTime;
  const totalSessionSeconds = Math.round(totalSessionMs / 1000);

  // Get screen size
  const screenWidth = window.innerWidth || document.documentElement.clientWidth;
  const screenHeight = window.innerHeight || document.documentElement.clientHeight;

  // Ensure demographic exists
  if (!participantData.demographic) participantData.demographic = {};

  // Add session metrics to demographic data
  participantData.demographic.totalSessionSeconds = totalSessionSeconds;
  participantData.demographic.screenSize = `${screenWidth}x${screenHeight}`;

  // Determine endpoint
  const endpoint =
    window.location.hostname === "localhost"
      ? "/submit"
      : "/api/submit";

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(participantData)
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        // render thank-you WITH email box
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

              <br>

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
            localStorage.removeItem("studyStartTime");
            redirectToProlific();
          });
        }
      }

        // keep the last participantData in memory so we can send email
        const lastParticipant = participantData;

        // attach handler
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

        // If Prolific user submits with no email, just redirect
        if (!emailVal && isProlific) {
          localStorage.removeItem("participantData");
          localStorage.removeItem("studyStartTime");
          redirectToProlific();
          return;
        }

          // add email to demographic
          if (!lastParticipant.demographic) lastParticipant.demographic = {};
          lastParticipant.demographic.email = emailVal;

          // send just the email update (you can hit same endpoint)
          fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lastParticipant)
          }).then(() => {
            localStorage.removeItem("participantData");
            localStorage.removeItem("studyStartTime");
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
          });
        });
      } else {
        alert("Error submitting data. Please try again.");
      }
    })
    .catch((err) => {
      console.error("❌ Network error:", err);
      alert("Network error. Please try again.");
    });
}


// ==========================
//  Response Handling
// ==========================
function saveChartResponse(method = "auto") {
  const chartIndex = currentStep;
  const chartId = chartOrder[chartIndex];
  const displayIndex = chartIndex + 1;

  const selected = document.querySelector(`input[name="q_${displayIndex}"]:checked`);
  const otherText = document.getElementById(`other_${displayIndex}`)?.value.trim();

  const endTime = Date.now();
  const responseTimeMs = questionStartTime ? endTime - questionStartTime : null;

  // ✅ NEW LOGIC:
  // If time runs out ("auto"), but a selection was already made,
  // still record the selected option.
  method = method === "auto" && selected ? "auto_with_selection" : method;
  let choice;
  let other = "";

  if (selected) {
    choice = selected.value;
    if (selected.value === "Other") {
      other = otherText || "";
    }
  } else {
    choice = method === "auto" ? "Not answered (auto)" : "Not answered";
  }

  const response = {
    displayIndex,
    chartId,
    choice,
    other,
    timestamp: new Date().toISOString(),
    responseTimeMs,
    method // "manual" or "auto"
  };

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
    .filter(s => s.dataset.attention !== "true").length;

  const totalRealCharts = TOTAL_CHARTS;


  const counter = document.getElementById('question-counter');
  if (counter) {
    counter.textContent = `Chart ${Math.min(completedRealCharts, totalRealCharts)} of ${totalRealCharts}`;
  }
}

updateProgress();

// Always reset study start time when a new session begins
localStorage.setItem("studyStartTime", Date.now().toString());

// start first timer
startTimer();

