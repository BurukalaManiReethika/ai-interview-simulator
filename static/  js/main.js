/* ── State ── */
const state = {
  domains: {},
  selectedDomain: 'Python',
  selectedDiff: 'easy',
  currentQ: null,
  timerInterval: null,
  timerSeconds: 0,
  history: [],
  isEvaluating: false
};

const DOMAIN_ICONS = {
  'Python': '🐍',
  'Data Structures': '🌲',
  'Algorithms': '⚡',
  'System Design': '🏗️',
  'Behavioral': '💬',
  'SQL': '🗄️'
};

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadDomains();
  renderDomainGrid();
});

async function loadDomains() {
  try {
    const res = await fetch('/api/domains');
    state.domains = await res.json();
  } catch (e) {
    console.error('Failed to load domains', e);
  }
}

/* ── Domain Grid ── */
function renderDomainGrid() {
  const grid = document.getElementById('domain-grid');
  grid.innerHTML = '';
  for (const [domain, diffs] of Object.entries(state.domains)) {
    const total = Object.values(diffs).reduce((a, b) => a + b, 0);
    const icon = DOMAIN_ICONS[domain] || '📋';
    const card = document.createElement('div');
    card.className = 'domain-card' + (domain === state.selectedDomain ? ' selected' : '');
    card.innerHTML = `
      <div class="dc-icon">${icon}</div>
      <div class="dc-name">${domain}</div>
      <div class="dc-count">${total} questions</div>
    `;
    card.onclick = () => selectDomain(domain, card);
    grid.appendChild(card);
  }
}

