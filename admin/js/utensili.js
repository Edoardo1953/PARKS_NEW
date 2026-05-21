/**
 * PARKS - Utensili Admin Module
 */

function renderUtensili() {
    var container = document.getElementById('utensili-container');
    if (!container) return;

    if (!utensili.sections || utensili.sections.length === 0) {
        container.innerHTML = `<div style="opacity:0.3; text-align:center; padding:5rem;">Nessuna sezione Utensili presente. Inizia creandone una.</div>`;
        return;
    }

    container.innerHTML = utensili.sections.map((sec, sIdx) => `
        <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.1); border-left:4px solid ${sec.color || 'var(--accent)'}; border-radius:15px; padding:1.5rem; margin-bottom:1.5rem;">
            
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:15px; margin-bottom:15px;">
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="width:40px; height:40px; border-radius:10px; background:rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:${sec.color || 'var(--accent)'};">
                        <i data-lucide="${sec.icon || 'folder'}" style="width:20px;"></i>
                    </div>
                    <input type="text" value="${sec.title || ''}" onchange="updateUtensiliSection('${sec.id}', 'title', this.value)" style="background:none; border:none; color:white; font-weight:900; font-size:1.2rem; outline:none; width:200px;">
                </div>
                <div style="display:flex; gap:10px;">
                    <button onclick="openUtensiliItemEditor('${sec.id}')" style="background:var(--primary-green); color:white; border:none; padding:8px 15px; border-radius:10px; font-weight:900; font-size:10px; cursor:pointer;">+ NUOVO ITEM</button>
                    <button onclick="deleteUtensiliSection('${sec.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer; opacity:0.5;"><i data-lucide="trash-2" style="width:16px;"></i></button>
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:10px;">
                ${(sec.items || []).length === 0 ? `<div style="font-size:11px; opacity:0.3; padding:10px;">Nessun elemento in questa sezione.</div>` : ''}
                ${(sec.items || []).map((it, iIdx) => `
                    <div style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:10px; padding:10px 15px; display:flex; align-items:center; gap:15px;">
                        
                        <div style="width:30px; height:30px; border-radius:8px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; color:${getTypeColor(it.type)}">
                            <i data-lucide="${getTypeIcon(it.type)}" style="width:14px;"></i>
                        </div>
                        
                        <div style="flex:1;">
                            <div style="font-weight:900; font-size:12px; color:var(--accent);">${it.title || 'Senza Titolo'}</div>
                            <div style="font-size:10px; opacity:0.6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:400px;">${it.description || ''}</div>
                        </div>

                        <div style="display:flex; gap:5px;">
                            ${(it.tags || []).map(t => `<span style="background:rgba(255,255,255,0.1); font-size:9px; padding:3px 6px; border-radius:4px; opacity:0.7;">${t}</span>`).join('')}
                        </div>

                        <div style="display:flex; align-items:center; gap:10px; margin-left:15px;">
                            <button onclick="toggleUtensiliItemVisibility('${sec.id}', '${it.id}')" style="background:none; border:none; color:${it.isVisible !== false ? '#4caf50' : '#ff5252'}; cursor:pointer; padding:5px; border-radius:5px; display:flex; align-items:center; justify-content:center;" title="Visibilità">
                                <i data-lucide="${it.isVisible !== false ? 'eye' : 'eye-off'}" style="width:14px;"></i>
                            </button>
                            <button onclick="openUtensiliItemEditor('${sec.id}', '${it.id}')" style="background:rgba(255,255,255,0.1); color:white; border:none; padding:6px; border-radius:8px; cursor:pointer;" title="Modifica">
                                <i data-lucide="edit-2" style="width:12px;"></i>
                            </button>
                            <button onclick="deleteUtensiliItem('${sec.id}', '${it.id}')" style="background:rgba(255,82,82,0.1); color:var(--danger); border:none; padding:6px; border-radius:8px; cursor:pointer;" title="Elimina">
                                <i data-lucide="trash" style="width:12px;"></i>
                            </button>
                        </div>

                    </div>
                `).join('')}
            </div>
            
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

function getTypeIcon(type) {
    if (type === 'document') return 'file-text';
    if (type === 'link') return 'link';
    if (type === 'app') return 'layout-grid';
    return 'file';
}

function getTypeColor(type) {
    if (type === 'document') return '#ffab40'; // accent
    if (type === 'link') return '#00bcd4';   // cyan
    if (type === 'app') return '#4caf50';    // green
    return '#fff';
}

function addUtensiliSection() {
    var n = prompt("Titolo Sezione (es. MANUALI):");
    if (n) {
        if (!utensili.sections) utensili.sections = [];
        utensili.sections.push({
            id: 'usec_' + Date.now(),
            title: n.toUpperCase(),
            icon: 'folder',
            color: '#ffab40',
            items: []
        });
        saveUtensili();
    }
}

function updateUtensiliSection(secId, field, value) {
    var sec = utensili.sections.find(s => s.id === secId);
    if (sec) {
        sec[field] = value;
        saveUtensili();
    }
}

function deleteUtensiliSection(secId) {
    if (confirm("Eliminare intera sezione e tutti i suoi elementi?")) {
        utensili.sections = utensili.sections.filter(s => s.id !== secId);
        saveUtensili();
    }
}

let curUtensiliContext = { secId: null, itemId: null };

function openUtensiliItemEditor(secId, itemId = null) {
    curUtensiliContext.secId = secId;
    curUtensiliContext.itemId = itemId;

    var sec = utensili.sections.find(s => s.id === secId);
    if (!sec) return;

    var it = null;
    if (itemId) {
        it = sec.items.find(i => i.id === itemId);
    }

    // Reset Form
    document.getElementById('u-type').value = it ? it.type : 'document';
    document.getElementById('u-title').value = it ? it.title : '';
    document.getElementById('u-desc').value = it ? it.description : '';
    document.getElementById('u-tags').value = (it && it.tags) ? it.tags.join(', ') : '';
    
    // Reset specific fields
    document.getElementById('u-url-input').value = (it && it.fileUrl) ? it.fileUrl : '';
    document.getElementById('u-app-select').value = (it && it.fileUrl) ? it.fileUrl : 'map.html';
    
    // File upload area reset
    var preview = document.getElementById('u-file-preview');
    if (it && it.type === 'document' && it.fileUrl) {
        preview.innerHTML = `<a href="${it.fileUrl}" target="_blank" style="color:var(--accent); font-size:11px;">📄 ${it.fileName || 'Vedi File Corrente'}</a>`;
    } else {
        preview.innerHTML = '';
    }

    onUtensiliTypeChange();
    document.getElementById('utensili-editor-modal').style.display = 'flex';
}

function closeUtensiliItemEditor() {
    document.getElementById('utensili-editor-modal').style.display = 'none';
    curUtensiliContext = { secId: null, itemId: null };
}

function onUtensiliTypeChange() {
    var type = document.getElementById('u-type').value;
    document.getElementById('u-doc-area').style.display = type === 'document' ? 'block' : 'none';
    document.getElementById('u-link-area').style.display = type === 'link' ? 'block' : 'none';
    document.getElementById('u-app-area').style.display = type === 'app' ? 'block' : 'none';
}

async function uploadUtensiliFile(e) {
    var file = e.target.files[0];
    if (!file) return;

    document.getElementById('u-file-preview').innerHTML = `<span style="opacity:0.5; font-size:11px;">Caricamento in corso...</span>`;
    
    try {
        const cloudUrl = await window.PARKS_DB.uploadFile(file);
        
        // Save temp info to context
        curUtensiliContext.tempFileUrl = cloudUrl;
        curUtensiliContext.tempFileName = file.name;
        curUtensiliContext.tempFileSize = (file.size / (1024*1024)).toFixed(2) + ' MB';
        
        document.getElementById('u-file-preview').innerHTML = `<span style="color:#4caf50; font-size:11px;">✅ File caricato: ${file.name}</span>`;
    } catch (err) {
        console.error("Upload error:", err);
        document.getElementById('u-file-preview').innerHTML = `<span style="color:#ff5252; font-size:11px;">❌ Errore caricamento</span>`;
        alert("Errore durante il caricamento del file.");
    }
}

function saveUtensiliItem() {
    var sec = utensili.sections.find(s => s.id === curUtensiliContext.secId);
    if (!sec) return;

    var type = document.getElementById('u-type').value;
    var title = document.getElementById('u-title').value.trim();
    if (!title) return alert("Inserire un titolo");

    var it = null;
    if (curUtensiliContext.itemId) {
        it = sec.items.find(i => i.id === curUtensiliContext.itemId);
    } else {
        it = { id: 'uit_' + Date.now(), createdAt: Date.now(), isVisible: true };
        if(!sec.items) sec.items = [];
        sec.items.push(it);
    }

    it.type = type;
    it.title = title;
    it.description = document.getElementById('u-desc').value.trim();
    
    var tagsStr = document.getElementById('u-tags').value;
    it.tags = tagsStr.split(',').map(t => t.trim().toUpperCase()).filter(t => t);

    it.icon = getTypeIcon(type);

    if (type === 'document') {
        if (curUtensiliContext.tempFileUrl) {
            it.fileUrl = curUtensiliContext.tempFileUrl;
            it.fileName = curUtensiliContext.tempFileName;
            it.fileSize = curUtensiliContext.tempFileSize;
        }
    } else if (type === 'link') {
        it.fileUrl = document.getElementById('u-url-input').value.trim();
    } else if (type === 'app') {
        it.fileUrl = document.getElementById('u-app-select').value;
    }

    saveUtensili();
    closeUtensiliItemEditor();
}

function deleteUtensiliItem(secId, itemId) {
    if (confirm("Eliminare questo elemento?")) {
        var sec = utensili.sections.find(s => s.id === secId);
        if (sec) {
            sec.items = sec.items.filter(i => i.id !== itemId);
            saveUtensili();
        }
    }
}

function toggleUtensiliItemVisibility(secId, itemId) {
    var sec = utensili.sections.find(s => s.id === secId);
    if (sec) {
        var it = sec.items.find(i => i.id === itemId);
        if (it) {
            it.isVisible = (it.isVisible === false) ? true : false;
            saveUtensili();
        }
    }
}

function saveUtensili() {
    window.PARKS_DB.save('parks_utensili_v1', utensili, () => {
        renderUtensili();
    });
}
