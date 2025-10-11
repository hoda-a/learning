import { qsets } from './data.js';
import { COLLECTION_ITEMS } from './data.js';

const els = {
  qsetSelect: document.getElementById('qsetSelect'),
  resetBtn1: document.getElementById('resetBtn1'),
  resetBtn2: document.getElementById('resetBtn2'),
  goStickerBtn : document.getElementById("goStickerBtn"),
  goQuizBtn : document.getElementById("goQuizBtn"),
  bgModal : document.getElementById("bgModal"),
  bgClose : document.getElementById("closeBgModal"),
  bgSelector : document.getElementById("bgSelector"),
  quizNavigation : document.getElementById("quizNavigation"),

  quizCard: document.getElementById('quizCard'),
  stickerCard: document.getElementById('stickerCard'),

  hint: document.getElementById('hint'),

  options: document.getElementById('options'),
  qAudio: document.getElementById('qAudio'),
  playBtn: document.getElementById('playBtn'),

  promptImageWrap: document.getElementById('promptImageWrap'),
  promptImage: document.getElementById('promptImage'),

  feedback: document.getElementById('feedback'),

  startOverlay: document.getElementById('startOverlay'),
  bgChoices: document.getElementById('bgChoices'),

  stickerCanvas: document.getElementById('stickerCanvas'),
  openStickerModal: document.getElementById('openStickerModal'),
  deleteBtn: document.getElementById('deleteBtn'),
  dropzone: document.getElementById('dropzone'),
  starCount: document.getElementById('starCount'),
  timerFill: document.getElementById('timerFill'),
  
  
};

const SFX = { correct:'../media/sounds/correct.mp3', wrong:'../media/sounds/wrong.mp3', ding:'../media/sounds/ding.mp3' };
const sfxAudio = new Audio();

const THEMES = ['farm','city','forest','stadium','ocean','space','prehistoric', 'masjid','snowy'];
const THEME_BG = t => `../media/backgrounds/${t}.png`;



let state = {
  theme: 'garden',
  qsetIndex: 0,
  questionIndex: 0,
  timeLeft: 30,
  timerId: null,
  currentAnswer: null,
  attemptMade: false,
  stars: 0
};

function init() {
  els.bgChoices.innerHTML = THEMES
  .map(t => `<button data-theme="${t}"><img src="${THEME_BG(t)}" alt="${t}"></button>`)
  .join('');

  els.bgSelector.addEventListener('click', () => {
  els.bgModal.classList.remove('hidden');
 });

  els.bgChoices.addEventListener('click', (e) => {
   const btn = e.target.closest('button[data-theme]');
   if (!btn) return;
   state.theme = btn.dataset.theme;
   applyTheme();
   els.bgModal.classList.add('hidden');
 });


  els.bgClose.addEventListener('click', (e) => {
  els.bgModal.classList.add('hidden');
 });

  els.goQuizBtn.classList.toggle('hidden', true);

  els.resetBtn1.addEventListener("click", () => {
    resetQuiz();
    startQSet();
  }); 

  els.resetBtn2.addEventListener("click", () => {
    const confirmed = confirm("Are you sure you want to clear your sticker area?");
    if (confirmed) {
      resetSticker();
    }
  });

  els.goQuizBtn.addEventListener("click", () => {
    showView("quiz");
    renderQuestion();
  });
  els.goStickerBtn.addEventListener("click", () => {
    showView("sticker");
  });
  els.playBtn.addEventListener('click', () => { els.qAudio.currentTime = 0; els.qAudio.play(); });
  enableDropzone();
  renderStars();
  initStickerModal();
  
  document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseGame();
  }
  });

  window.addEventListener("blur", () => {
    pauseGame();
  });

