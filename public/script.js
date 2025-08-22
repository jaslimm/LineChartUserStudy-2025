// ===== Config =====
const TOTAL_AVAILABLE_CHARTS = 45;    // adjust to your images folder
const totalCharts = 3;
const totalSteps = totalCharts * 3;

// ===== State =====
const container = document.body;
let timer;
let timeLeft;
const steps = [];
const participantData = JSON.parse(localStorage.getItem("participantData")) || {
  demographic: {},
  responses: []
};

// ===== Helpers =====
function sampleUniqueInts(n, maxInclusive) {
  const pool = Array.from({ length: maxInclusive }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

// Randomly pick N charts from 1..TOTAL_AVAILABLE_CHARTS (no stratification)
const selectedCharts = sampleUniqueInts(totalCharts, TOTAL_AVAILABLE_CHARTS);

// ===== UI: progress + timer + counter =====
const progressBarContainer = document.createElement('div');
progressBarContainer.id = "progress-bar-container";
const progressBar = document.createElement('div');
progressBar.id = "progress-bar";
progressBarContainer.appendChild(progressBar);
container.insertBefore(progressBarContainer, container.firstChild);

const timerDisplay = document.createElement('p');
timerDisplay.id = "timer";
container.insertBefore(timerDisplay, progressBarContainer.nextSibling);

// Counter (fixed left)
const chartCounterLeft = document.createElement('div');
chartCounterLeft.className = "chart-counter-left";
container.insertBefore(chartCounterLeft, timerDisplay.nextSibling);

// Helper to update counter text based on current step
function updateChartCounter(stepIndex) {
  if (stepIndex >= totalSteps) {
    chartCounterLeft.style.display = 'none';
    return;
  }
  const chartIndex = Math.floor(stepIndex / 3) + 1; // 1..totalCharts
  chartCounterLeft.textContent = `Chart ${chartIndex} of ${totalCharts}`;
  chartCounterLeft.style.display = '';
}

// ===== Build steps (3 per chart) =====
for (let i = 0; i < totalCharts; i++) {
  const chartId = selectedCharts[i];         // randomized chart number
  const displayNo = i + 1;

  // --- Step 1: Trend ---
  const trendStep = document.createElement('section');
  trendStep.classList.add('step');
  if (i === 0) trendStep.classList.add('active');
  trendStep.innerHTML = `
    <div class="start-container1">
      <div class="chart-heading">
        
        <div>Task <span class="highlight">1</span> of 3</div>
      </div>
      <div class="study-container">
        <div class="chart-container">
          <img src="../images/${chartId}_chart.png" alt="Chart ${chartId}">
        </div>
        <div class="study-question" id="trend-group-${i}">
          <p>What trend do you see in the line chart? <span style="color:red">*</span></p>
          <div class="scale-options">
            <label><input type="radio" name="trend${i}" value="Upward"> Upward</label>
            <label><input type="radio" name="trend${i}" value="Downward"> Downward</label>
            <label><input type="radio" name="trend${i}" value="Irregular"> Irregular</label>
            <label><input type="radio" name="trend${i}" value="Uniform"> Uniform</label>
            <label><input type="radio" name="trend${i}" value="Peak"> Peak</label>
            <label><input type="radio" name="trend${i}" value="Valley"> Valley</label>
          </div>
        </div>
      </div>
    </div>
    <br>
    <button class="start-btn">Next</button>
  `;
  container.appendChild(trendStep);
  steps.push(trendStep);

  // --- Step 2: Confidence (1–5) ---
  const confidenceStep = document.createElement('section');
  confidenceStep.classList.add('step');
  const confidenceOptions = [1, 2, 3, 4, 5].map(n =>
    `<label><input type="radio" name="confidence${i}" value="${n}"> ${n}</label>`
  ).join('');
  confidenceStep.innerHTML = `
    <div class="start-container1">
      <div class="chart-heading">
        
        <div>Task <span class="highlight">2</span> of 3</div>
      </div>
      <div class="study-container">
        <div class="chart-container">
          <img src="../images/${chartId}_chart.png" alt="Chart ${chartId}">
        </div>
        <div class="study-question" id="confidence-group-${i}">
          <p>How confident are you in your answer? <span style="color:red">*</span></p>
          <div class="likert-horizontal">${confidenceOptions}</div>
          <div class="likert-labels">
            <span>Not confident</span>
            <span>Very confident</span>
          </div>
        </div>
      </div>
    </div>
    <br>
    <button class="start-btn">Next</button>
  `;
  container.appendChild(confidenceStep);
  steps.push(confidenceStep);

  // --- Step 3: Text input ---
  const textStep = document.createElement('section');
  textStep.classList.add('step');
  textStep.innerHTML = `
    <div class="start-container1">
      <div class="chart-heading">
        
        <div>Task <span class="highlight">3</span> of 3</div>
      </div>
      <div class="study-container">
        <div class="chart-container">
          <img src="../images/${chartId}_chart.png" alt="Chart ${chartId}">
        </div>
        <div class="study-question">
          <p>Describe the pattern in the chart below: <span style="color:red">*</span></p>
          <textarea id="response${i}" name="response${i}" rows="4" cols="50" required></textarea>
        </div>
      </div>
    </div>
    <br>
    <button class="start-btn">Next</button>
  `;
  container.appendChild(textStep);
  steps.push(textStep);
}

// Final screen
const finalSection = document.createElement('section');
finalSection.classList.add('step');
finalSection.innerHTML = `
  <h1>Thank You!</h1>
  <p>You have completed the study.</p>
`;
container.appendChild(finalSection);
steps.push(finalSection);

// ===== Validation =====
function shake(el) {
  el.classList.remove('shake'); // restart anim
  void el.offsetWidth;
  el.classList.add('shake');
}
function clearInvalid(groupEl) {
  if (!groupEl) return;
  groupEl.classList.remove('shake');
  groupEl.querySelectorAll('input').forEach(inp => inp.classList.remove('invalid', 'shake'));
  groupEl.querySelectorAll('textarea').forEach(t => t.classList.remove('invalid', 'shake'));
}
function validateStep(index) {
  const stepType = index % 3;
  const chartIndex = Math.floor(index / 3);

  if (stepType === 0) {
    const group = document.getElementById(`trend-group-${chartIndex}`);
    const chosen = document.querySelector(`input[name="trend${chartIndex}"]:checked`);
    if (!chosen) {
      shake(group);
      group.querySelectorAll('input').forEach(i => i.classList.add('invalid'));
      return false;
    }
    clearInvalid(group);
    return true;
  }
  if (stepType === 1) {
    const group = document.getElementById(`confidence-group-${chartIndex}`);
    const chosen = document.querySelector(`input[name="confidence${chartIndex}"]:checked`);
    if (!chosen) {
      shake(group);
      group.querySelectorAll('input').forEach(i => i.classList.add('invalid'));
      return false;
    }
    clearInvalid(group);
    return true;
  }
  if (stepType === 2) {
    const textarea = document.getElementById(`response${chartIndex}`);
    const val = textarea.value.trim();
    if (!val) {
      textarea.classList.add('invalid');
      shake(textarea);
      textarea.focus();
      return false;
    }
    textarea.classList.remove('invalid', 'shake');
    return true;
  }
  return true;
}

// ===== Navigation / Timer =====
function getStepDuration(index) {
  const type = index % 3;
  return type === 2 ? 15 : 10;
}
function startTimer(index) {
  timeLeft = getStepDuration(index);
  timerDisplay.textContent = `Time Left: ${timeLeft.toFixed(1)}s`;
  timer = setInterval(() => {
    timeLeft -= 0.1;
    timerDisplay.textContent = `Time Left: ${timeLeft.toFixed(1)}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      // On timeout, only advance if current step is valid
      if (validateStep(index)) moveToNextStep(index);
    }
  }, 100);
}
function moveToNextStep(index) {
  if (index >= totalSteps) {
    progressBarContainer.style.display = 'none';
    timerDisplay.style.display = 'none';
    chartCounterLeft.style.display = 'none';
    return;
  }

  steps[index].classList.remove('active');
  steps[index + 1].classList.add('active');

  const progress = ((index + 1) / totalSteps) * 100;
  progressBar.style.width = `${progress}%`;

  updateChartCounter(index + 1);

  if (index + 1 === totalSteps) {
    timerDisplay.style.display = 'none';
    progressBarContainer.style.display = 'none';
    chartCounterLeft.style.display = 'none';
    return; // don't restart timer on final screen
  }

  startTimer(index + 1);
}


// Handle "Next" clicks with validation
document.querySelectorAll('.start-btn').forEach((button, index) => {
  button.addEventListener('click', () => {
    clearInterval(timer);

    // Block advance if invalid
    if (!validateStep(index)) {
      startTimer(index); // keep timer visible/active after feedback
      return;
    }

    const chartIndex = Math.floor(index / 3);
    const stepType = index % 3;

    participantData.responses[chartIndex] =
      participantData.responses[chartIndex] || { chartDisplayIndex: chartIndex + 1, chartId: selectedCharts[chartIndex] };

    if (stepType === 0) {
      const trend = document.querySelector(`input[name="trend${chartIndex}"]:checked`);
      participantData.responses[chartIndex].trend = trend.value;
    } else if (stepType === 1) {
      const confidence = document.querySelector(`input[name="confidence${chartIndex}"]:checked`);
      participantData.responses[chartIndex].confidence = Number(confidence.value);
    } else if (stepType === 2) {
      const text = document.getElementById(`response${chartIndex}`).value.trim();
      participantData.responses[chartIndex].description = text;
      localStorage.setItem("participantData", JSON.stringify(participantData));
    }

    if (index === totalSteps - 1) {
      submitData();
    }

    moveToNextStep(index);
  });
});

function submitData() {
  fetch('/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(participantData)
  })
    .then(res => res.json())
    .then(response => {
      console.log("Data submitted:", response);
    })
    .catch(error => {
      console.error("Submission failed:", error);
    });
}

// Initialize UI
updateChartCounter(0);
startTimer(0);
