// ==========================
//  Experiment Configuration
// ==========================
const TOTAL_CHARTS = 2;
const TOTAL_STEPS = TOTAL_CHARTS;
const container = document.body;
let currentStep = 0;
const steps = [];

// Noise mask timing (in milliseconds)
const MASK_DURATION_MS = 500; // how long static shows
const FADE_DURATION_MS = 50; // how long fade-out lasts

// Load participant data
const participantData = JSON.parse(localStorage.getItem("participantData")) || {
  demographic: {},
  responses: []
};

// ==========================
//  Randomize Chart Order
// ==========================
const chartOrder = Array.from({ length: TOTAL_CHARTS }, (_, i) => i + 1);
for (let i = chartOrder.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [chartOrder[i], chartOrder[j]] = [chartOrder[j], chartOrder[i]];
}
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

  const step = document.createElement('section');
  step.classList.add('step');
  if (i === 0) step.classList.add('active');

  step.innerHTML = `
    <div class="start-container1">
      <div class="study-container">
        <div class="chart-container" id="chart-container-${displayIndex}">
          <img src="images/${chartId}_chart.png" alt="Chart ${chartId}" id="chart-img-${displayIndex}">
        </div>
        <div class="study-question">
          <p><strong>Which pattern can you see the line chart?</strong></p>
          <div class="multiple-choice">
            <label><input type="radio" name="q_${displayIndex}" value="upward" required> Upward</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="downward"> Downward</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="irregular"> Irregular</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="periodic"> Periodic</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="uniform"> Uniform</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="peak"> Peak</label><br>
            <label><input type="radio" name="q_${displayIndex}" value="valley"> Valley</label><br>
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
  const selected = document.querySelector(`input[name="q_${displayIndex}"]:checked`);
  const nextButton = steps[currentStep].querySelector(".start-btn");

  // If "Other" selected, ensure text box is visible (handled below)
  const otherInput = document.getElementById(`other_${displayIndex}`);

  if (!selected) {
    // Shake the Next button instead of the whole question
    nextButton.classList.add("shake");
    setTimeout(() => nextButton.classList.remove("shake"), 400);
    return;
  }

  // Validate "Other" text field
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

function submitData() {
  // Collect participant data from localStorage
  const participantData = JSON.parse(localStorage.getItem("participantData")) || {};

  // Add timestamp for good measure
  participantData.completedAt = new Date().toISOString();

  console.log("Submitting data:", participantData);

  // Send to backend
  fetch("/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(participantData)
  })
  .then((res) => res.json())
  .then((data) => {
    console.log("Server response:", data);
    if (data.success) {
      // Show thank-you message
      container.innerHTML = `
        <div class="container">
          <div class="start-container">
            <h1>Thank You!</h1>
            <p>Your responses have been saved successfully.</p>
          </div>
        </div>
      `;

      // Optional: clear stored data
      localStorage.removeItem("participantData");
    } else {
      alert("There was a problem saving your data. Please try again.");
    }
  })
  .catch((error) => {
    console.error("Error submitting data:", error);
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

  const counter = document.getElementById('question-counter');
  if (counter) {
    counter.textContent = `Chart ${currentStep + 1} of ${TOTAL_STEPS}`;
  }
}

updateProgress();

// store study start time if not already
if (!localStorage.getItem("studyStartTime")) {
  localStorage.setItem("studyStartTime", Date.now().toString());
}

// start first timer
startTimer();