window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('nameOverlay');
  const playerInput = document.getElementById('playerNameInput');
  const playerBtn = document.getElementById('playerNameBtn');

  playerInput.focus();

  playerBtn.addEventListener('click', () => {
    const name = playerInput.value.trim();
    if (!name) {
      input.classList.add('ring-2', 'ring-red-500');
      setTimeout(() => playerInput.classList.remove('ring-2', 'ring-red-500'), 800);
      return;
    }
    resetQuiz();
    startQSet();
    state.playerName = name;

    overlay.style.display = 'none';
  });

  playerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') playerBtn.click();
  });
});


}
document.addEventListener('DOMContentLoaded', init);

function applyTheme() {
  els.stickerCanvas.style.backgroundImage = state.theme
    ? `url('${THEME_BG(state.theme)}')`
    : '';
}

function showView(which) {
  els.quizCard.classList.remove('active');
  els.stickerCard.classList.remove('active');
  if (which === 'quiz') els.quizCard.classList.add('active');
  else els.stickerCard.classList.add('active');
  
  const onSticker = which === 'sticker';
  els.stickerCard.classList.toggle('hidden', !onSticker);
  els.bgSelector.classList.toggle('hidden', !onSticker);
  els.quizNavigation.classList.toggle('hidden', onSticker);
  els.goStickerBtn.classList.toggle('hidden', onSticker);
  els.openStickerModal.classList.toggle('hidden', !onSticker);
  els.resetBtn1.classList.toggle('hidden', onSticker);
  els.resetBtn2.classList.toggle('hidden', !onSticker);
  els.deleteBtn.classList.toggle('hidden', !onSticker);
  els.goQuizBtn.classList.toggle('hidden', !onSticker);
  els.quizCard.classList.toggle('hidden', onSticker);

  if (onSticker) {
    // Pause game flow
    pauseGame();
  } else {
    // Resume timer if it was paused
    if (!state.timerId && state.timeLeft > 0) {
      startTimer(); 
    }
  }
}




function startQSet() {
  const params = new URLSearchParams(window.location.search);
  state.qsetIndex = parseInt(params.get('qset') || 0, 10);
  
  const order = params.get('order');
  const qset = qsets[state.qsetIndex];


  if (order === 'linear') {
    state.poolIndices = Array.from({ length: qset.images.length }, (_, i) => i);
  } else {
    state.poolIndices = makeQuestionPool(qsets[state.qsetIndex]);
  }

  state.questionIndex = 0;
  renderStars();
  renderQuestion();
}


function resetQuiz(){
  clearInterval(state.timerId);
  state.questionIndex=0; 
  state.timeLeft=30;
  state.currentAnswer=null; 
  state.attemptMade=false;
  els.feedback.textContent=''; 
  showView('quiz');
}

function resetSticker(){
  els.stickerCanvas.style.backgroundImage = '';
  els.dropzone.innerHTML = "";
  showView('sticker');
}


function resetTimer() {
      state.timeLeft = 30;
      state.totalPause = 0;
      state.startTime = Date.now();
      // Instantly reset the bar to full width (no animation)
      els.timerFill.style.transition = "none";
      els.timerFill.style.width = "100%";
      // Force reflow to apply the style change immediately
      void els.timerFill.offsetWidth;
      // Re-enable transition for next countdown
      els.timerFill.style.transition = "width linear";

}

function startTimer() {
  clearInterval(state.timerId);
  if (state.pauseStart) {
    state.totalPause = state.totalPause + Date.now() - state.pauseStart;
    state.timerId = requestAnimationFrame(updateTimer);
  } else {
     resetTimer();
  }
  state.pauseStart = null;

  function updateTimer() {
    if (state.pauseStart > 0) {
      return;
    }
    const elapsed = (Date.now() - state.startTime - state.totalPause) / 1000;
    state.timeLeft = Math.max(0, 30 - elapsed);
    els.timerFill.style.width = `${(state.timeLeft / 30) * 100}%`;

    if (state.timeLeft <= 0) {
      clearInterval(state.timerId);
      handleTimeout();
      state.timeLeft = 30
    } else {
      state.timerId = requestAnimationFrame(updateTimer);
    }
  }
  requestAnimationFrame(updateTimer);
}