function selectDomain(domain, el) {
  state.selectedDomain = domain;
  document.querySelectorAll('.domain-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

/* ── Difficulty ── */
function setDiff(el) {
  state.selectedDiff = el.dataset.diff;
  document.querySelectorAll('.diff-btn').forEach(b => {
    b.classList.remove('active', 'easy', 'medium', 'hard');
  });
  el.classList.add('active', state.selectedDiff);
}

/* ── Timer ── */
function startTimer() {
  state.timerSeconds = 0;
  clearInterval(state.timerInterval);
  const el = document.getElementById('timer');
  state.timerInterval = setInterval(() => {
    state.timerSeconds++;
    const m = Math.floor(state.timerSeconds / 60);
    const s = state.timerSeconds % 60;
    el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    el.className = 'timer' + (
      state.timerSeconds > 300 ? ' danger' :
      state.timerSeconds > 180 ? ' warn' : ''
    );
  }, 1000);
}

/* ── Start Question ── */
async function startQuestion() {
  try {
    const res = await fetch('/api/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: state.selectedDomain, difficulty: state.selectedDiff })
    });
    if (!res.ok) throw new Error('Failed to load question');
    const data = await res.json();
    state.currentQ = data;

    document.getElementById('q-domain-badge').textContent = data.domain;
    const diffBadge = document.getElementById('q-diff-badge');
    diffBadge.textContent = data.difficulty;
    diffBadge.className = 'badge diff-badge ' + data.difficulty;
    document.getElementById('question-text').textContent = data.question;
    document.getElementById('question-tip').textContent = '💡 ' + data.tip;
    document.getElementById('answer-textarea').value = '';
    document.getElementById('word-count').textContent = '0 words';
    document.getElementById('result-area').innerHTML = '';

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Submit answer
    `;
    submitBtn.onclick = submitAnswer;

    showPanel('question-panel');
    startTimer();
  } catch (e) {
    alert('Could not load question. Please try again.');
  }
}

function skipQuestion() {
  clearInterval(state.timerInterval);
  startQuestion();
}

function goBack() {
  clearInterval(state.timerInterval);
  showPanel('setup-panel');
}

function showPanel(id) {
  document.getElementById('setup-panel').style.display = id === 'setup-panel' ? 'block' : 'none';
  document.getElementById('question-panel').style.display = id === 'question-panel' ? 'block' : 'none';
  if (id === 'setup-panel') renderHistory();
}

/* ── Answer input ── */
function onAnswerInput() {
  const val = document.getElementById('answer-textarea').value.trim();
  const words = val ? val.split(/\s+/).filter(w => w).length : 0;
  document.getElementById('word-count').textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

/* ── Submit ── */
async function submitAnswer() {
  if (state.isEvaluating) return;
  const answer = document.getElementById('answer-textarea').value.trim();
  if (!answer) { alert('Please write an answer first.'); return; }

  clearInterval(state.timerInterval);
  state.isEvaluating = true;

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner"><span></span><span></span><span></span></span> Evaluating…`;

  document.getElementById('result-area').innerHTML = `
    <div class="result-card" style="color: var(--text-secondary); font-size: 14px; text-align: center; padding: 2rem;">
      <span class="spinner"><span></span><span></span><span></span></span>
      <span style="margin-left: 10px;">Analyzing your answer with AI…</span>
    </div>`;

  try {
    const res = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: state.currentQ.question,
        answer: answer,
        domain: state.currentQ.domain,
        difficulty: state.currentQ.difficulty,
        time_taken: state.timerSeconds
      })
    });
    const ev = await res.json();
    if (ev.error) throw new Error(ev.error);

    renderResult(ev);
    state.history.unshift({
      q: state.currentQ.question,
      domain: state.currentQ.domain,
      diff: state.currentQ.difficulty,
      score: ev.overall_score,
      grade: ev.grade,
      time: state.timerSeconds
    });
    updateHeaderStats();
  } catch (e) {
    document.getElementById('result-area').innerHTML = `
      <div class="result-card" style="color: var(--red-400); font-size: 14px;">
        ⚠️ Could not get AI evaluation. Please check your API key and try again.
      </div>`;
  }

  state.isEvaluating = false;
  submitBtn.disabled = false;
  submitBtn.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 12 19 19 12"></polyline><polyline points="5 5 12 12 19 5"></polyline></svg>
    Next question
  `;
  submitBtn.onclick = startQuestion;
}

/* ── Render Result ── */
function renderResult(ev) {
  const score = ev.overall_score || 5;
  const isGood = score >= 8, isMid = score >= 5;
  const scoreColor = isGood ? '#1D9E75' : isMid ? '#BA7517' : '#A32D2D';
  const scoreBg = isGood ? '#E1F5EE' : isMid ? '#FAEEDA' : '#FCEBEB';
  const mins = Math.floor(state.timerSeconds / 60);
  const secs = String(state.timerSeconds % 60).padStart(2, '0');

  const criteria = ev.criteria || {};
  const criteriaHTML = Object.entries(criteria).map(([key, val]) => {
    const pct = (val / 10) * 100;
    const col = val >= 8 ? '#1D9E75' : val >= 5 ? '#BA7517' : '#A32D2D';
    return `<div class="criterion">
      <div class="c-name">${key}</div>
      <div class="c-bar"><div class="c-fill" style="width:${pct}%;background:${col}"></div></div>
      <div class="c-score">${val}/10</div>
    </div>`;
  }).join('');

  document.getElementById('result-area').innerHTML = `
  <div class="result-card">
    <div class="score-header">
      <div class="score-circle" style="background:${scoreBg};color:${scoreColor};">${score}/10</div>
      <div class="score-info">
        <h3>${ev.grade || 'Evaluated'}</h3>
        <p>Time taken: ${mins}:${secs}</p>
      </div>
    </div>

    ${criteriaHTML ? `<div class="criteria-grid">${criteriaHTML}</div>` : ''}

    <div class="feedback-block">
      <div class="feedback-label">✅ Strengths</div>
      <div class="feedback-text">${ev.strengths || '—'}</div>
    </div>

    <div class="feedback-block">
      <div class="feedback-label">📈 Areas to improve</div>
      <div class="feedback-text">${ev.improvements || '—'}</div>
    </div>

    ${ev.model_answer ? `
    <div class="feedback-block">
      <div class="feedback-label">💡 Model answer</div>
      <div class="feedback-text">${ev.model_answer}</div>
    </div>` : ''}

    <div class="next-row">
      <button class="btn-primary" onclick="startQuestion()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        Next question
      </button>
      <button class="btn-ghost" onclick="goBack()">Change topic</button>
    </div>
  </div>`;
}

/* ── History ── */
function renderHistory() {
  const section = document.getElementById('history-section');
  if (!state.history.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  const scores = state.history.map(h => h.score);
  const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  const best = Math.max(...scores);

  document.getElementById('metrics-row').innerHTML = `
    <div class="metric-card"><div class="mv">${state.history.length}</div><div class="ml">Questions answered</div></div>
    <div class="metric-card"><div class="mv">${avg}</div><div class="ml">Average score</div></div>
    <div class="metric-card"><div class="mv">${best}/10</div><div class="ml">Best score</div></div>
  `;

  document.getElementById('history-list').innerHTML = state.history.map(h => {
    const col = h.score >= 8 ? '#1D9E75' : h.score >= 5 ? '#BA7517' : '#A32D2D';
    const mins = Math.floor(h.time / 60);
    const secs = String(h.time % 60).padStart(2, '0');
    return `<div class="history-item">
      <div class="hi-top">
        <span class="badge domain-badge">${h.domain}</span>
        <span class="badge diff-badge ${h.diff}">${h.diff}</span>
        <span class="hi-q">${h.q}</span>
        <span class="hi-score" style="color:${col}">${h.score}/10</span>
      </div>
      <div class="hi-meta">${h.grade} · ${mins}:${secs} taken</div>
    </div>`;
  }).join('');
}

function updateHeaderStats() {
  if (!state.history.length) return;
  const scores = state.history.map(h => h.score);
  const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  document.getElementById('session-stats').style.display = 'flex';
  document.getElementById('header-count').textContent = `${state.history.length} answered`;
  document.getElementById('header-avg').textContent = `Avg: ${avg}`;
}
