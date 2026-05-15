/**
 * PARKS - Map Editor Module (Static JPEG Map with Overlay Markers)
 */

var curMapCat = 'alert';
var selectedIconUrl = null;
var curDragMarkerId = null;
var isDraggingMarker = false;
var movedDuringDrag = false;
var dragStartPos = { x: 0, y: 0 };

function renderMapEditor() {
    // Ensure data structures exist
    if(!library) window.library = { categories: [], available_icons: {}, map_markers: [], available_maps: [] };
    if(!library.available_icons) library.available_icons = {};
    if(!library.map_markers) library.map_markers = [];
    if(!library.available_maps) library.available_maps = [];

    // Migration: Assign mapId to legacy markers that don't have one
    if (library.active_map_id && library.map_markers.length > 0) {
        let migrated = false;
        library.map_markers.forEach(m => {
            if (!m.mapId) {
                m.mapId = library.active_map_id;
                migrated = true;
            }
        });
        if (migrated) save();
    }

    renderMapList();
    renderMarkerIcons();
    renderMarkersOnMap();
    
    const label = document.getElementById('cur-cat');
    if(label) label.innerText = curMapCat.toUpperCase();
}

function switchX(cat) {
    curMapCat = cat.toLowerCase(); // Ensure lowercase internal state
    selectedIconUrl = null; // Reset selection when category changes
    document.querySelectorAll('.tab-grid .t-btn').forEach(b => b.classList.remove('active'));
    
    // Support both id=t-alert and id=t-ALERT
    const btn = document.getElementById('t-' + cat.toLowerCase()) || document.getElementById('t-' + cat.toUpperCase());
    if(btn) btn.classList.add('active');
    
    const label = document.getElementById('cur-cat');
    if(label) label.innerText = cat.toUpperCase();
    
    renderMarkerIcons();
}

function renderMapList() {
    const area = document.getElementById('map-list-area');
    if(!area) return;
    
    const maps = library.available_maps || [];
    if(maps.length === 0) {
        area.innerHTML = '<div style="opacity:0.3; font-size:10px; padding:10px;">Nessuna mappa caricata</div>';
        return;
    }

    area.innerHTML = maps.map(m => `
        <div class="map-item ${library.active_map_id === m.id ? 'active' : ''}" onclick="setActiveMap('${m.id}')" style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.05); padding:8px; border-radius:10px; margin-bottom:5px; cursor:pointer; border:1px solid ${library.active_map_id === m.id ? 'var(--accent)' : 'transparent'};">
            <img src="${m.url}" style="width:40px; height:30px; object-fit:cover; border-radius:4px;">
            <span style="font-size:10px; font-weight:800; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.name}</span>
            <button onclick="event.stopPropagation(); deleteMap('${m.id}')" style="background:none; border:none; color:#ff5252; cursor:pointer;"><i data-lucide="trash-2" style="width:12px;"></i></button>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
}

function setActiveMap(id) {
    library.active_map_id = id;
    const map = library.available_maps.find(m => m.id === id);
    if(map) {
        document.getElementById('map-img-bg').src = map.url;
    }
    save();
    renderMapList();
}

async function uploadMap(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    const url = await window.PARKS_DB.uploadFile(file, 'maps/' + Date.now() + '_' + file.name);
    const newMap = { id: 'map_' + Date.now(), name: file.name, url: url };
    
    if(!library.available_maps) library.available_maps = [];
    library.available_maps.push(newMap);
    library.active_map_id = newMap.id;
    document.getElementById('map-img-bg').src = url;
    
    save();
    renderMapList();
    event.target.value = '';
}

function deleteMap(id) {
    if(!confirm("Eliminare questa mappa?")) return;
    library.available_maps = library.available_maps.filter(m => m.id !== id);
    if(library.active_map_id === id) library.active_map_id = null;
    save();
    renderMapList();
}

function renderMarkerIcons() {
    const area = document.getElementById('marker-list-area');
    if(!area) return;
    
    // Case-insensitive lookup
    if(!library) return;
    if(!library.available_icons) library.available_icons = {};
    const icons = library.available_icons[curMapCat.toLowerCase()] || library.available_icons[curMapCat.toUpperCase()] || [];
    
    if(icons.length === 0) {
        area.innerHTML = `<div style="opacity:0.3; font-size:10px; padding:15px; text-align:center; border:1px dashed rgba(255,255,255,0.1); border-radius:15px; margin:10px;">
            NESSUNA ICONA PER "${curMapCat.toUpperCase()}"<br><br>
            <span style="font-size:9px; opacity:0.7;">CARICA UN'IMMAGINE QUI SOTTO PER INIZIARE</span>
        </div>`;
        return;
    }

    area.innerHTML = icons.map((icon, idx) => {
        const url = typeof icon === 'object' ? icon.url : icon;
        const name = typeof icon === 'object' ? icon.name : `ICONA #${idx+1}`;
        const isSelected = selectedIconUrl === url || (!selectedIconUrl && idx === 0);
        if (isSelected && !selectedIconUrl) selectedIconUrl = url; // Set default
        
        return `
            <div class="icon-item" onclick="selectIcon('${url}')" style="display:flex; align-items:center; gap:10px; background:${isSelected ? 'rgba(255,171,64,0.1)' : 'rgba(255,255,255,0.05)'}; padding:8px; border-radius:10px; margin-bottom:5px; border:1px solid ${isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}; cursor:pointer; transition:0.2s;">
                <div style="width:35px; height:35px; background:#000; border-radius:6px; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid ${isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};">
                    <img src="${url}" style="width:100%; height:100%; object-fit:contain;">
                </div>
                <div style="flex:1;">
                     <div style="font-size:10px; color:${isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.8)'}; font-weight:900; letter-spacing:1px;">${name}</div>
                </div>
                <button onclick="event.stopPropagation(); deleteIcon(${idx})" style="background:none; border:none; color:#ff5252; cursor:pointer; opacity:0.4; transition:0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.4'"><i data-lucide="trash-2" style="width:14px;"></i></button>
            </div>
        `;
    }).join('');
    if(window.lucide) lucide.createIcons();
}