function handleTimeout(){
  postAnswerToGoogleForm(state.playerName, state.qsetIndex, state.form_q, 'Timeout');

  lockQuestion(); 
  sfx('wrong', () => {
      setTimeout(() => nextQuestion(), 800); // 1s after sound
  });

  markOption(null); 
  els.feedback.textContent="Time's up!";
  els.feedback.className = 'feedback show wrong';
  setTimeout(() => els.feedback.classList.remove('show'), 800);
}

function renderQuestion() {
  const qset = qsets[state.qsetIndex];
  const idx = state.poolIndices[state.questionIndex];
  const correctIdx = idx;
  state.currentAnswer = correctIdx;
  state.attemptMade = false;
  state.form_q = correctIdx

  const soundSrc = qset.sounds[correctIdx];
  els.qAudio.src = soundSrc || '';

  if (soundSrc) {
    els.qAudio.currentTime = 0;
    els.qAudio.play().catch(() => {});

    // Wait for audio to finish before starting the timer
    els.qAudio.onended = () => {
      startTimer();
    };
  } else {
    // No audio, just start timer immediately
    startTimer();
  }

  // Handle prompt image
  const hasPromptImg = Array.isArray(qset.soundImages) && qset.soundImages[correctIdx];
  if (hasPromptImg) {
    els.promptImageWrap.classList.remove('hidden');
    els.promptImage.src = qset.soundImages[correctIdx];
  } else {
    els.promptImageWrap.classList.add('hidden');
    els.promptImage.removeAttribute('src');
  }

  // Build options
  const total = Math.min(qset.images.length, qset.sounds.length);
  const distractors = new Set();
  while (distractors.size < 3 && distractors.size < total - 1) {
    const r = Math.floor(Math.random() * total);
    if (r !== correctIdx) distractors.add(r);
  }
  const optionIndices = [correctIdx, ...Array.from(distractors)];
  shuffle(optionIndices);

  els.options.innerHTML = '';
  optionIndices.forEach((optIdx) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.dataset.index = String(optIdx);
    const img = document.createElement('img');
    img.src = qset.images[optIdx];
    img.alt = 'option';
    btn.appendChild(img);
    btn.addEventListener('click', onOptionClick);
    els.options.appendChild(btn);
  });

  els.feedback.textContent = '';
  clearInterval(state.timerId);
}


function onOptionClick(e) {
  const btn = e.currentTarget;
  const chosen = parseInt(btn.dataset.index, 10);
  const isCorrect = (chosen === state.currentAnswer);

  postAnswerToGoogleForm(state.playerName, state.qsetIndex, state.form_q, isCorrect?'Correct':'Wrong');

  if (!isCorrect && !state.attemptMade) {
    btn.classList.add('wrong');
    sfx('wrong');
    state.attemptMade = true;
    els.feedback.textContent = 'Try again.';
    els.feedback.className = 'feedback show wrong';
    setTimeout(() => els.feedback.classList.remove('show'), 800);

    return;
  }

  lockQuestion();
  if (isCorrect) {
    markOption(chosen, true);
    els.feedback.textContent = 'Great!';
    els.feedback.className = 'feedback show correct';
    setTimeout(() => els.feedback.classList.remove('show'), 600);
    awardStickers(1);
    sfx('correct', () => {
      setTimeout(() => nextQuestion(), 600); // 1s after sound
    });
  } else {
    markOption(chosen, false);
    els.feedback.textContent = 'Incorrect.';
    els.feedback.className = 'feedback show wrong';
    setTimeout(() => els.feedback.classList.remove('show'), 900);
    sfx('wrong', () => {
      setTimeout(() => nextQuestion(), 900); // 1s after sound
    });
  }
}


const filledStarSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 
             9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          fill="#facc15" stroke="#eab308" stroke-width="1"/>
  </svg>`;

const hollowStarSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 
             9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          fill="none" stroke="#9ca3af" stroke-width="2"/>
  </svg>`;

function renderStars() {
  els.starCount.innerHTML = state.stars;
}


function lockQuestion(){ clearInterval(state.timerId); Array.from(els.options.querySelectorAll('.option')).forEach(b=>b.disabled=true); }
function markOption(chosen){ const buttons=Array.from(els.options.querySelectorAll('.option')); buttons.forEach(b=>{ const idx=parseInt(b.dataset.index,10); if(idx===state.currentAnswer) b.classList.add('correct'); if(chosen!==null && idx===chosen && idx!==state.currentAnswer) b.classList.add('wrong'); }); }

function nextQuestion(){
  const qset = qsets[state.qsetIndex];
  if (state.questionIndex < state.poolIndices.length - 1) {
    state.questionIndex++;
    resetTimer();
    renderQuestion();
  } else {
    alert("Quiz finished!");
  }

}

function makeQuestionPool(qset) {
  const total = Math.min(qset.images?.length || 0, qset.sounds?.length || 0);
  const all = Array.from({ length: total }, (_, i) => i);
  shuffle(all);
  return all;
}


function awardStickers(count){ 
   state.stars += count;
   renderStars(); 
}
function sfx(name, callback) {
  sfxAudio.onended = null;   // clear previous listeners
  sfxAudio.src = SFX[name];
  sfxAudio.currentTime = 0;
  sfxAudio.play().catch(() => {});
  if (callback) {
    sfxAudio.onended = callback;  // call when sound finishes
  }
}

function initStickerModal() {
  const modal = document.getElementById('stickerModal');
  const choices = document.getElementById('stickerChoices');
  const openBtn = document.getElementById('openStickerModal');
  const closeBtn = document.getElementById('closeStickerModal');
  const deleteBtn = document.getElementById('deleteBtn');
  
  // delete currently selected sticker
  deleteBtn.addEventListener('click', () => {
    if (selectedEl) {
      selectedEl.remove();
      selectedEl = null;
      deleteBtn.disabled = true;
    }
  });

  // Render all stickers once
  choices.innerHTML = COLLECTION_ITEMS.map(
    src => `<img class="sticker-thumb" data-src="${src}" src="${src}" alt="sticker">`
  ).join('');

  // Open
  openBtn.addEventListener('click', () => {     
    if (state.stars <= 0) {
      alert('Earn more stars first!');
      return;
    }
    modal.classList.remove('hidden');
    }
  )

  // Close
  closeBtn.addEventListener('click', () => {
     modal.classList.add('hidden');
  });

  // Select sticker
  choices.addEventListener('click', (e) => {
    const img = e.target.closest('img[data-src]');
    if(!img) return;
    if(state.stars > 0) {
      const rect = els.dropzone.getBoundingClientRect();
      const x = rect.width/2 - 50;
      const y = rect.height/2 - 50;
      placeDraggable(img.dataset.src, x, y);
      state.stars--;
      renderStars();
    }
    modal.classList.add('hidden');
  });
}


function enableDropzone(){
  els.dropzone.addEventListener('dragover', (e)=>e.preventDefault());
  els.dropzone.addEventListener('drop', (e)=>{ e.preventDefault(); if (state.stars <= 0){return;} const src=e.dataTransfer.getData('text/plain'); if(!src) return;
    const rect=els.dropzone.getBoundingClientRect(); const x=e.clientX-rect.left-48; const y=e.clientY-rect.top-48; placeDraggable(src,x,y); 
    if (state.stars > 0) {
      state.stars--;
      renderStars();
    }
    sfx('ding'); });
  els.dropzone.addEventListener('pointerdown', onDragStart); window.addEventListener('pointermove', onDragMove); window.addEventListener('pointerup', onDragEnd);
  els.dropzone.addEventListener('click', () => selectDraggable(null));
}

