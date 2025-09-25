import { levels } from './data.js';

const els = {
  levelSelect: document.getElementById('levelSelect'),
  resetBtn: document.getElementById('resetBtn'),
  toggleBtn : document.getElementById("toggleBtn"),
  bgPrompt : document.getElementById("bgPrompt"),
  bgModal : document.getElementById("bgModal"),

  quizCard: document.getElementById('quizCard'),
  stickerCard: document.getElementById('stickerCard'),

  timer: document.getElementById('timer'),
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
  dropzone: document.getElementById('dropzone'),
  stickerItems: document.getElementById('stickerItems'),
  starBar: document.getElementById('starBar'),
};

const SFX = { correct:'media/sounds/correct.mp3', wrong:'media/sounds/wrong.mp3', ding:'media/sounds/ding.mp3' };
const sfxAudio = new Audio();

const THEMES = ['farm','city','forest','stadium','ocean','space','prehistoric', 'masjid','snowy'];
const THEME_BG = t => `media/backgrounds/${t}.png`;

const COLLECTION_ITEMS = [
  'media/stickers/m01.png','media/stickers/m02.png','media/stickers/m03.png','media/stickers/m04.png',
  'media/stickers/d01.png','media/stickers/d02.png','media/stickers/d03.png','media/stickers/d04.png','media/stickers/d05.png',
  'media/stickers/f01.png','media/stickers/f02.png','media/stickers/f03.png','media/stickers/f04.png','media/stickers/f05.png','media/stickers/f06.png','media/stickers/f07.png','media/stickers/f08.png','media/stickers/f09.png','media/stickers/f10.png','media/stickers/f11.png','media/stickers/f12.png','media/stickers/f13.png','media/stickers/f14.png','media/stickers/f15.png','media/stickers/f16.png','media/stickers/f17.png',
  'media/stickers/s01.png','media/stickers/s02.png','media/stickers/s03.png','media/stickers/s04.png','media/stickers/s05.png','media/stickers/s06.png','media/stickers/s07.png',
  'media/stickers/o01.png','media/stickers/o02.png','media/stickers/o03.png','media/stickers/o04.png','media/stickers/o05.png','media/stickers/o06.png','media/stickers/o07.png','media/stickers/o08.png',
  'media/stickers/p01.png','media/stickers/p02.png','media/stickers/p03.png','media/stickers/p04.png','media/stickers/p05.png','media/stickers/p06.png','media/stickers/p07.png',
  'media/stickers/u01.png','media/stickers/u02.png','media/stickers/u03.png','media/stickers/u04.png','media/stickers/u05.png','media/stickers/u06.png','media/stickers/u07.png',
  'media/stickers/j01.png','media/stickers/j02.png','media/stickers/j03.png','media/stickers/j04.png','media/stickers/j05.png','media/stickers/j06.png','media/stickers/f07.png','media/stickers/j08.png','media/stickers/j09.png','media/stickers/j10.png','media/stickers/j11.png',
];

let state = {
  theme: 'garden',
  levelIndex: 0,
  questionIndex: 0,
  timeLeft: 30,
  timerId: null,
  currentAnswer: null,
  attemptMade: false,
  stars: 0
};

function init() {
  // build modal content
  // build modal content
  els.bgChoices.innerHTML = THEMES
  .map(t => `<button data-theme="${t}"><img src="${THEME_BG(t)}" alt="${t}"></button>`)
  .join('');

  els.bgPrompt.addEventListener('click', () => {
  els.bgModal.classList.remove('hidden');
 });

  els.bgChoices.addEventListener('click', (e) => {
   const btn = e.target.closest('button[data-theme]');
   if (!btn) return;
   state.theme = btn.dataset.theme;
   applyTheme();
   els.bgModal.classList.add('hidden');
   els.bgPrompt.classList.add('hidden'); // hide prompt once background is chosen
 });



  renderCollectionItems();

  els.resetBtn.addEventListener("click", () => {
    els.resetBtn.textContent = "Restart"
    resetAll();
    startLevel();
  });

  els.toggleBtn.addEventListener("click", () => {
    const showingSticker = !els.stickerCard.classList.contains("hidden");
    if (showingSticker) {
      // switch to quiz
      showView("quiz");
      els.toggleBtn.textContent = "Sticker Area";
    } else {
      // switch to sticker
      showView("sticker");
      els.toggleBtn.textContent = "Back to Quiz";
    }
  });
  els.playBtn.addEventListener('click', () => { els.qAudio.currentTime = 0; els.qAudio.play(); });
  enableDropzone();
  renderStars();

}
document.addEventListener('DOMContentLoaded', init);

function applyTheme() {
  els.stickerCanvas.style.backgroundImage = state.theme
    ? `url('${THEME_BG(state.theme)}')`
    : '';
}

function showView(which) {
  const onSticker = which === 'sticker';
  els.stickerCard.classList.toggle('hidden', !onSticker);
  els.quizCard.classList.toggle('hidden', onSticker);

  if (onSticker) {
    // Pause game flow
    clearInterval(state.timerId);
  } else {
    // Resume or restart timer when coming back
    startTimer();
  }
}