async function uploadIcon(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    const iconName = prompt("Inserisci il nome per questa icona (es. BRACCONIERE):", file.name.split('.')[0].toUpperCase());
    if(!iconName) return;

    const url = await window.PARKS_DB.uploadFile(file, 'icons/' + curMapCat + '/' + Date.now() + '_' + file.name);
    
    if(!library.available_icons) library.available_icons = {};
    if(!library.available_icons[curMapCat]) library.available_icons[curMapCat] = [];
    
    // Store as object if we want name, but for compatibility we might need to check
    // I'll store it in a way that handles both string URLs and objects
    library.available_icons[curMapCat].push({ url: url, name: iconName.toUpperCase() });
    
    save();
    renderMarkerIcons();
    event.target.value = '';
}

function deleteIcon(idx) {
    if(!confirm("Eliminare questa icona?")) return;
    const cat = curMapCat.toLowerCase();
    const icons = library.available_icons[cat] || library.available_icons[cat.toUpperCase()];
    if(icons) {
        const deletedUrl = typeof icons[idx] === 'object' ? icons[idx].url : icons[idx];
        if (selectedIconUrl === deletedUrl) selectedIconUrl = null;
        icons.splice(idx, 1);
    }
    save();
    renderMarkerIcons();
}

function selectIcon(url) {
    selectedIconUrl = url;
    renderMarkerIcons();
}

function handleMapClick(event) {
    // If we are dragging, don't place a new marker
    if (isDraggingMarker || movedDuringDrag) return;
    
    const rect = document.getElementById('map-inner').getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    const icons = library.available_icons[curMapCat.toLowerCase()] || library.available_icons[curMapCat.toUpperCase()] || [];
    if(icons.length === 0) {
        alert("Carica almeno un'icona per questa categoria prima di posizionare marker.");
        return;
    }
    
    // Use selected icon or fallback to first
    let iconData = icons.find(i => (typeof i === 'object' ? i.url : i) === selectedIconUrl) || icons[0];
    const defaultTitle = typeof iconData === 'object' ? iconData.name : "Nuovo Punto";
    const iconUrl = typeof iconData === 'object' ? iconData.url : iconData;

    const title = prompt("Titolo del Marker:", defaultTitle);
    if(!title) return;
    
    const newMarker = {
        id: Date.now(),
        mapId: library.active_map_id, // Essential for filtering in User view
        type: curMapCat.toLowerCase(),
        title: title,
        icon: iconUrl, 
        x: x,
        y: y,
        timestamp: Date.now()
    };
    
    if(!library.map_markers) library.map_markers = [];
    library.map_markers.push(newMarker);
    save();
    renderMarkersOnMap();
}

