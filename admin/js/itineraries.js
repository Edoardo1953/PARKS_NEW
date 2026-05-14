var itiLeafletMap = null;
var itiLeafletMarkers = [];
var itiLeafletPolyline = null;
var editingItiIndex = -1;
var currentItiWaypoints = [];
var currentItiImage = "";

function renderAdminItineraries() {
    var container = document.getElementById('itineraries-admin-list');
    if(!container) return;
    if(itinerariesList.length === 0) {
        container.innerHTML = '<div style="opacity:0.3; text-align:center; padding:3rem; grid-column:1/-1;">NESSUN ITINERARIO CREATO</div>';
        return;
    }
    container.innerHTML = itinerariesList.map((iti, idx) => `
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:20px; display:flex; flex-direction:column; gap:10px;">
            ${iti.image ? `<img src="${iti.image}" style="width:100%; height:120px; object-fit:cover; border-radius:10px; margin-bottom:10px;">` : ''}
            <h3 style="margin:0; color:var(--accent);">${iti.title}</h3>
            <p style="font-size:10px; color:white; font-weight:700; opacity:0.8; margin:0; text-transform:uppercase;"><i data-lucide="globe" style="width:12px;"></i> ZONA: ${iti.location || 'N/D'}</p>
            <p style="font-size:11px; opacity:0.6; margin:0; flex:1;">${iti.description || 'Nessuna descrizione.'}</p>
            ${(iti.waypoints && iti.waypoints.length > 0) ? `<p style="font-size:10px; opacity:0.6; margin:0; font-weight:800; color:var(--accent);"><i data-lucide="map" style="width:10px;"></i> ${iti.waypoints.length} Tappe GPS</p>` : ''}
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button onclick="editItinerary(${idx})" style="flex:1; background:rgba(255,255,255,0.05); color:white; border:none; padding:8px; border-radius:10px; font-size:10px; cursor:pointer;"><i data-lucide="edit-2" style="width:12px;"></i> MODIFICA</button>
                <button onclick="deleteItinerary(${idx})" style="flex:1; background:rgba(255,82,82,0.1); color:#ff5252; border:none; padding:8px; border-radius:10px; font-size:10px; cursor:pointer;"><i data-lucide="trash" style="width:12px;"></i> ELIMINA</button>
            </div>
        </div>
    `).join('');
    if(window.lucide) lucide.createIcons();
}

function previewItiImage(e) {
    var r = new FileReader();
    r.onload = function(ev) {
        currentItiImage = ev.target.result;
        document.getElementById('iti-preview').src = currentItiImage;
        document.getElementById('iti-preview-container').style.display = 'block';
        document.getElementById('iti-upload-placeholder').style.display = 'none';
    };
    if(e.target.files[0]) r.readAsDataURL(e.target.files[0]);
}

function initItiLeafletMap() {
    const mapDiv = document.getElementById('iti-leaflet-map');
    if(!mapDiv) {
        console.error("Map container 'iti-leaflet-map' not found.");
        return;
    }

    if(itiLeafletMap) {
        // Map already exists, just make sure it fits the container
        setTimeout(() => {
            itiLeafletMap.invalidateSize();
            if(currentItiWaypoints && currentItiWaypoints.length > 0) {
                var validWaypoints = currentItiWaypoints.filter(w => w && typeof w.lat === 'number' && typeof w.lng === 'number');
                if(validWaypoints.length > 0) {
                    var bounds = L.latLngBounds(validWaypoints.map(w => [w.lat, w.lng]));
                    itiLeafletMap.fitBounds(bounds, {padding: [50, 50]});
                }
            }
        }, 200);
        return;
    }

    itiLeafletMap = L.map('iti-leaflet-map').setView([-22.56, 17.06], 6);

    var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    });
    var esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19
    });
    var esriLabels = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Labels &copy; Esri',
        maxZoom: 19
    });

    osmLayer.addTo(itiLeafletMap);

    L.control.layers({
        '🗺️ Mappa Stradale (Città)': osmLayer,
        '🛰️ Satellite': esriSat
    }, {
        '🏷️ Etichette su Satellite': esriLabels
    }, { position: 'topright' }).addTo(itiLeafletMap);

    itiLeafletMap.on('click', function(e) {
        var newWp = {
            id: Date.now(),
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            title: "Tappa " + (currentItiWaypoints.length + 1),
            ficheId: ""
        };
        currentItiWaypoints.push(newWp);
        renderItiWaypoints();
    });

    // Final check for size
    setTimeout(() => itiLeafletMap.invalidateSize(), 500);
}

