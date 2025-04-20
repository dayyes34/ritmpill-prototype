/*   instrumentStore.js
     хранит единственный массив instruments
     ─ loadInstruments()     → Promise<Array>
     ─ addInstrument(obj)    → Promise<void>
     ─ getInstruments()      → Array (read only)
*/
(function (w) {
    let instruments = [];
  
    /* ----------- API ----------- */
    async function loadInstruments(path = 'data/instruments.json') {
      const res = await fetch(path);
      instruments = await res.json();      // <- один массив «заводских»
      return instruments;
    }
  
    function getInstruments() {
      return instruments;
    }
  
    function generateUniqueId(name) {
      return (
        name.toLowerCase().replace(/\s+/g, '_') +
        '_' +
        Math.random().toString(36).slice(2, 6)
      );
    }
  
    async function addInstrument({ name, limbs, image, audio }) {
      const id = generateUniqueId(name);
      const inst = { id, name, limbs, image, audio };
  
      instruments.push(inst);              // <‑‑ просто дописываем
  
      // если секвенсор уже создал аудио‑контекст – догружаем звук
      if (w.audioCtx && w.audioCache) {
        try {
          const buf = await fetch(audio).then(r => r.arrayBuffer());
          w.audioCache[id] = await w.audioCtx.decodeAudioData(buf);
        } catch (err) {
          console.warn('Не удалось загрузить сэмпл', audio, err);
        }
      }
  
      // перерисуем панель инструментов, если она есть
      if (typeof w.renderInstrumentPanel === 'function') {
        w.renderInstrumentPanel();
      }
    }
  
    /* ----------- экспорт ----------- */
    w.instrumentStore = { loadInstruments, addInstrument, getInstruments };
  })(window);
  