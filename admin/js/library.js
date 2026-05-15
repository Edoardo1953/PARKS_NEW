/**
 * PARKS - Library & Visit Namibia Management Module
 */

function renderLib() {
    var data = (curSection === 'visit') ? visitNamibia : library;
    var containerId = (curSection === 'visit') ? 'visit-container' : 'lib-container';
    var container = document.getElementById(containerId);
    if(!container) return;
    if(!data.categories || data.categories.length === 0) {
        container.innerHTML = `<div style="opacity:0.3; text-align:center; padding:5rem;">${curSection === 'visit' ? 'Sezione Visit Namibia vuota.' : 'Libreria vuota.'} Inizia a popolare l'archivio.</div>`;
        return;
    }

    container.innerHTML = (data.categories || []).map((cat, cIdx) => `
        <div class="row-cat" draggable="true" 
             ondragstart="handleLibDragStart(event, {type:'cat', cIdx:${cIdx}})" 
             ondragover="handleLibDragOver(event)" 
             ondrop="handleLibDrop(event, {type:'cat', cIdx:${cIdx}})" 
             style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:1.5rem; transition:0.3s; position:relative;">
            
            <div style="display:flex; align-items:center; gap:20px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:15px; margin-bottom:15px;">
                <i data-lucide="grip-vertical" style="width:20px; opacity:0.4; cursor:grab;"></i>
                <div style="position:relative; width:65px; height:65px; border-radius:12px; overflow:hidden; background:rgba(0,0,0,0.5); border:1px solid var(--accent); cursor:pointer;">
                    <img src="${cat.image || 'https://images.unsplash.com/photo-1543946207-39bd91e70ca7?q=20&w=150'}" style="width:100%; height:100%; object-fit:cover;">
                    <input type="file" style="position:absolute; inset:0; opacity:0; cursor:pointer;" onchange="uploadThumb('cat', '${cat.id}', event)">
                </div>
                <div style="flex:1;">
                    <input type="text" value="${cat.name}" onchange="renameCat('${cat.id}', this.value)" 
                           style="background:none; border:none; color:var(--accent); font-weight:900; font-size:1.6rem; outline:none; letter-spacing:3px; width:100%;">
                </div>
                <button onclick="addSub('${cat.id}')" style="background:none; border:2px solid var(--primary-green); color:white; padding:10px 20px; border-radius:10px; cursor:pointer; font-weight:900; font-size:11px;">+ NUOVA SOTTO-CAT</button>
                <button onclick="delCat('${cat.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer; opacity:0.4;"><i data-lucide="trash-2" style="width:18px;"></i></button>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px; padding-left:40px;">
                ${(cat.subcategories || []).map((sub, sIdx) => `
                    <div draggable="true" 
                         ondragstart="handleLibDragStart(event, {type:'sub', cIdx:${cIdx}, sIdx:${sIdx}})" 
                         ondragover="handleLibDragOver(event)" 
                         ondrop="handleLibDrop(event, {type:'sub', cIdx:${cIdx}, sIdx:${sIdx}})"
                         style="background:rgba(255,255,255,0.04); padding:1rem; border-radius:15px; border:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:12px;">
                        
                        <div style="display:flex; align-items:center; gap:15px;">
                            <i data-lucide="more-vertical" style="width:14px; opacity:0.3; cursor:grab;"></i>
                            <div style="position:relative; width:45px; height:45px; border-radius:8px; overflow:hidden; background:#111; border:1px solid rgba(255,255,255,0.2);">
                                <img src="${sub.image || 'https://images.unsplash.com/photo-1543326168-54cc8939c36c?q=20&w=150'}" style="width:100%; height:100%; object-fit:cover;">
                                <input type="file" style="position:absolute; inset:0; opacity:0; cursor:pointer;" onchange="uploadThumb('sub', '${cat.id}|${sub.id}', event)">
                            </div>
                            <input type="text" value="${sub.name}" onchange="renameSub('${cat.id}', '${sub.id}', this.value)" 
                                   style="background:none; border:none; color:white; font-weight:800; font-size:13px; flex:1; outline:none; opacity:0.9;">
                            <button onclick="addItem('${cat.id}', '${sub.id}')" style="background:var(--primary-green); color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:10px; font-weight:900;">+ NUOVO ELEMENTO</button>
                            <button onclick="delSub('${cat.id}','${sub.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer; opacity:0.3;"><i data-lucide="x" style="width:16px;"></i></button>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:5px; padding-left:60px;">
                            ${(sub.items || []).map((it, iIdx) => `
                                <div draggable="true" 
                                     ondragstart="handleLibDragStart(event, {type:'item', cIdx:${cIdx}, sIdx:${sIdx}, iIdx:${iIdx}})" 
                                     ondragover="handleLibDragOver(event)" 
                                     ondrop="handleLibDrop(event, {type:'item', cIdx:${cIdx}, sIdx:${sIdx}, iIdx:${iIdx}})"
                                     style="background:rgba(255,171,64,0.05); padding:8px 15px; border-radius:10px; display:flex; align-items:center; gap:10px; border:1px solid rgba(255,171,64,0.1); cursor:pointer;"
                                     onclick="editItem('${cat.id}','${sub.id}','${it.id}')">
                                    <i data-lucide="move" style="width:12px; opacity:0.2;"></i>
                                    <span style="flex:1; font-weight:900; font-size:11px; color:var(--accent); letter-spacing:1px;">${it.name}</span>
                                    
                                    <div style="display:flex; gap:8px;">
                                        <button onclick="event.stopPropagation(); event.preventDefault(); toggleListMustSee('${cat.id}','${sub.id}','${it.id}')" style="background:none; border:none; color:${it.isMustSee ? '#ffeb3b' : '#666'}; cursor:pointer; padding:5px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border-radius:5px;" title="Must See">
                                            <i data-lucide="star" style="width:12px; height:12px; fill:${it.isMustSee ? '#ffeb3b' : 'none'};"></i>
                                        </button>
                                        <button onclick="event.stopPropagation(); event.preventDefault(); toggleVisibility('${cat.id}','${sub.id}','${it.id}')" style="background:none; border:none; color:${it.isVisible !== false ? '#4caf50' : '#ff5252'}; cursor:pointer; padding:5px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.05); border-radius:5px;" title="Visibile allo User">
                                            <i data-lucide="${it.isVisible !== false ? 'eye' : 'eye-off'}" style="width:12px; height:12px;"></i>
                                        </button>
                                    </div>

                                    <i data-lucide="chevron-right" style="width:12px; opacity:0.5; margin-left:5px;"></i>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function handleLibDragStart(e, info) { curDrag = info; e.dataTransfer.effectAllowed = 'move'; e.stopPropagation(); }
function handleLibDragOver(e) { e.preventDefault(); e.stopPropagation(); }
function handleLibDrop(e, target) { 
    e.preventDefault(); e.stopPropagation();
    if(!curDrag || target.type !== curDrag.type) return; 

    var data = (curSection === 'visit') ? visitNamibia : library;

    if(curDrag.type === 'cat') {
        var item = data.categories.splice(curDrag.cIdx, 1)[0];
        data.categories.splice(target.cIdx, 0, item);
    } else if(curDrag.type === 'sub') {
        if(curDrag.cIdx !== target.cIdx) return;
        var subs = data.categories[target.cIdx].subcategories;
        var item = subs.splice(curDrag.sIdx, 1)[0];
        subs.splice(target.sIdx, 0, item);
    } else if(curDrag.type === 'item') {
        if(curDrag.cIdx !== target.cIdx || curDrag.sIdx !== target.sIdx) return;
        var its = data.categories[target.cIdx].subcategories[target.sIdx].items;
        var item = its.splice(curDrag.iIdx, 1)[0];
        its.splice(target.iIdx, 0, item);
    }
    curDrag = null;
    save();
}

async function uploadThumb(type, idString, e) {
    var file = e.target.files[0];
    if(!file) return;

    var data = (curSection === 'visit') ? visitNamibia : library;
    var imgEl = e.target.parentElement.querySelector('img');
    if(imgEl) imgEl.style.opacity = '0.3';

    try {
        const cloudUrl = await window.PARKS_DB.uploadFile(file);
        if(type === 'cat') {
            var cat = data.categories.find(c => c.id === idString);
            if(cat) cat.image = cloudUrl;
        } else {
            var parts = idString.split('|');
            var c = data.categories.find(x => x.id === parts[0]);
            if(c) {
                var sub = c.subcategories.find(s => s.id === parts[1]);
                if(sub) sub.image = cloudUrl;
            }
        }
        save();
    } catch(err) {
        console.error("Upload error:", err);
        alert("Errore durante il caricamento.");
    } finally {
        if(imgEl) imgEl.style.opacity = '1';
        e.target.value = '';
    }
}

function addCategory() { 
    var data = (curSection === 'visit') ? visitNamibia : library;
    var n = prompt("Titolo Macro-Categoria:"); if(n) { data.categories.push({ id:'cat_'+Date.now(), name:n.toUpperCase(), subcategories:[], image:'' }); save(); } 
}
function renameCat(id, val) { 
    var data = (curSection === 'visit') ? visitNamibia : library;
    data.categories.find(c => c.id === id).name = val.toUpperCase(); save(); 
}
function delCat(id) { 
    var data = (curSection === 'visit') ? visitNamibia : library;
    if(confirm("ELIMINARE CATEGORIA E TUTTI I CONTENUTI?")) { data.categories = data.categories.filter(c=>c.id!==id); save(); } 
}
function addSub(cId) { 
    var data = (curSection === 'visit') ? visitNamibia : library;
    var n = prompt("Titolo Sottocategoria:"); if(n) { var c = data.categories.find(x=>x.id===cId); c.subcategories.push({ id:'sub_'+Date.now(), name:n.toUpperCase(), items:[], image:'' }); save(); } 
}
function renameSub(cId, sId, val) { 
    var data = (curSection === 'visit') ? visitNamibia : library;
    var c = data.categories.find(x=>x.id===cId); c.subcategories.find(s=>s.id===sId).name = val.toUpperCase(); save(); 
}
function delSub(cId, sId) { 
    var data = (curSection === 'visit') ? visitNamibia : library;
    if(confirm("ELIMINARE SOTTOCATEGORIA?")) { var c = data.categories.find(x=>x.id===cId); c.subcategories = c.subcategories.filter(s=>s.id!==sId); save(); } 
}
function addItem(cId, sId) { 
    var data = (curSection === 'visit') ? visitNamibia : library;
    var n = prompt("Nome Elemento:"); if(n) { var c = data.categories.find(x=>x.id===cId); var s = c.subcategories.find(x=>x.id===sId); s.items.push({ id:'it_'+Date.now(), name:n.toUpperCase(), photos:[], description:'', facts:{}, lat:'', lng:'' }); save(); } 
}

function editItem(cId, sId, iId) { 
    curEditContext = { cId, sId, iId, section: curSection };
    var data = (curSection === 'visit') ? visitNamibia : library;
    var c = data.categories.find(x=>x.id===cId); 
    var s = c.subcategories.find(x=>x.id===sId); 
    curEditItem = s.items.find(x=>x.id===iId);
    document.getElementById('edit-header').innerText = curEditItem.name;
    document.getElementById('f-title').value = curEditItem.name;
    document.getElementById('f-desc').value = curEditItem.description || "";
    document.getElementById('f-weight').value = (curEditItem.facts && curEditItem.facts.weight) || "";
    document.getElementById('f-size').value = (curEditItem.facts && curEditItem.facts.size) || "";
    document.getElementById('f-life').value = (curEditItem.facts && curEditItem.facts.life) || "";
    document.getElementById('f-lat').value = curEditItem.lat || "";
    document.getElementById('f-lng').value = curEditItem.lng || "";
    
    var star = document.getElementById('f-star');
    if(star) {
        star.style.color = curEditItem.isMustSee ? '#ffeb3b' : '#666';
        const icon = star.querySelector('i');
        if(icon) icon.style.fill = curEditItem.isMustSee ? '#ffeb3b' : 'none';
    }

    try {
        // Smart Defaults based on category name
        var catName = (c && c.name) ? String(c.name).toUpperCase() : "";
        var defL1 = "PESO", defL2 = "DIMENSIONI", defL3 = "LONGEVITÀ";
        
        var title = (curEditItem && curEditItem.name) ? String(curEditItem.name).toUpperCase() : "";
        var isKnownPeople = title.includes("HERERO") || title.includes("HIMBA") || title.includes("PEOPLE") || title.includes("POPOLO");
        var isPeople = isKnownPeople || catName.includes("POPOLI") || catName.includes("GENTE") || catName.includes("PEOPLE") || section === 'visit';

        if (catName.includes("FLORA") || catName.includes("PIANTE") || catName.includes("ALBERI") || catName.includes("PLANTS")) {
            defL1 = "ALTEZZA"; defL2 = "SPECIE"; defL3 = "HABITAT";
        } else if (isPeople || catName.includes("CITTÀ") || catName.includes("LOCALITÀ")) {
            defL1 = "POPOLAZIONE"; defL2 = "SUPERFICIE"; defL3 = "REGIONE";
        } else if (catName.includes("GEOGRAFIA") || catName.includes("SITI") || catName.includes("LUOGHI") || catName.includes("FIUMI") || catName.includes("DESERTO") || catName.includes("PLACES")) {
            defL1 = "TIPOLOGIA"; defL2 = "ESTENSIONE"; defL3 = "INFO";
        } else if (catName.includes("LODGE") || catName.includes("STRUTTURE") || catName.includes("HOTEL")) {
            defL1 = "TIPOLOGIA"; defL2 = "SERVIZI"; defL3 = "FASCIA PREZZO";
        }

        var currentL1 = (curEditItem.facts && curEditItem.facts.label1) || "";
        var currentL2 = (curEditItem.facts && curEditItem.facts.label2) || "";
        
        // Force smart labels if current labels are generic
        if (isPeople || catName.includes("CITY") || catName.includes("CITTA") || catName.includes("PLACES")) {
            if (!currentL1 || currentL1.toUpperCase() === "PESO" || currentL1.toUpperCase() === "WEIGHT") currentL1 = defL1;
            if (!currentL2 || currentL2.toUpperCase() === "DIMENSIONI" || currentL2.toUpperCase() === "SIZE") currentL2 = defL2;
        } else {
            if (!currentL1) currentL1 = defL1;
            if (!currentL2) currentL2 = defL2;
        }

        document.getElementById('f-label1').value = currentL1;
        document.getElementById('f-label2').value = currentL2;
        document.getElementById('f-label3').value = (curEditItem.facts && curEditItem.facts.label3) || defL3;
    } catch (e) {
        console.error("Error in editFiche smart labels:", e);
    }
    
    renderEditPhotos();
    switchView('fiche-editor');
}

function renderEditPhotos() {
    var container = document.getElementById('f-photos');
    if(!container) return;
    container.innerHTML = (curEditItem.photos || []).map((p, idx) => {
        var url = typeof p === 'object' ? p.url : p;
        var name = typeof p === 'object' ? p.name : '';
        var isPdf = (typeof p === 'object' && p.type === 'application/pdf') || (typeof p === 'string' && p.startsWith('data:application/pdf'));
        var isVideo = (typeof p === 'object' && p.type === 'video/mp4') || (typeof p === 'string' && p.startsWith('data:video/mp4'));
        var isPpt = (typeof p === 'object' && (p.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || p.type === 'application/vnd.ms-powerpoint')) || (typeof p === 'string' && (p.startsWith('data:application/vnd.openxmlformats-officedocument.presentationml.presentation') || p.startsWith('data:application/vnd.ms-powerpoint')));
        
        return `
            <div class="photo-box" onclick="${(isPdf || isVideo || isPpt) ? `openDoc('${url}', '${name}')` : ''}">
                ${isPdf ? `<div class="pdf-icon"><i data-lucide="file-text"></i><span>${name || 'PDF'}</span></div>` : 
                  (isVideo ? `<video src="${url}" muted style="width:100%; height:100%; object-fit:cover;"></video>` :
                  (isPpt ? `<div class="ppt-icon"><i data-lucide="monitor-play"></i><span>${name || 'PPTX'}</span></div>` :
                  `<img src="${url}">`))}
                <button class="photo-del" onclick="event.stopPropagation(); delPhoto(${idx})">×</button>
            </div>
        `;
    }).join('');
    if(window.lucide) lucide.createIcons();
}

function openDoc(dataUrl, name) {
    if(dataUrl.startsWith('http')) { window.open(dataUrl, '_blank'); return; }
    var arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){ u8arr[n] = bstr.charCodeAt(n); }
    var blob = new Blob([u8arr], {type:mime});
    var url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}

async function uploadItemPhotos(e) {
    var files = Array.from(e.target.files);
    if(files.length === 0) return;
    const mediaSection = document.querySelector('.db-section:has(#f-photos)');
    if(mediaSection) mediaSection.style.opacity = '0.5';
    for (let f of files) {
        try {
            const cloudUrl = await window.PARKS_DB.uploadFile(f);
            if(!curEditItem.photos) curEditItem.photos = []; 
            curEditItem.photos.push({ url: cloudUrl, name: f.name.toUpperCase(), type: f.type }); 
        } catch(err) { alert("Errore caricamento " + f.name); }
    }
    if(mediaSection) mediaSection.style.opacity = '1';
    renderEditPhotos(); 
    e.target.value = '';
}

function delPhoto(idx) { if(confirm("Eliminare?")) { curEditItem.photos.splice(idx,1); renderEditPhotos(); } }

function saveFiche() {
    if(!curEditItem) return;
    curEditItem.name = document.getElementById('f-title').value.toUpperCase();
    curEditItem.description = document.getElementById('f-desc').value;
    curEditItem.facts = { 
        weight: document.getElementById('f-weight').value, 
        size: document.getElementById('f-size').value, 
        life: document.getElementById('f-life').value,
        label1: document.getElementById('f-label1').value.toUpperCase(),
        label2: document.getElementById('f-label2').value.toUpperCase(),
        label3: document.getElementById('f-label3').value.toUpperCase()
    };
    curEditItem.lat = document.getElementById('f-lat').value;
    curEditItem.lng = document.getElementById('f-lng').value;
    var section = (curEditContext && curEditContext.section) ? curEditContext.section : 'library';
    var prev = curSection; curSection = section; save(); curSection = prev;
    switchView(section);
}

function deleteItem() {
    if(!confirm("ELIMINARE?")) return;
    var ctx = curEditContext;
    var data = (ctx.section === 'visit') ? visitNamibia : library;
    var c = data.categories.find(x=>x.id===ctx.cId);
    var s = c.subcategories.find(x=>x.id===ctx.sId);
    s.items = s.items.filter(i=>i.id!==ctx.iId);
    var prev = curSection; curSection = ctx.section; save(); curSection = prev;
    switchView(ctx.section);
}

function toggleListMustSee(cId, sId, iId) {
    var data = (curSection === 'visit') ? visitNamibia : library;
    var cat = data.categories.find(x => x.id === cId);
    var sub = cat.subcategories.find(x => x.id === sId);
    var it = sub.items.find(x => x.id === iId);
    it.isMustSee = !it.isMustSee;
    save(true);
}

function toggleVisibility(cId, sId, iId) {
    var data = (curSection === 'visit') ? visitNamibia : library;
    var cat = data.categories.find(x => x.id === cId);
    var sub = cat.subcategories.find(x => x.id === sId);
    var it = sub.items.find(x => x.id === iId);
    it.isVisible = (it.isVisible === false) ? true : false;
    save(true);
}

function toggleMustSee() {
    if(!curEditItem) return;
    curEditItem.isMustSee = !curEditItem.isMustSee;
    var star = document.getElementById('f-star');
    if (star) {
        star.style.color = curEditItem.isMustSee ? '#ffeb3b' : '#666';
        const icon = star.querySelector('i');
        if (icon) icon.style.fill = curEditItem.isMustSee ? '#ffeb3b' : 'none';
    }
    save(false);
}
