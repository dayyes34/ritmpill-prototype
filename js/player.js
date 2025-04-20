// player.js

// --- Web Audio API ---
let audioContext = null;
const INSTRUMENT_BUFFERS = {};

async function loadInstruments() {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const files = {
        kick: 'assets/sounds/kick.mp3',
        snare: 'assets/sounds/snare.mp3',
        hihat: 'assets/sounds/hihat.mp3',
        clap: 'assets/sounds/clap.wav'
    };

    // Загружает каждый звук и декодирует его
    for (let [name, url] of Object.entries(files)) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        INSTRUMENT_BUFFERS[name] = await audioContext.decodeAudioData(arrayBuffer);
    }
}

function playSound(instrument) {
    if (!audioContext || !INSTRUMENT_BUFFERS[instrument]) return;
    const source = audioContext.createBufferSource();
    source.buffer = INSTRUMENT_BUFFERS[instrument];
    source.connect(audioContext.destination);
    source.start(0);
}

// --- UI logic ---
document.addEventListener('DOMContentLoaded', () => {
    // После первого user-клика стартуем звук
    let isInstrumentsLoaded = false;
    function ensureAudio() {
        if (!isInstrumentsLoaded) {
            loadInstruments().then(() => { isInstrumentsLoaded = true; });
        }
    }

    // По умолчанию выбранный инструмент
    let selectedInstrument = 'kick';

    // Обработка клика по кнопкам инструментов
    document.querySelectorAll('.instrument-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            ensureAudio();

            // Снимаем активное выделение со всех кнопок
            document.querySelectorAll('.instrument-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedInstrument = btn.getAttribute('data-instrument');
        });
    });

    // Обработка клика по ячейкам
    document.querySelectorAll('.cell').forEach(cell => {
        cell.addEventListener('click', () => {
            ensureAudio();

            // Если выбран режим стирания или клик по ячейке с тем же инструментом – очищаем ячейку
            if (selectedInstrument === 'erase' ||
                (cell.classList.contains('filled') && cell.getAttribute('data-instrument') === selectedInstrument)) {
                cell.classList.remove('filled');
                cell.removeAttribute('data-instrument');
                cell.innerHTML = '';
                return;
            }

            // В противном случае заполняем ячейку выбранным инструментом
            cell.classList.add('filled');
            cell.setAttribute('data-instrument', selectedInstrument);
            cell.innerHTML = `<img src="assets/instruments/${selectedInstrument}.png" alt="${selectedInstrument}" style="width:22px" />`;
        });
    });

});

// --- SYNC: функция воспроизведения шага ---
function playStep(step) {
    const blockIndex = Math.floor(step / 4);
    const stepInBlock = step % 4;
    const blocks = document.querySelectorAll('.block');
    if (blockIndex >= blocks.length) return;
    const activeBlock = blocks[blockIndex];
    const rows = activeBlock.querySelectorAll('.row');
    rows.forEach(row => {
        const cells = row.querySelectorAll('.cell');
        if (cells.length > stepInBlock) {
            const cell = cells[stepInBlock];
            // Если в ячейке указан инструмент – воспроизводим его звук
            const instrument = cell.getAttribute('data-instrument');
            if (instrument && INSTRUMENT_BUFFERS[instrument]) {
                playSound(instrument);
            }
            // Добавляем визуальный эффект (активная ячейка)
            cell.classList.add('active');
            setTimeout(() => cell.classList.remove('active'), 120);
        }
    });
}

/* Пример интервала воспроизведения (раскомментируйте при необходимости)
let currentStep = 0;
const totalSteps = 16;
const interval_in_ms = 200;

setInterval(() => {
    playStep(currentStep);
    currentStep = (currentStep + 1) % totalSteps;
}, interval_in_ms);
*/
