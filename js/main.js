// === НАСТРОЙКИ ===
const SHOW_EMPTY_LIMB_ROWS = false;

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ===
let limbMuteStatus;
let sequencerData;
let currentLoop = -1;
let selectedInstrumentId = null;
let numBlocks = 4;
const stepsPerBlock = 4;     // ВСЕГДА 4!
let noteLength = 4;

// === КОНЕЧНОСТИ ===
const limbs = [
  { code: "R",  iconClass: "hand-icon hand-icon-r",  text: "R" },
  { code: "L",  iconClass: "hand-icon hand-icon-l",  text: "L" },
  { code: "RF", iconClass: "hand-icon hand-icon-rf", text: "RF" },
  { code: "LF", iconClass: "hand-icon hand-icon-lf", text: "LF" }
];

// === ИНСТРУМЕНТЫ ===
let instruments = [
  { id: 1, name: "Kick",    limbs: ["RF", "LF"], imageUrl: "./assets/img/kick.png",   audioUrl: "assets/sounds/kick.mp3" },
  { id: 2, name: "Snare",   limbs: ["R", "L"],   imageUrl: "assets/img/snare.png",  audioUrl: "assets/sounds/snare.mp3" },
  { id: 3, name: "HiHat",   limbs: ["L", "R"],   imageUrl: "assets/img/hihat.png",  audioUrl: "assets/sounds/hhcl.mp3" },
  { id: 4, name: "HHopen",  limbs: ["L", "R"],   imageUrl: "assets/img/hhop.png",   audioUrl: "assets/sounds/hhop.mp3" },
  { id: 5, name: "Ride",    limbs: ["L", "R"],   imageUrl: "assets/img/ride.png",   audioUrl: "assets/sounds/ride.mp3" },
  { id: 6, name: "Tom1",    limbs: ["L", "R"],   imageUrl: "assets/img/tom1.png",   audioUrl: "assets/sounds/tom1.mp3" },
  { id: 7, name: "Tom2",    limbs: ["L", "R"],   imageUrl: "assets/img/tom2.png",   audioUrl: "assets/sounds/tom2.mp3" },
  { id: 8, name: "Tom3",    limbs: ["L", "R"],   imageUrl: "assets/img/tom3.png",   audioUrl: "assets/sounds/tom3.mp3" },
  { id: 9, name: "Crash1",  limbs: ["L", "R"],   imageUrl: "assets/img/crash1.png", audioUrl: "assets/sounds/crash1.mp3" },
  { id: 10, name: "Crash2", limbs: ["L", "R"],   imageUrl: "assets/img/crash2.png", audioUrl: "assets/sounds/crash2.mp3" }
];

// === ИНИЦИАЛИЗАЦИЯ ДАННЫХ ===
function initializeData(newNumBlocks) {
  limbMuteStatus = Array(limbs.length).fill(false);
  sequencerData = Array.from({length: newNumBlocks}, () =>
    Array.from({length: limbs.length}, () => Array(stepsPerBlock).fill(null))
  );
}

function resizeSequencerData(newNumBlocks) {
  let old = sequencerData || [];
  let newData = Array.from({length: newNumBlocks}, (_, b) =>
    Array.from({length: limbs.length}, (_, r) =>
      Array(stepsPerBlock).fill(null)
    )
  );
  const minBlocks = Math.min(old.length, newNumBlocks);
  for (let b = 0; b < minBlocks; b++) {
    for (let r = 0; r < limbs.length; r++) {
      for (let s = 0; s < stepsPerBlock; s++) {
        if (
          old[b] && old[b][r] && typeof old[b][r][s] !== "undefined"
        ) {
          newData[b][r][s] = old[b][r][s];
        }
      }
    }
  }
  sequencerData = newData;
}

// === КОНТРОЛЫ ===
window.addEventListener("DOMContentLoaded", () => {
  const controls = document.getElementById('controls');
  controls.innerHTML = `
    <label>Размер упражнения:
      <select id="time-signature">
        <option value="1">1/4</option>
        <option value="2">2/4</option>
        <option value="3">3/4</option>
        <option value="4" selected>4/4</option>
        <option value="5">5/4</option>
      </select>
    </label>
    <label style="margin-left:24px">
      Длительность клетки:
      <select id="note-length">
        <option value="4">1/4</option>
        <option value="8">1/8</option>
        <option value="16">1/16</option>
      </select>
    </label>
  `;
  document.getElementById('time-signature').value = numBlocks;
  document.getElementById('note-length').value = noteLength;

  document.getElementById('time-signature').onchange = function() {
    const newNumBlocks = Number(this.value);
    resizeSequencerData(newNumBlocks);
    numBlocks = newNumBlocks;
    generateBlocksUI();
  };

  document.getElementById('note-length').onchange = function() {
    noteLength = Number(this.value); // только меняем переменную, stepsPerBlock = 4 ВСЕГДА
    generateBlocksUI();
  };
});

