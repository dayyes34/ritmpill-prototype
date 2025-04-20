let limbMuteStatus = [];
let sequencerData  = [];
let currentLoop    = -1;

const limbs = [
  {code:'R',  iconClass:'hand-icon hand-icon-R',  text:'R'},
  {code:'L',  iconClass:'hand-icon hand-icon-L',  text:'L'},
  {code:'RF', iconClass:'hand-icon hand-icon-RF', text:'RF'},
  {code:'LF', iconClass:'hand-icon hand-icon-LF', text:'LF'}
];

function initializeData(numBlocks, stepsPerBlock){
  limbMuteStatus = Array(limbs.length).fill(false);
  sequencerData  = Array.from({length:numBlocks}, () =>
                   Array.from({length:limbs.length}, () =>
                     Array(stepsPerBlock).fill(false)));
}

function toggleLimbMute(r){
  limbMuteStatus[r] = !limbMuteStatus[r];
  document.querySelectorAll(`.row[data-r="${r}"] .hand-icon`)
          .forEach(i => i.classList.toggle('muted', limbMuteStatus[r]));
  document.querySelectorAll(`.row[data-r="${r}"] .cell`)
          .forEach(c => c.classList.toggle('cell-muted', limbMuteStatus[r]));
}

function toggleLoop(b){
  currentLoop = currentLoop === b ? -1 : b;
  document.querySelectorAll('.block').forEach(bl=>{
    bl.style.display = currentLoop === -1 || Number(bl.dataset.b) === currentLoop ? 'inline-block' : 'none';
  });
  document.querySelectorAll('.loop-btn').forEach(btn=>{
    btn.classList.toggle('active', Number(btn.dataset.b) === currentLoop);
  });
}

function generateBlocks(numBlocks, stepsPerBlock){
  const container = document.getElementById('block-row');
  const frag = document.createDocumentFragment();

  for (let b = 0; b < numBlocks; b++){
    const block = document.createElement('div');
    block.className = 'block';
    block.dataset.b = b;
    block.style.display = currentLoop === -1 || currentLoop === b ? 'inline-block' : 'none';

    /* шапка блока */
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
    loopBtn.onclick = () => toggleLoop(b);

    header.appendChild(num);
    header.appendChild(loopBtn);
    block.appendChild(header);

    /* ряды конечностей */
    limbs.forEach((limb, r) => {
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

      for (let s = 0; s < stepsPerBlock; s++){
        const cell = document.createElement('div');
        cell.className = 'cell';
        if (sequencerData[b][r][s]) cell.classList.add('filled');
        if (limbMuteStatus[r])     cell.classList.add('cell-muted');
        cell.onclick = () => {
          if (limbMuteStatus[r]) return;
          sequencerData[b][r][s] = !sequencerData[b][r][s];
          cell.classList.toggle('filled', sequencerData[b][r][s]);
        };
        row.appendChild(cell);
      }
      block.appendChild(row);
    });
    frag.appendChild(block);
  }

  container.innerHTML = '';
  container.appendChild(frag);
}

initializeData(4, 4);
generateBlocks(4, 4);
