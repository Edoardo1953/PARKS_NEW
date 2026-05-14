/**
 * PARKS - Map Editor Module (Static JPEG Map with Overlay Markers)
 */

var curMapCat = 'alert';

function renderMapEditor() {
    renderMapList();
    renderMarkerIcons();
    renderMarkersOnMap();
    
    // Update category label
    const label = document.getElementById('cur-cat');
    if(label) label.innerText = curMapCat.toUpperCase();
}

function switchX(cat) {
    curMapCat = cat;
    document.querySelectorAll('.marker-list .t-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('t-' + cat);
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
    
    const icons = library.available_icons[curMapCat] || [];
    if(icons.length === 0) {
        area.innerHTML = '<div style="opacity:0.3; font-size:10px; padding:10px;">Nessuna icona caricata per questa categoria</div>';
        return;
    }

    area.innerHTML = icons.map((icon, idx) => `
        <div class="icon-item" style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.05); padding:8px; border-radius:10px; margin-bottom:5px;">
            <img src="${icon}" style="width:30px; height:30px; object-fit:contain; background:#000; border-radius:4px; border:1px solid rgba(255,255,255,0.1);">
            <div style="flex:1;">
                 <div style="font-size:9px; opacity:0.5;">ICONA ${idx+1}</div>
            </div>
            <button onclick="deleteIcon(${idx})" style="background:none; border:none; color:#ff5252; cursor:pointer;"><i data-lucide="trash-2" style="width:12px;"></i></button>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
}

async function uploadIcon(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    const url = await window.PARKS_DB.uploadFile(file, 'icons/' + curMapCat + '/' + Date.now() + '_' + file.name);
    
    if(!library.available_icons) library.available_icons = {};
    if(!library.available_icons[curMapCat]) library.available_icons[curMapCat] = [];
    
    library.available_icons[curMapCat].push(url);
    save();
    renderMarkerIcons();
    event.target.value = '';
}

function deleteIcon(idx) {
    if(!confirm("Eliminare questa icona?")) return;
    library.available_icons[curMapCat].splice(idx, 1);
    save();
    renderMarkerIcons();
}

function handleMapClick(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    const icons = library.available_icons[curMapCat] || [];
    if(icons.length === 0) {
        alert("Carica almeno un'icona per questa categoria prima di posizionare marker.");
        return;
    }
    
    const title = prompt("Titolo del Marker:", "Nuovo Punto");
    if(!title) return;
    
    const newMarker = {
        id: Date.now(),
        type: curMapCat,
        title: title,
        icon: icons[0], // Use first icon by default
        x: x,
        y: y,
        timestamp: Date.now()
    };
    
    if(!library.map_markers) library.map_markers = [];
    library.map_markers.push(newMarker);
    save();
    renderMarkersOnMap();
}

function renderMarkersOnMap() {
    const layer = document.getElementById('marker-layer');
    if(!layer) return;
    
    const markers = library.map_markers || [];
    layer.innerHTML = markers.map(m => `
        <div class="map-marker" style="position:absolute; left:${m.x}%; top:${m.y}%; transform:translate(-50%, -50%); cursor:pointer; z-index:10;" onclick="event.stopPropagation(); editMarker(${m.id})">
            <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
                <img src="${m.icon}" style="width:30px; height:30px; object-fit:contain; filter:drop-shadow(0 2px 5px rgba(0,0,0,0.5));">
                <div style="background:rgba(0,0,0,0.8); color:white; font-size:8px; padding:2px 6px; border-radius:4px; margin-top:4px; white-space:nowrap; border:1px solid var(--accent); font-weight:900;">${m.title}</div>
            </div>
        </div>
    `).join('');
}

function editMarker(id) {
    const marker = library.map_markers.find(m => m.id === id);
    if(!marker) return;
    
    const newTitle = prompt("Modifica Titolo:", marker.title);
    if(newTitle === null) return; // cancel
    
    if(newTitle === "") {
        if(confirm("Eliminare questo marker?")) {
            library.map_markers = library.map_markers.filter(m => m.id !== id);
        } else {
            return;
        }
    } else {
        marker.title = newTitle;
        // Optionally cycle icon
        const icons = library.available_icons[marker.type] || [];
        if(icons.length > 1) {
            const curIdx = icons.indexOf(marker.icon);
            const nextIdx = (curIdx + 1) % icons.length;
            marker.icon = icons[nextIdx];
        }
    }
    
    save();
    renderMarkersOnMap();
}

function renderUI() {
    if(curSection === 'map') renderMapEditor();
}