// === Инструментальная панель ===
// исправлено: нет кнопки добавления, нет формы!
function renderInstrumentPanel() {
  const panel = document.getElementById('instrument-panel');
  panel.innerHTML = '';
  instruments.forEach(inst => {
    const btn = document.createElement('div');
    btn.className = 'instrument-btn' + (selectedInstrumentId === inst.id ? ' active' : '');
    btn.title = inst.name;
    btn.onclick = () => {
      selectedInstrumentId = (selectedInstrumentId === inst.id ? null : inst.id);
      renderInstrumentPanel();
    };
    const img = document.createElement('img');
    img.className = 'instrument-icon-large';
    img.src = inst.imageUrl || 'https://img.icons8.com/ios-glyphs/60/drum.png';
    img.alt = inst.name;
    btn.appendChild(img);
    panel.appendChild(btn);
  });
}

// === Ограничения на постановку инструмента на конечность ===
function isInstrumentAllowedForLimb(instrument, limbCode) {
  if (!instrument.limbs.includes(limbCode)) return false;
  if ((limbCode === "R" || limbCode === "L") &&
      (instrument.name.toLowerCase().includes("kick") ||
       instrument.name.toLowerCase().includes("left foot"))) {
    return false;
  }
  if ((limbCode === "RF" || limbCode === "LF") && !instrument.limbs.includes(limbCode)) {
    return false;
  }
  return true;
}

// === ГЕНЕРАЦИЯ БЛОКОВ ===
function generateBlocksUI() {
  const container = document.getElementById('block-row');
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  const numBlocksLocal = sequencerData.length;

  for (let b = 0; b < numBlocksLocal; b++) {
    const block = document.createElement('div');
    block.className = 'block';
    block.dataset.b = b;
    block.style.display = (currentLoop === -1 || currentLoop === b) ? 'inline-block' : 'none';

    // Шапка блока
    const header = document.createElement('div');
    header.className = 'block-header';

    const num = document.createElement('span');
    num.className = 'block-number';
    num.textContent = b + 1;

    const loopBtn = document.createElement('span');
    loopBtn.className = 'loop-btn';
    loopBtn.textContent = 'LOOP';
    loopBtn.dataset.b = b;
    if (currentLoop === b) loopBtn.classList.add('active');
    loopBtn.onclick = () => { toggleLoop(b); };

    header.appendChild(num);
    header.appendChild(loopBtn);
    block.appendChild(header);

    const rowsToShow = SHOW_EMPTY_LIMB_ROWS
      ? limbs
      : limbs.filter(limb =>
          instruments.some(inst => isInstrumentAllowedForLimb(inst, limb.code))
        );

    rowsToShow.forEach((limb, rIndex) => {
      const r = limbs.findIndex(l => l.code === limb.code);
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.r = r;
      row.dataset.limb = limb.code;

      const icon = document.createElement('div');
      icon.className = limb.iconClass;
      icon.textContent = limb.text;
      if (limbMuteStatus[r]) icon.classList.add('muted');
      icon.onclick = () => toggleLimbMute(r);
      row.appendChild(icon);

      for (let s = 0; s < stepsPerBlock; s++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        const instrumentId = sequencerData[b][r][s];
        if (limbMuteStatus[r]) cell.classList.add('cell-muted');
        if (instrumentId) {
          cell.classList.add('filled');
          let inst = instruments.find(ii => ii.id === instrumentId);
          if (inst) {
            const img = document.createElement('img');
            img.className = 'instrument-icon-small';
            img.src = inst.imageUrl || 'https://img.icons8.com/ios-glyphs/30/drum.png';
            img.title = inst.name;
            cell.appendChild(img);
          }
        }
        cell.onclick = () => {
          if (limbMuteStatus[r]) return;
          if (!selectedInstrumentId) return;
          let currentInstrumentId = sequencerData[b][r][s];
          if (currentInstrumentId === selectedInstrumentId) {
            sequencerData[b][r][s] = null;
          } else {
            const instrument = instruments.find(i => i.id === selectedInstrumentId);
            if (!isInstrumentAllowedForLimb(instrument, limb.code)) {
              cell.classList.add('shake');
              setTimeout(() => cell.classList.remove('shake'), 400);
              return;
            }
            sequencerData[b][r][s] = selectedInstrumentId;
          }
          generateBlocksUI();
        };
        row.appendChild(cell);
      }
      block.appendChild(row);
    });

    frag.appendChild(block);
  }
  container.appendChild(frag);
}

// === LOOP переключатель ===
function toggleLoop(b) {
  currentLoop = (currentLoop === b ? -1 : b);
  generateBlocksUI();
  document.querySelectorAll('.loop-btn')
    .forEach(btn => btn.classList.toggle('active', Number(btn.dataset.b) === currentLoop));
}

// === MUTE конечности ===
function toggleLimbMute(r) {
  limbMuteStatus[r] = !limbMuteStatus[r];
  document.querySelectorAll(`.row[data-r="${r}"] .hand-icon`)
    .forEach(i => i.classList.toggle('muted', limbMuteStatus[r]));
  document.querySelectorAll(`.row[data-r="${r}"] .cell`)
    .forEach(c => c.classList.toggle('cell-muted', limbMuteStatus[r]));
}

// === СТАРТ ===
initializeData(numBlocks);

window.onload = function() {
  renderInstrumentPanel();
  generateBlocksUI();
};