function startLevel() {
  const params = new URLSearchParams(window.location.search);
  state.levelIndex = parseInt(params.get("level"), 10);

  state.questionIndex = 0;
  state.stars = 0;
  state.poolIndices = makeQuestionPool(levels[state.levelIndex]);
  renderStars();
  showView('quiz');
  renderQuestion();
  startTimer();
}


function resetAll(){
  clearInterval(state.timerId);
  state.questionIndex=0; state.timeLeft=30;
  state.currentAnswer=null; state.attemptMade=false;
  els.feedback.textContent=''; showView('quiz');
}

function startRound(){
  showView('quiz');
  state.questionIndex=0; state.roundMistakes=0; state.timeLeft=30;
  renderQuestion(); startTimer();
}


function startTimer(){
  clearInterval(state.timerId); state.timeLeft=30; els.timer.textContent=String(state.timeLeft);
  state.timerId=setInterval(()=>{ state.timeLeft--; els.timer.textContent=String(state.timeLeft); if(state.timeLeft<=0){ clearInterval(state.timerId); handleTimeout(); } },1000);
}
function handleTimeout(){
  lockQuestion(); 
  sfx('wrong', () => {
      setTimeout(() => nextQuestion(), 1000); // 1s after sound
  });

  markOption(null); 
  els.feedback.textContent='⏰ Time up!';
  els.feedback.className = 'feedback wrong';
}

function renderQuestion() {
  const level = levels[state.levelIndex];
  const idx = state.poolIndices[state.questionIndex];
  const correctIdx = idx;
  state.currentAnswer = correctIdx;
  state.attemptMade = false;

  const soundSrc = level.sounds[correctIdx];
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
  const hasPromptImg = Array.isArray(level.soundImages) && level.soundImages[correctIdx];
  if (hasPromptImg) {
    els.promptImageWrap.classList.remove('hidden');
    els.promptImage.src = level.soundImages[correctIdx];
  } else {
    els.promptImageWrap.classList.add('hidden');
    els.promptImage.removeAttribute('src');
  }

  // Build options
  const total = Math.min(level.images.length, level.sounds.length);
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
    img.src = level.images[optIdx];
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

  if (!isCorrect && !state.attemptMade) {
    btn.classList.add('wrong');
    sfx('wrong');
    state.attemptMade = true;
    els.feedback.textContent = 'Try again.';
    els.feedback.className = 'feedback wrong';
    return;
  }

  lockQuestion();

  if (isCorrect) {
    markOption(chosen, true);
    els.feedback.textContent = 'Great!';
    els.feedback.className = 'feedback correct';
    awardStickers(1);
    sfx('correct', () => {
      setTimeout(() => nextQuestion(), 1000); // 1s after sound
    });
  } else {
    markOption(chosen, false);
    els.feedback.textContent = 'Incorrect.';
    els.feedback.className = 'feedback wrong';
    sfx('wrong', () => {
      setTimeout(() => nextQuestion(), 1000); // 1s after sound
    });
  }
}


function renderStars() {
  els.starBar.innerHTML = '';
  let count = state.stars
  if (count < 20) {
    count = 20
  }
  for (let i = 0; i < count; i++) {
    const img = document.createElement('img');
    if (i < state.stars) {
      img.src = 'media/stickers/o07.png';  
      img.alt = '*';
    } else {
      img.src = 'media/stickers/c10.png';  
      img.alt = '*';
    }
    els.starBar.appendChild(img);
  }
}


function lockQuestion(){ clearInterval(state.timerId); Array.from(els.options.querySelectorAll('.option')).forEach(b=>b.disabled=true); }
function markOption(chosen){ const buttons=Array.from(els.options.querySelectorAll('.option')); buttons.forEach(b=>{ const idx=parseInt(b.dataset.index,10); if(idx===state.currentAnswer) b.classList.add('correct'); if(chosen!==null && idx===chosen && idx!==state.currentAnswer) b.classList.add('wrong'); }); }

function nextQuestion(){
  const level = levels[state.levelIndex];
  if (state.questionIndex < state.poolIndices.length - 1) {
    state.questionIndex++;
    renderQuestion();
  } else {
    alert("Level finished! You can keep decorating your sticker area.");
    showView('sticker');
  }

}

function makeQuestionPool(level) {
  const total = Math.min(level.images?.length || 0, level.sounds?.length || 0);
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

function renderCollectionItems(){
  els.stickerItems.innerHTML = COLLECTION_ITEMS.map(src=>`<img draggable="true" data-src="${src}" src="${src}" alt="item">`).join('');
  els.stickerItems.addEventListener('dragstart', (e)=>{ const img=e.target.closest('img[data-src]'); if(!img) return; e.dataTransfer.setData('text/plain', img.dataset.src); });
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
  if(el) el.classList.add('selected');
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

function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