let dragging=null;
let resizing=null;
let selectedEl=null;

function placeDraggable(src,x,y){
  const el=document.createElement('div');
  el.className='draggable';
  el.style.left=`${x}px`; el.style.top=`${y}px`;
  el.style.width="100px";
  el.style.height="100px";

  const img=document.createElement('img');
  img.src=src;
  img.style.width="100%";
  img.style.height="100%";
  img.style.objectFit="contain";
  el.appendChild(img);

  const handle=document.createElement('div');
  handle.className='resize-handle';
  el.setAttribute('draggable', 'false');   // prevent native HTML5 drag
  el.querySelector('img').setAttribute('draggable', 'false');

  el.appendChild(handle);

  el.addEventListener('click',(e)=>{ e.stopPropagation(); selectDraggable(el); });

  els.dropzone.appendChild(el);
}

function selectDraggable(el){
  if(selectedEl) selectedEl.classList.remove('selected');
  selectedEl=el;
  if(el){
    el.classList.add('selected');
    deleteBtn.disabled = false;
  } else {
    deleteBtn.disabled = true;
  }
}

function onDragStart(e){
  const t=e.target.closest('.draggable');
  if(!t) return;

  if(e.target.classList.contains('resize-handle')){
    resizing={el:t,startX:e.clientX,startY:e.clientY,startW:t.offsetWidth,startH:t.offsetHeight};
    return;
  }

  dragging={el:t,dx:e.clientX-t.offsetLeft,dy:e.clientY-t.offsetTop};
  t.setPointerCapture(e.pointerId);
}

function onDragMove(e){
  if(dragging){
    const {el,dx,dy}=dragging;
    const rect=els.dropzone.getBoundingClientRect();
    let x=e.clientX-dx;
    let y=e.clientY-dy;
    x=Math.max(0,Math.min(x,rect.width-el.offsetWidth));
    y=Math.max(0,Math.min(y,rect.height-el.offsetHeight));
    el.style.left=`${x}px`;
    el.style.top=`${y}px`;
  }
  if(resizing){
    const {el,startX,startY,startW,startH}=resizing;
    let newW=Math.max(40,startW+(e.clientX-startX));
    let newH=Math.max(40,startH+(e.clientY-startY));
    el.style.width=`${newW}px`;
    el.style.height=`${newH}px`;
  }
}

function onDragEnd(e){
  if(dragging){
    dragging.el.releasePointerCapture(e.pointerId);
    dragging=null;
  }
  resizing=null;
}

window.addEventListener('keydown',(e)=>{
  if(e.key==='Delete' && selectedEl){
    selectedEl.remove();
    selectedEl=null;
  }
});

function pauseGame() {
  // stop timer
  clearInterval(state.timerId);
  state.timerId = null;
  state.pauseStart = Date.now();

  // stop question sound
  els.qAudio.pause();
  els.qAudio.currentTime = 0;

  // stop feedback/correct/wrong sound
  sfxAudio.pause();
  sfxAudio.currentTime = 0;
}


function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

async function postAnswerToGoogleForm(studentId, qset, question, result) {
  const formUrl = "https://docs.google.com/forms/u/0/d/e/1FAIpQLScF5b47uNP3PXsPtL6Mmd7s9Yan3ILeeIPdiJuE9ifPcX424A/formResponse";

  const formData = new FormData();
  formData.append("entry.98497247", studentId);
  formData.append("entry.289617934", qset);
  formData.append("entry.711248882", question);
  formData.append("entry.531868725", result);
  try {
    await fetch(formUrl, {
      method: "POST",
      body: formData,
      mode: "no-cors" // Google Forms doesn’t return CORS headers
    });
  } catch (err) {
    console.error("Failed to send answer", err);
  }
}
