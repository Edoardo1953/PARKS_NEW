/**
 * PARKS - Kids Corner Management Module
 * Handles Coloring, Memory Games, Puzzles, and Quizzes.
 */

function switchKidsTab(tab) {
    document.querySelectorAll('.kid-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.getElementById(`tab-kids-${tab}`);
    if(activeTab) activeTab.classList.add('active');

    const zones = ['coloring', 'memory', 'puzzle', 'quiz'];
    zones.forEach(z => {
        const zoneEl = document.getElementById(`kids-${z}-zone`);
        if(zoneEl) zoneEl.style.display = (z === tab) ? 'block' : 'none';
    });

    try {
        if(tab === 'coloring') renderKids();
        if(tab === 'puzzle') renderKidsPuzzles();
        if(tab === 'memory') renderKidsMemory();
        if(tab === 'quiz') renderKidsQuiz();
    } catch(err) {
        console.error("Errore nel render della tab " + tab, err);
    }
    
    if(window.lucide) {
        try { lucide.createIcons(); } catch(e) {}
    }
}

function renderKids() {
    const list = document.getElementById('kids-list');
    if(!list) return;
    if(kidsDrawings.length === 0) {
        list.innerHTML = '<div style="grid-column: 1/-1; padding:3rem; text-align:center; opacity:0.3; font-weight:700;">NESSUN DISEGNO CARICATO</div>';
        return;
    }
    list.innerHTML = kidsDrawings.map((k, i) => `
        <div class="lib-card" style="padding:15px;">
            <div style="background:white; border-radius:10px; height:150px; display:flex; align-items:center; justify-content:center; overflow:hidden; margin-bottom:10px;">
                <img src="${k.image}" style="max-width:100%; max-height:100%;">
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:900; font-size:12px; color:var(--accent);">${k.name.toUpperCase()}</span>
                <div style="display:flex; gap:10px;">
                    <button onclick="openKidEditor(${i})" style="background:none; border:none; color:white; opacity:0.4; cursor:pointer;"><i data-lucide="edit-3" style="width:16px;"></i></button>
                    <button onclick="delKidDrawing(${i})" style="background:none; border:none; color:#ff5252; cursor:pointer;"><i data-lucide="trash-2" style="width:16px;"></i></button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderKidsPuzzles() {
    const list = document.getElementById('puzzles-list');
    if(!list) return;
    if(kidsPuzzles.length === 0) {
        list.innerHTML = '<div style="grid-column: 1/-1; padding:3rem; text-align:center; opacity:0.3; font-weight:700;">NESSUN PUZZLE CARICATO</div>';
        return;
    }
    list.innerHTML = kidsPuzzles.map((k, i) => `
        <div class="lib-card" style="padding:15px;">
            <div style="background:#000; border-radius:10px; height:150px; display:flex; align-items:center; justify-content:center; overflow:hidden; margin-bottom:10px; border:1px solid rgba(255,255,255,0.1);">
                <img src="${k.image}" style="max-width:100%; max-height:100%; object-fit:cover;">
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:900; font-size:12px; color:#4cc9f0;">${k.name.toUpperCase()}</span>
                <div style="display:flex; gap:10px;">
                    <button onclick="openPuzzleEditor(${i})" style="background:none; border:none; color:white; opacity:0.4; cursor:pointer;"><i data-lucide="edit-3" style="width:16px;"></i></button>
                    <button onclick="delKidPuzzle(${i})" style="background:none; border:none; color:#ff5252; cursor:pointer;"><i data-lucide="trash-2" style="width:16px;"></i></button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

let currentDrawingIdx = -1;
let currentPuzzleIdx = -1;
let currentKidEditorMode = 'coloring';

function openKidEditor(idx = -1) {
    currentKidEditorMode = 'coloring';
    currentDrawingIdx = idx;
    document.getElementById('kid-editor-modal').style.display = 'flex';
    document.getElementById('kid-modal-title').innerText = idx === -1 ? "NUOVO DISEGNO" : "MODIFICA DISEGNO";
    document.getElementById('kid-modal-hint').innerText = "CARICA UN'IMMAGINE IN BIANCO E NERO DA FAR COLORARE AI BIMBI";
    resetKidEditor();

    if(idx !== -1) {
        const k = kidsDrawings[idx];
        document.getElementById('kid-name').value = k.name;
        document.getElementById('kid-preview').src = k.image;
        document.getElementById('kid-preview-container').style.display = 'block';
        document.getElementById('kid-upload-placeholder').style.display = 'none';
    }
}

function openPuzzleEditor(idx = -1) {
    currentKidEditorMode = 'puzzle';
    currentPuzzleIdx = idx;
    document.getElementById('kid-editor-modal').style.display = 'flex';
    document.getElementById('kid-modal-title').innerText = idx === -1 ? "NUOVO PUZZLE" : "MODIFICA PUZZLE";
    document.getElementById('kid-modal-hint').innerText = "CARICA UN'IMMAGINE A COLORI CHE VERRÀ SCOMPOSTA IN 3x3 E 4x4";
    resetKidEditor();

    if(idx !== -1) {
        const k = kidsPuzzles[idx];
        document.getElementById('kid-name').value = k.name;
        document.getElementById('kid-preview').src = k.image;
        document.getElementById('kid-preview-container').style.display = 'block';
        document.getElementById('kid-upload-placeholder').style.display = 'none';
    }
}

let pendingKidFile = null;
function resetKidEditor() {
    document.getElementById('kid-name').value = '';
    document.getElementById('kid-file').value = '';
    document.getElementById('kid-preview-container').style.display = 'none';
    document.getElementById('kid-upload-placeholder').style.display = 'block';
    pendingKidFile = null;
}

function closeKidEditor() {
    document.getElementById('kid-editor-modal').style.display = 'none';
}

function previewKidImage(event) {
    const file = event.target.files[0];
    if(!file) return;
    pendingKidFile = file;
    document.getElementById('kid-preview').src = URL.createObjectURL(file);
    document.getElementById('kid-preview-container').style.display = 'block';
    document.getElementById('kid-upload-placeholder').style.display = 'none';
}

async function saveKidDrawing() {
    const name = document.getElementById('kid-name').value;
    if(!name || (!pendingKidFile && !document.getElementById('kid-preview').src)) {
        alert("Inserisci nome e carica immagine!");
        return;
    }

    const saveBtn = document.querySelector('#kid-editor-modal .btn-save');
    saveBtn.innerHTML = '<i class="spinner-small"></i> SALVATAGGIO...';
    saveBtn.disabled = true;

    try {
        let imgUrl = document.getElementById('kid-preview').src;
        if(pendingKidFile) {
            imgUrl = await window.PARKS_DB.uploadFile(pendingKidFile);
        }

        if(currentKidEditorMode === 'coloring') {
            if(currentDrawingIdx === -1) {
                kidsDrawings.push({ id: Date.now(), name, image: imgUrl });
            } else {
                kidsDrawings[currentDrawingIdx].name = name;
                kidsDrawings[currentDrawingIdx].image = imgUrl;
            }
            window.PARKS_DB.save('parks_kids_drawings', kidsDrawings, function() {
                closeKidEditor();
                renderKids();
            });
        } else if(currentKidEditorMode === 'memory') {
            const game = memoryGames[currentGameIdx];
            if(!game) throw new Error("Gioco non trovato");
            if(!game.cards) game.cards = [];
            
            if(currentMemoryIdx === -1) {
                game.cards.push({ id: Date.now(), name, image: imgUrl });
            } else {
                game.cards[currentMemoryIdx].name = name;
                game.cards[currentMemoryIdx].image = imgUrl;
            }
            window.PARKS_DB.save('parks_kids_memory_v2', memoryGames, function() {
                closeKidEditor();
                renderKidsMemory();
            });
        } else if(currentKidEditorMode === 'puzzle') {
            if(currentPuzzleIdx === -1) {
                kidsPuzzles.push({ id: Date.now(), name, image: imgUrl });
            } else {
                kidsPuzzles[currentPuzzleIdx].name = name;
                kidsPuzzles[currentPuzzleIdx].image = imgUrl;
            }
            window.PARKS_DB.save('parks_kids_puzzles', kidsPuzzles, function() {
                closeKidEditor();
                renderKidsPuzzles();
            });
        }
    } catch(e) {
        alert("Errore salvataggio: " + e);
    } finally {
        saveBtn.innerHTML = 'SALVA NEL DATABASE';
        saveBtn.disabled = false;
    }
}

let currentGameIdx = -1;
let currentMemoryIdx = -1;

function addMemoryGame() {
    const emojis = ['🦁', '🦒', '🐘', '🦓', '🐆', '🐊', '🦏', '🦛', '🐗', '🐢', '🦎', '🐍', '🐒', '🦋', '🐝', '🐜', '🕷', '🦂', '🌵', '🌴', '🏜️', '🐾', '🎲', '🌍'];
    const picker = document.getElementById('emoji-picker');
    if(picker) {
        picker.innerHTML = emojis.map(e => `
            <div onclick="selectEmoji(this, '${e}')" class="emoji-opt" style="font-size:1.5rem; cursor:pointer; padding:8px; border-radius:10px; text-align:center; transition:0.2s;">${e}</div>
        `).join('');
    }
    
    document.getElementById('new-game-name').value = "";
    document.getElementById('new-game-icon').value = "🎲";
    document.getElementById('new-game-modal').style.display = 'flex';
    if(window.lucide) lucide.createIcons();
}

function selectEmoji(el, e) {
    document.querySelectorAll('.emoji-opt').forEach(opt => {
        opt.style.background = 'transparent';
        opt.style.transform = 'scale(1)';
    });
    el.style.background = 'rgba(255,171,64,0.2)';
    el.style.transform = 'scale(1.2)';
    document.getElementById('new-game-icon').value = e;
}

function confirmAddGame() {
    try {
        const nameInput = document.getElementById('new-game-name');
        const iconInput = document.getElementById('new-game-icon');
        if(!nameInput || !iconInput) throw new Error("Elementi del modal non trovati!");
        const name = nameInput.value.trim();
        const icon = iconInput.value;
        if(!name) { alert("Inserisci un NOME!"); return; }
        if(!Array.isArray(memoryGames)) memoryGames = [];
        const newGame = { id: Date.now(), name: name.toUpperCase(), icon: icon || "🎲", cards: [] };
        memoryGames.push(newGame);
        document.getElementById('new-game-modal').style.display = 'none';
        window.PARKS_DB.save('parks_kids_memory_v2', memoryGames, function() {
            alert("Gioco creato!");
            renderKidsMemory();
        });
    } catch(err) { alert(err.message); }
}

function delMemoryGame(idx) {
    if(confirm("Eliminare il gioco?")) {
        memoryGames.splice(idx, 1);
        window.PARKS_DB.save('parks_kids_memory_v2', memoryGames, renderKidsMemory);
    }
}

function renderKidsMemory() {
    try {
        const container = document.getElementById('memory-games-list');
        if(!container) return;
        if(!Array.isArray(memoryGames) || memoryGames.length === 0) {
            container.innerHTML = '<div style="padding:4rem; text-align:center; opacity:0.3; font-weight:700;">NESSUN GIOCO CREATO.</div>';
            return;
        }
        container.innerHTML = memoryGames.map((game, gIdx) => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:25px; padding:25px; margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="font-size:2rem;">${game.icon || '🎲'}</div>
                        <div>
                            <div style="font-weight:900; color:var(--accent);">${game.name}</div>
                            <div style="font-size:10px; opacity:0.4;">${(game.cards || []).length} TESSERE</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="openMemoryEditor(${gIdx}, -1)" class="btn-editor btn-save" style="padding:10px 20px; font-size:11px;">
                            <i data-lucide="plus-circle"></i> AGGIUNGI TESSERA
                        </button>
                        <button onclick="delMemoryGame(${gIdx})" style="background:rgba(255,82,82,0.1); border:none; color:#ff5252; padding:10px; border-radius:12px; cursor:pointer;"><i data-lucide="trash-2" style="width:18px;"></i></button>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap:15px;">
                    ${(game.cards || []).map((card, cIdx) => `
                        <div class="lib-card" style="padding:8px; background:rgba(0,0,0,0.2);">
                            <div style="background:#fff; border-radius:8px; height:70px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                                <img src="${card.image}" style="max-width:100%; max-height:100%; object-fit:contain;">
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                                <span style="font-weight:900; font-size:8px; color:var(--accent); overflow:hidden; text-overflow:ellipsis;">${(card.name || '').toUpperCase()}</span>
                                <div style="display:flex; gap:3px;">
                                    <button onclick="openMemoryEditor(${gIdx}, ${cIdx})" style="background:none; border:none; color:white; opacity:0.4;"><i data-lucide="edit-3" style="width:10px;"></i></button>
                                    <button onclick="delKidMemory(${gIdx}, ${cIdx})" style="background:none; border:none; color:#ff5252;"><i data-lucide="trash-2" style="width:10px;"></i></button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        if(window.lucide) lucide.createIcons();
    } catch(e) { console.error(e); }
}

function openMemoryEditor(gIdx, cIdx = -1) {
    currentKidEditorMode = 'memory';
    currentGameIdx = gIdx;
    currentMemoryIdx = cIdx;
    document.getElementById('kid-editor-modal').style.display = 'flex';
    document.getElementById('kid-modal-title').innerText = cIdx === -1 ? "NUOVA TESSERA MEMORY" : "MODIFICA TESSERA";
    document.getElementById('kid-modal-hint').innerText = "GIOCO: " + memoryGames[gIdx].name;
    resetKidEditor();
    if(cIdx !== -1) {
        const k = memoryGames[gIdx].cards[cIdx];
        document.getElementById('kid-name').value = k.name;
        document.getElementById('kid-preview').src = k.image;
        document.getElementById('kid-preview-container').style.display = 'block';
        document.getElementById('kid-upload-placeholder').style.display = 'none';
    }
}

function delKidMemory(gIdx, cIdx) {
    if(confirm("Eliminare la tessera?")) {
        memoryGames[gIdx].cards.splice(cIdx, 1);
        window.PARKS_DB.save('parks_kids_memory_v2', memoryGames, renderKidsMemory);
    }
}

function renderKidsQuiz() {
    renderQuizList();
    renderLevelIcons();
}

function renderLevelIcons() {
    const container = document.getElementById('quiz-level-icons');
    if(!container) return;
    window.PARKS_DB.get('parks_kids_quiz_level_images', {}, function(data) {
        let html = '';
        for(let i=1; i<=5; i++) {
            const img = data[i] || '../assets/kids/memory_meerkat.png';
            html += `
                <div style="text-align:center;">
                    <div style="font-size:9px; opacity:0.5; margin-bottom:5px;">LIVELLO ${i}</div>
                    <div onclick="changeLevelIcon(${i})" style="width:100%; aspect-ratio:1/1; background:#000; border-radius:15px; border:1px solid rgba(255,255,255,0.1); cursor:pointer; overflow:hidden; position:relative;">
                        <img src="${img}" style="width:100%; height:100%; object-fit:contain;">
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    });
}

function changeLevelIcon(lv) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if(!file) return;
        try {
            const cloudUrl = await window.PARKS_DB.uploadFile(file);
            window.PARKS_DB.get('parks_kids_quiz_level_images', {}, function(data) {
                if(!data || typeof data !== 'object') data = {};
                data[lv] = cloudUrl;
                window.PARKS_DB.save('parks_kids_quiz_level_images', data, function() {
                    renderLevelIcons();
                    renderQuizList(); 
                });
            });
        } catch(err) { alert(err); }
    };
    input.click();
}

function renderQuizList() {
    const list = document.getElementById('quiz-list');
    if(!list) return;
    if(!kidsQuiz || kidsQuiz.length === 0) {
        list.innerHTML = '<div style="padding:3rem; text-align:center; opacity:0.3;">NESSUNA DOMANDA.</div>';
        return;
    }
    const grouped = {};
    for(let i=1; i<=5; i++) grouped[i] = kidsQuiz.filter(q => (q.level || 1) == i);

    const renderHtml = (levelImages = {}) => {
        let html = '';
        for(let level=1; level<=5; level++) {
            if(!grouped[level] || grouped[level].length === 0) continue;
            const levelImg = levelImages[level] || '../assets/kids/memory_meerkat.png';
            html += `
                <div style="margin-top:20px; display:flex; align-items:center; gap:10px;">
                    <img src="${levelImg}" style="width:25px; height:25px; object-fit:contain;">
                    <span style="font-weight:900; font-size:12px; color:var(--accent);">LIVELLO ${level}</span>
                </div>
            `;
            html += grouped[level].map((q) => {
                const oIdx = kidsQuiz.indexOf(q);
                return `
                    <div class="row-item" style="padding:15px; margin-bottom:10px; background:rgba(255,255,255,0.02); border-radius:10px;">
                        <div style="flex:1;">
                            <div style="font-weight:900; font-size:12px;">${q.question}</div>
                            <div style="font-size:10px; opacity:0.6;">Risposta corretta: ${q.options[q.correct]}</div>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button onclick="openQuizEditor(${oIdx})" style="background:none; border:none; color:white; opacity:0.4;"><i data-lucide="edit-3" style="width:16px;"></i></button>
                            <button onclick="delKidQuiz(${oIdx})" style="background:none; border:none; color:#ff5252;"><i data-lucide="trash-2" style="width:16px;"></i></button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        list.innerHTML = html;
        if(window.lucide) lucide.createIcons();
    };
    renderHtml();
    window.PARKS_DB.get('parks_kids_quiz_level_images', {}, renderHtml);
}

let currentQuizIdx = -1;
function openQuizEditor(idx = -1) {
    currentQuizIdx = idx;
    document.getElementById('quiz-editor-modal').style.display = 'flex';
    resetQuizEditor();
    if(idx !== -1) {
        const q = kidsQuiz[idx];
        document.getElementById('quiz-q').value = q.question;
        document.getElementById('quiz-o0').value = q.options[0];
        document.getElementById('quiz-o1').value = q.options[1];
        document.getElementById('quiz-o2').value = q.options[2];
        document.getElementById('quiz-o3').value = q.options[3];
        document.getElementById('quiz-level').value = q.level || 1;
        document.querySelector(`input[name="quiz-correct"][value="${q.correct}"]`).checked = true;
        if(q.image) {
            document.getElementById('quiz-preview').src = q.image;
            document.getElementById('quiz-preview-container').style.display = 'block';
            document.getElementById('quiz-upload-placeholder').style.display = 'none';
        }
    }
}

function closeQuizEditor() {
    document.getElementById('quiz-editor-modal').style.display = 'none';
}

let pendingQuizFile = null;
function resetQuizEditor() {
    document.getElementById('quiz-q').value = '';
    document.getElementById('quiz-o0').value = '';
    document.getElementById('quiz-o1').value = '';
    document.getElementById('quiz-o2').value = '';
    document.getElementById('quiz-o3').value = '';
    document.getElementById('quiz-level').value = '1';
    document.querySelectorAll('input[name="quiz-correct"]').forEach(r => r.checked = false);
    document.getElementById('quiz-preview').src = '';
    document.getElementById('quiz-preview-container').style.display = 'none';
    document.getElementById('quiz-upload-placeholder').style.display = 'block';
    pendingQuizFile = null;
}

function previewQuizImage(event) {
    const file = event.target.files[0];
    if(!file) return;
    pendingQuizFile = file;
    document.getElementById('quiz-preview').src = URL.createObjectURL(file);
    document.getElementById('quiz-preview-container').style.display = 'block';
    document.getElementById('quiz-upload-placeholder').style.display = 'none';
}

async function saveKidQuiz() {
    const q = document.getElementById('quiz-q').value;
    const level = document.getElementById('quiz-level').value;
    const correctRadio = document.querySelector('input[name="quiz-correct"]:checked');
    if(!q || !correctRadio) { alert("Completa i campi!"); return; }

    try {
        let imgUrl = document.getElementById('quiz-preview').src;
        if(pendingQuizFile) imgUrl = await window.PARKS_DB.uploadFile(pendingQuizFile);

        const newQ = {
            id: Date.now(),
            question: q,
            options: [document.getElementById('quiz-o0').value, document.getElementById('quiz-o1').value, document.getElementById('quiz-o2').value, document.getElementById('quiz-o3').value],
            correct: parseInt(correctRadio.value),
            level: parseInt(level),
            image: imgUrl
        };

        if(currentQuizIdx === -1) kidsQuiz.push(newQ);
        else kidsQuiz[currentQuizIdx] = { ...newQ, id: kidsQuiz[currentQuizIdx].id };

        window.PARKS_DB.save('parks_kids_quiz', kidsQuiz, function() {
            closeQuizEditor();
            renderKidsQuiz();
        });
    } catch(e) { alert(e); }
}

function delKidQuiz(idx) {
    if(confirm("Eliminare?")) {
        kidsQuiz.splice(idx, 1);
        window.PARKS_DB.save('parks_kids_quiz', kidsQuiz, renderKidsQuiz);
    }
}

function seedQuizQuestions() {
    if(kidsQuiz && kidsQuiz.length > 0) {
        if(!confirm("Aggiungere le domande predefinite?")) return;
    }
    const defaultQuestions = [
        { question: "Qual è il 'Re della Savana'?", options: ["Elefante", "Leone", "Zebra", "Giraffa"], correct: 1, level: 1 },
        { question: "Quale animale ha il collo lunghissimo?", options: ["Ippopotamo", "Giraffa", "Gazzella", "Rinoceronte"], correct: 1, level: 1 },
        { question: "Chi ha la pelle a strisce bianche e nere?", options: ["Leone", "Zebra", "Tigre", "Ghepardo"], correct: 1, level: 1 },
        { question: "Qual è l'animale terrestre più grande?", options: ["Rinoceronte", "Elefante", "Ippopotamo", "Giraffa"], correct: 1, level: 1 },
        { question: "Quale di questi animali vive molto tempo in acqua?", options: ["Leone", "Ippopotamo", "Zebra", "Giraffa"], correct: 1, level: 1 }
    ];
    kidsQuiz = [...(kidsQuiz||[]), ...defaultQuestions.map(q => ({...q, id: Date.now() + Math.random()}))];
    window.PARKS_DB.save('parks_kids_quiz', kidsQuiz, function() {
        alert("Caricate nuove domande!");
        renderKidsQuiz();
    });
}

function delKidDrawing(idx) {
    if(confirm("Eliminare?")) {
        kidsDrawings.splice(idx, 1);
        window.PARKS_DB.save('parks_kids_drawings', kidsDrawings, renderKids);
    }
}

function delKidPuzzle(idx) {
    if(confirm("Eliminare?")) {
        kidsPuzzles.splice(idx, 1);
        window.PARKS_DB.save('parks_kids_puzzles', kidsPuzzles, renderKidsPuzzles);
    }
}