function getFicheOptionsHtml(selectedFicheId) {
    var options = '<option value="">(Nessuna Scheda Associata)</option>';
    var allItems = [];
    [library, (typeof visitNamibia !== 'undefined' ? visitNamibia : {categories:[]})].forEach(db => {
        (db.categories || []).forEach(c => (c.subcategories || []).forEach(s => {
            (s.items || []).forEach(it => {
                allItems.push({ id: it.id, name: it.name || "Senza Nome", isMustSee: it.isMustSee });
            });
        }));
    });
    allItems.sort((a,b) => (b.isMustSee ? 1 : 0) - (a.isMustSee ? 1 : 0));

    allItems.forEach(it => {
        var prefix = it.isMustSee ? "⭐ MUST SEE: " : "Libreria: ";
        var sel = selectedFicheId == it.id ? 'selected' : '';
        options += `<option value="${it.id}" ${sel}>${prefix}${it.name}</option>`;
    });
    return options;
}

function removeItiWaypoint(idx) {
    currentItiWaypoints.splice(idx, 1);
    renderItiWaypoints();
}

function moveItiWaypoint(idx, dir) {
    if(idx + dir < 0 || idx + dir >= currentItiWaypoints.length) return;
    var temp = currentItiWaypoints[idx];
    currentItiWaypoints[idx] = currentItiWaypoints[idx + dir];
    currentItiWaypoints[idx + dir] = temp;
    renderItiWaypoints();
}

function updateItiWaypointTitle(idx, val) {
    if(currentItiWaypoints[idx]) currentItiWaypoints[idx].title = val;
    updateItiMapMarkers();
}

function updateItiWaypointFiche(idx, val) {
    if(currentItiWaypoints[idx]) currentItiWaypoints[idx].ficheId = val;
}

function invertItiWaypoints() {
    currentItiWaypoints.reverse();
    renderItiWaypoints();
}