function startMarkerDrag(e, id) {
    e.preventDefault();
    e.stopPropagation();
    curDragMarkerId = id;
    isDraggingMarker = true;
    movedDuringDrag = false;
    dragStartPos = { x: e.clientX, y: e.clientY };
    
    document.addEventListener('mousemove', onMarkerMouseMove);
    document.addEventListener('mouseup', stopMarkerDrag);
}

function onMarkerMouseMove(e) {
    if (!isDraggingMarker) return;
    
    // Check movement threshold
    if (Math.abs(e.clientX - dragStartPos.x) > 5 || Math.abs(e.clientY - dragStartPos.y) > 5) {
        movedDuringDrag = true;
    }
    
    const rect = document.getElementById('map-inner').getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Constrain to map bounds
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    
    const marker = library.map_markers.find(m => m.id === curDragMarkerId);
    if (marker) {
        marker.x = x;
        marker.y = y;
        
        // Live update position in DOM for smoothness
        const el = document.querySelector(`.map-marker[data-id="${marker.id}"]`);
        if (el) {
            el.style.left = x + '%';
            el.style.top = y + '%';
        }
    }
}

function stopMarkerDrag() {
    if (isDraggingMarker) {
        isDraggingMarker = false;
        save();
        document.removeEventListener('mousemove', onMarkerMouseMove);
        document.removeEventListener('mouseup', stopMarkerDrag);
        
        // Keep movedDuringDrag true for a moment to block the click event
        setTimeout(() => { movedDuringDrag = false; }, 200);
    }
}

function renderMarkersOnMap() {
    const layer = document.getElementById('marker-layer');
    if(!layer) return;
    
    // Filter markers by active map ID
    const markers = (library.map_markers || []).filter(m => m.mapId === library.active_map_id);
    layer.innerHTML = markers.map(m => `
        <div class="map-marker" data-id="${m.id}" 
             style="left:${m.x}%; top:${m.y}%;" 
             onmousedown="startMarkerDrag(event, ${m.id})"
             onclick="event.stopPropagation(); editMarker(${m.id})">
            <img src="${m.icon}">
            <div class="marker-label">${m.title}</div>
        </div>
    `).join('');
}

function editMarker(id) {
    // If we just moved the marker, don't open the editor
    if (movedDuringDrag) return;
    
    const marker = library.map_markers.find(m => m.id === id);
    if(!marker) return;
    
    // Explicit Delete check
    if (confirm(`VUOI ELIMINARE IL MARKER "${marker.title}"?\n\nPremi OK per confermare l'eliminazione.\nPremi ANNULLA se vuoi rinominarlo o cambiare icona.`)) {
        library.map_markers = library.map_markers.filter(m => m.id !== id);
        save();
        renderMarkersOnMap();
        return;
    }

    // Rename / Cycle Icon check
    const newTitle = prompt("MODIFICA TITOLO:\n(Lascia invariato e premi OK per ruotare l'icona)", marker.title);
    if(newTitle === null) return; // user cancelled prompt
    
    if(newTitle.trim() === "") {
        // Fallback for empty title: delete
        if(confirm("Eliminare definitivamente questo marker?")) {
            library.map_markers = library.map_markers.filter(m => m.id !== id);
        } else {
            return;
        }
    } else {
        marker.title = newTitle;
        
        // Cycle icon logic - Improved to handle objects
        const cat = marker.type.toLowerCase();
        const icons = library.available_icons[cat] || library.available_icons[cat.toUpperCase()] || [];
        
        if(icons.length > 1) {
            const curIdx = icons.findIndex(i => (typeof i === 'object' ? i.url : i) === marker.icon);
            const nextIdx = (curIdx + 1) % icons.length;
            const nextIcon = icons[nextIdx];
            marker.icon = typeof nextIcon === 'object' ? nextIcon.url : nextIcon;
        }
    }
    
    save();
    renderMarkersOnMap();
}

function renderUI() {
    if(curSection === 'map') renderMapEditor();
}