function updateItiMapMarkers() {
    if(!itiLeafletMap) return;
    itiLeafletMarkers.forEach(m => itiLeafletMap.removeLayer(m));
    if(itiLeafletPolyline) {
        if(Array.isArray(itiLeafletPolyline)) {
            itiLeafletPolyline.forEach(l => itiLeafletMap.removeLayer(l));
        } else {
            itiLeafletMap.removeLayer(itiLeafletPolyline);
        }
    }
    itiLeafletMarkers = [];
    itiLeafletPolyline = null;

    var latlngs = [];
    currentItiWaypoints.forEach((wp, idx) => {
        var latlng = [wp.lat, wp.lng];
        latlngs.push(latlng);
        
        var color = idx === 0 ? "#4caf50" : (idx === currentItiWaypoints.length - 1 ? "#ff5252" : "#ffab40");
        var label = idx === 0 ? "🟢 PARTENZA" : (idx === currentItiWaypoints.length - 1 ? "🔴 ARRIVO" : "🟡 TAPPA");
        
        var icon = L.divIcon({
            className: 'custom-iti-marker',
            html: `<div style="background:${color}; width:28px; height:28px; border-radius:50%; border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px; color:#000;">${idx+1}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });
        
        var m = L.marker(latlng, {icon: icon, draggable: true}).addTo(itiLeafletMap);
        m.bindTooltip(`<b>${label} ${idx+1}</b><br><small>${wp.title || 'Tappa'}</small>`, {direction: 'top', offset: [0, -14]});
        
        m.on('dragend', function(e) {
            currentItiWaypoints[idx].lat = e.target.getLatLng().lat;
            currentItiWaypoints[idx].lng = e.target.getLatLng().lng;
            renderItiWaypoints();
        });
        
        itiLeafletMarkers.push(m);
    });

    if(latlngs.length > 1) {
        // Fallback dashed line
        var tempLine = L.polyline(latlngs, {color: '#ffab40', weight: 3, dashArray: '8, 6', opacity: 0.5}).addTo(itiLeafletMap);
        itiLeafletPolyline = tempLine;
        
        var coords = currentItiWaypoints.map(wp => wp.lng + ',' + wp.lat).join(';');
        var url = 'https://router.project-osrm.org/route/v1/driving/' + coords + '?overview=full&geometries=geojson';
        
        fetch(url)
            .then(r => r.json())
            .then(data => {
                if(data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    if(itiLeafletPolyline) {
                        if(Array.isArray(itiLeafletPolyline)) itiLeafletPolyline.forEach(l => itiLeafletMap.removeLayer(l));
                        else itiLeafletMap.removeLayer(itiLeafletPolyline);
                    }
                    var realLine = L.geoJSON(data.routes[0].geometry, {
                        style: {
                            color: '#ffab40', weight: 6, opacity: 0.9, lineJoin: 'round', lineCap: 'round'
                        }
                    }).addTo(itiLeafletMap);
                    itiLeafletPolyline = [realLine];
                    
                    var dist = (data.routes[0].distance / 1000).toFixed(1);
                    var mins = Math.round(data.routes[0].duration / 60);
                    var h = Math.floor(mins/60), m = mins%60;
                    var timeStr = h > 0 ? h+'h '+m+'min' : mins+' min';
                    
                    var statsEl = document.getElementById('iti-route-stats');
                    if(statsEl) {
                        statsEl.innerHTML = `<span style="color:#ffab40; font-weight:900;">🛣️ ${dist} km</span> &nbsp;|&nbsp; <span style="color:#4caf50; font-weight:900;">⏱️ ${timeStr}</span> &nbsp;|&nbsp; <span style="opacity:0.6; font-weight:700;">${currentItiWaypoints.length} tappe</span>`;
                        statsEl.style.display = 'block';
                    }
                    
                    // Fit bounds after route is loaded
                    if(itiLeafletMap && latlngs.length > 0) {
                        var bounds = L.latLngBounds(latlngs);
                        itiLeafletMap.fitBounds(bounds, {padding: [40, 40]});
                    }
                }
            })
            .catch(() => {
                console.warn("OSRM Route fetch failed, keeping fallback line.");
            });
    } else {
        var statsEl = document.getElementById('iti-route-stats');
        if(statsEl) statsEl.style.display = 'none';
        if(latlngs.length === 1) {
            itiLeafletMap.setView(latlngs[0], 12);
        }
    }
}

// ===== GEOCODER =====
var geoSearchTimer = null;
function debouncedGeoSearch(query) {
    clearTimeout(geoSearchTimer);
    var q = query.trim();
    if(q.length < 2) { closeGeoResults(); return; }
    document.getElementById('geo-searching').style.display = 'block';
    geoSearchTimer = setTimeout(function() { runGeoSearch(q); }, 400);
}

function runGeoSearch(query) {
    var q = query.trim().toUpperCase();
    var localResults = [];
    var dbs = [library, (typeof visitNamibia !== 'undefined' ? visitNamibia : {categories:[]})];
    
    dbs.forEach(db => {
        if(db && db.categories) {
            db.categories.forEach(cat => {
                if(cat.subcategories) {
                    cat.subcategories.forEach(sub => {
                        if(sub.items) {
                            sub.items.forEach(it => {
                                if(it.name && it.name.toUpperCase().includes(q)) {
                                    var marker = (library.map_markers || []).find(m => m.ficheId === it.id);
                                    if(marker) {
                                        localResults.push({
                                            lat: marker.lat, lon: marker.lng,
                                            display_name: it.name + " (In Archivio)",
                                            type: 'fiche', isLocal: true, ficheId: it.id
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    localResults = localResults.slice(0, 5);
    var url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(query) +
              '&format=json&limit=6&addressdetails=1&accept-language=it,en';
    
    fetch(url, { headers: { 'Accept-Language': 'it,en' } })
        .then(r => r.json())
        .then(results => {
            document.getElementById('geo-searching').style.display = 'none';
            var combined = [...localResults, ...results];
            renderGeoResults(combined);
        })
        .catch(() => {
            document.getElementById('geo-searching').style.display = 'none';
            renderGeoResults(localResults);
        });
}

function renderGeoResults(results) {
    var box = document.getElementById('geo-results');
    if(!results || results.length === 0) {
        box.innerHTML = '<div style="padding:14px 16px; font-size:11px; opacity:0.4; font-weight:700;">Nessun risultato trovato. Prova con un nome più semplice.</div>';
        box.style.display = 'block';
        return;
    }
    box.innerHTML = results.map((r, i) => {
        var displayName = r.isLocal ? r.display_name : r.display_name.split(',').slice(0,3).join(', ');
        var shortName = r.isLocal ? r.display_name.replace(" (In Archivio)", "") : r.display_name.split(',')[0];
        var type = r.type || r.class || '';
        var icon = r.isLocal ? '⭐' : getGeoIcon(r.type || r.class);
        
        return `<div class="geo-result-item" onclick="addGeoWaypoint(${r.lat}, ${r.lon}, '${shortName.replace(/'/g,"\\'")}', '${r.ficheId || ""}')" 
            style="padding:11px 16px; display:flex; align-items:center; gap:12px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); transition:0.2s;"
            onmouseover="this.style.background='rgba(255,171,64,0.1)'" onmouseout="this.style.background=''">
            <span style="font-size:18px; flex-shrink:0;">${icon}</span>
            <div style="min-width:0;">
                <div style="font-size:12px; font-weight:900; color:${r.isLocal ? 'var(--accent)' : 'white'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${displayName}</div>
                <div style="font-size:10px; opacity:0.4; font-weight:600; text-transform:capitalize;">${type.replace(/_/g,' ')}</div>
            </div>
            <span style="margin-left:auto; flex-shrink:0; background:${r.isLocal ? 'var(--accent)' : 'rgba(255,171,64,0.15)'}; color:${r.isLocal ? '#000' : 'var(--accent)'}; border-radius:8px; padding:4px 10px; font-size:10px; font-weight:900;">+ AGGIUNGI</span>
        </div>`;
    }).join('');
    box.style.display = 'block';
}

function getGeoIcon(type) {
    var icons = {
        city: '🏙️', town: '🏘️', village: '🏡', hamlet: '🏚️',
        park: '🌿', nature_reserve: '🦁', national_park: '🏞️',
        airport: '✈️', aerodrome: '✈️',
        hotel: '🏨', camp_site: '⛺', tourism: '📸',
        lake: '💧', river: '🌊', waterfall: '💦',
        mountain: '⛰️', peak: '🗻', valley: '🌄',
        road: '🛣️', highway: '🛣️',
        administrative: '📍'
    };
    return icons[type] || '📍';
}

function addGeoWaypoint(lat, lon, name, ficheId = "") {
    closeGeoResults();
    document.getElementById('iti-search-input').value = '';
    var newWp = { id: Date.now(), lat: parseFloat(lat), lng: parseFloat(lon), title: name, ficheId: ficheId || "" };
    currentItiWaypoints.push(newWp);
    if(itiLeafletMap) itiLeafletMap.setView([parseFloat(lat), parseFloat(lon)], Math.max(itiLeafletMap.getZoom(), 10));
    renderItiWaypoints();
}

function closeGeoResults() {
    var box = document.getElementById('geo-results');
    if(box) box.style.display = 'none';
}

function renderItiWaypoints() {
    var container = document.getElementById('iti-waypoints-list');
    if(currentItiWaypoints.length === 0) {
        container.innerHTML = '<div style="font-size:10px; opacity:0.4; text-align:center;">Nessuna tappa aggiunta.<br>Clicca sulla mappa a destra per iniziare.</div>';
        updateItiMapMarkers();
        return;
    }
    container.innerHTML = currentItiWaypoints.map((wp, idx) => {
        var label = idx === 0 ? "PARTENZA" : (idx === currentItiWaypoints.length - 1 ? "ARRIVO" : "TAPPA");
        var color = idx === 0 ? "#4caf50" : (idx === currentItiWaypoints.length - 1 ? "#ff5252" : "var(--accent)");
        return `
        <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:15px; display:flex; flex-direction:column; gap:10px; border:1px solid rgba(255,255,255,0.1);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="background:${color}; color:#000; font-size:10px; font-weight:900; padding:4px 8px; border-radius:6px;">${label} ${idx+1}</span>
                <div style="display:flex; gap:5px;">
                    <button onclick="moveItiWaypoint(${idx}, -1)" style="background:rgba(255,255,255,0.1); border:none; color:white; border-radius:5px; padding:5px; cursor:pointer;" ${idx===0?'disabled':''}><i data-lucide="chevron-up" style="width:14px;"></i></button>
                    <button onclick="moveItiWaypoint(${idx}, 1)" style="background:rgba(255,255,255,0.1); border:none; color:white; border-radius:5px; padding:5px; cursor:pointer;" ${idx===currentItiWaypoints.length-1?'disabled':''}><i data-lucide="chevron-down" style="width:14px;"></i></button>
                    <button onclick="removeItiWaypoint(${idx})" style="background:rgba(255,82,82,0.2); border:none; color:#ff5252; border-radius:5px; padding:5px; cursor:pointer;"><i data-lucide="x" style="width:14px;"></i></button>
                </div>
            </div>
            <input type="text" class="f-input" value="${wp.title}" onchange="updateItiWaypointTitle(${idx}, this.value)" placeholder="Nome Tappa" style="background:#111; border:none; border-radius:8px; padding:8px; color:white;">
            <select class="f-input" onchange="updateItiWaypointFiche(${idx}, this.value)" style="background:#111; border:none; border-radius:8px; padding:8px; color:white; font-size:11px;">
                ${getFicheOptionsHtml(wp.ficheId)}
            </select>
        </div>`;
    }).join('');
    if(currentItiWaypoints.length > 1) {
        container.innerHTML += `<button onclick="invertItiWaypoints()" style="margin-top:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; padding:10px; border-radius:10px; font-size:11px; cursor:pointer; width:100%; font-weight:800;"><i data-lucide="refresh-cw" style="width:12px; margin-right:5px;"></i> INVERTI ROTTA (PARTENZA ⇆ ARRIVO)</button>`;
    }
    if(window.lucide) lucide.createIcons();
    updateItiMapMarkers();
}

function addItinerary() {
    editingItiIndex = -1;
    document.getElementById('iti-name').value = '';
    document.getElementById('iti-location').value = 'NAMIBIA';
    document.getElementById('iti-desc').value = '';
    currentItiImage = "";
    currentItiWaypoints = [];
    document.getElementById('iti-preview-container').style.display = 'none';
    document.getElementById('iti-upload-placeholder').style.display = 'block';
    document.getElementById('iti-file').value = '';
    document.getElementById('itinerary-editor-modal').style.display = 'flex';
    setTimeout(initItiLeafletMap, 100);
    renderItiWaypoints();
}

function forceSyncItineraries() {
    if(!confirm("Vuoi ricaricare gli itinerari dal Cloud? Questo sovrascriverà eventuali modifiche non salvate.")) return;
    window.PARKS_DB.get('parks_itineraries', [], function(data) {
        if(data) {
            if(!Array.isArray(data)) data = Object.values(data);
            itinerariesList = data.map(iti => {
                if(iti && iti.waypoints && !Array.isArray(iti.waypoints)) iti.waypoints = Object.values(iti.waypoints);
                return iti;
            });
            alert("Dati sincronizzati dal Cloud!");
            renderAdminItineraries();
        } else {
            alert("Nessun dato trovato sul Cloud.");
        }
    });
}

function editItinerary(idx) {
    editingItiIndex = idx;
    var iti = itinerariesList[idx];
    document.getElementById('iti-name').value = iti.title || '';
    document.getElementById('iti-location').value = iti.location || '';
    document.getElementById('iti-desc').value = iti.description || '';
    currentItiImage = iti.image || "";
    currentItiWaypoints = [...(iti.waypoints || [])];
    if(iti.markerId && currentItiWaypoints.length === 0) currentItiWaypoints.push(iti.markerId);

    if(currentItiImage) {
        document.getElementById('iti-preview').src = currentItiImage;
        document.getElementById('iti-preview-container').style.display = 'block';
        document.getElementById('iti-upload-placeholder').style.display = 'none';
    } else {
        document.getElementById('iti-preview-container').style.display = 'none';
        document.getElementById('iti-upload-placeholder').style.display = 'block';
    }

    document.getElementById('itinerary-editor-modal').style.display = 'flex';
    setTimeout(() => {
        initItiLeafletMap();
        if(itiLeafletMap) {
            itiLeafletMap.invalidateSize();
            if(currentItiWaypoints && currentItiWaypoints.length > 0) {
                try {
                    var validWaypoints = currentItiWaypoints.filter(w => w && typeof w.lat === 'number' && typeof w.lng === 'number');
                    if(validWaypoints.length > 0) {
                        var bounds = L.latLngBounds(validWaypoints.map(w => [w.lat, w.lng]));
                        itiLeafletMap.fitBounds(bounds, {padding: [50, 50]});
                    }
                } catch(e) { console.error(e); }
            }
        }
        renderItiWaypoints();
    }, 300);
}

async function saveItinerary() {
    var title = document.getElementById('iti-name').value;
    var locationStr = document.getElementById('iti-location').value;
    var desc = document.getElementById('iti-desc').value;
    if(!title) return alert('Inserisci il nome');
    
    const saveBtn = document.querySelector('.btn-save');
    const originalBtnHtml = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="spinner-small"></i> SALVATAGGIO...';
    saveBtn.disabled = true;

    try {
        var finalImageUrl = currentItiImage;
        if(currentItiImage && currentItiImage.startsWith('data:image')) {
            try { finalImageUrl = await window.PARKS_DB._uploadBase64ToStorage(currentItiImage); } catch(e) { console.error(e); }
        }

        var iti = { title: title, location: locationStr, description: desc, image: finalImageUrl, waypoints: currentItiWaypoints };
        if(editingItiIndex >= 0) itinerariesList[editingItiIndex] = iti;
        else itinerariesList.push(iti);
        
        window.PARKS_DB.save('parks_itineraries', itinerariesList, function(success) {
            saveBtn.innerHTML = originalBtnHtml;
            saveBtn.disabled = false;
            if(success) {
                alert("Itinerario salvato correttamente!");
                closeItineraryEditor();
                renderAdminItineraries();
            } else { alert("Errore durante il salvataggio."); }
        });
    } catch(err) {
        console.error(err);
        saveBtn.innerHTML = originalBtnHtml;
        saveBtn.disabled = false;
    }
}

function deleteItinerary(idx) {
    if(!confirm('Vuoi eliminare questo itinerario?')) return;
    itinerariesList.splice(idx, 1);
    window.PARKS_DB.save('parks_itineraries', itinerariesList, function() {
        renderAdminItineraries();
    });
}

function closeItineraryEditor() {
    document.getElementById('itinerary-editor-modal').style.display = 'none';
}
