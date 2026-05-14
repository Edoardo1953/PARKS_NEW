/**
 * PARKS - Dashboard & Live Monitoring Module
 */

var dashMap = null;
var alertMarkersLayer = null;

function initDashboardMap() {
    if(dashMap) {
        setTimeout(() => dashMap.invalidateSize(), 100);
        return;
    }
    
    dashMap = L.map('dashboard-map', {
        scrollWheelZoom: true,
        zoomControl: true
    }).setView([-18.75, 15.5], 9);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    }).addTo(dashMap);

    // Usa MarkerClusterGroup per gestire marker sovrapposti
    alertMarkersLayer = L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 16
    }).addTo(dashMap);

    refreshMonitorData();
    setInterval(refreshMonitorData, 5000);
}

function refreshMonitorData() {
    if(!dashMap || !alertMarkersLayer) return;

    window.PARKS_DB.get('parks_library_v2', {}, function(data) {
        if(!data || !data.map_markers) return;

        const alerts = data.map_markers.filter(m => m.type === 'alert');
        const mustSees = data.map_markers.filter(m => m.type === 'must_see');
        
        // Aggiorna widget statistiche
        const statTourists = document.getElementById('stat-tourists');
        const statDevices = document.getElementById('stat-devices');
        const statAlerts = document.getElementById('stat-alerts');

        if(statTourists) statTourists.innerText = (window.tourists || []).length;
        if(statDevices) statDevices.innerText = (window.tourists || []).filter(t => t.passActive).length;
        if(statAlerts) {
            statAlerts.innerText = alerts.length + mustSees.length;
            statAlerts.style.color = alerts.length > 0 ? '#ff5252' : 'var(--accent)';
        }

        // Aggiorna Log Testuale
        const log = document.getElementById('alerts-log');
        if(log) {
            const allRecent = [...alerts, ...mustSees].sort((a,b) => b.timestamp - a.timestamp);
            
            if(allRecent.length === 0) {
                log.innerHTML = '<div style="opacity:0.3; text-align:center; padding:10px;">Nessuna segnalazione recente</div>';
            } else {
                log.innerHTML = allRecent.map(a => `
                    <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; border-left:3px solid ${a.type === 'alert' ? '#ff5252' : '#4caf50'}; margin-bottom:5px;">
                        <div style="flex:1;">
                            <div style="font-weight:900; color:var(--accent);">${a.title}</div>
                            <div style="opacity:0.5; font-size:9px;">${a.type.toUpperCase()} • T. N. ${a.touristNumber || '?'} • ${new Date(a.timestamp).toLocaleTimeString()}</div>
                        </div>
                        <div style="display:flex; gap:5px;">
                            <button onclick="goToAlert(${a.lat}, ${a.lng})" title="Centra sulla mappa" style="background:rgba(255,171,64,0.1); border:none; color:var(--accent); padding:5px; border-radius:5px; cursor:pointer;"><i data-lucide="search" style="width:14px;"></i></button>
                            <button onclick="deleteAlert(${a.id})" title="Elimina" style="background:rgba(255,82,82,0.1); border:none; color:#ff5252; padding:5px; border-radius:5px; cursor:pointer;"><i data-lucide="trash-2" style="width:14px;"></i></button>
                        </div>
                    </div>
                `).join('');
                if(window.lucide) lucide.createIcons();
            }
        }

        // Aggiorna Mappa
        alertMarkersLayer.clearLayers();
        const markers = [];
        [...alerts, ...mustSees].forEach((alert) => {
            const lat = parseFloat(alert.lat);
            const lng = parseFloat(alert.lng);
            if(isNaN(lat) || isNaN(lng)) return;

            const isAlert = alert.type === 'alert';
            const color = isAlert ? '#ff5252' : '#4caf50';

            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `
                    <div style="display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.8); padding:5px 12px; border-radius:20px; border:2px solid ${color}; box-shadow:0 0 15px ${isAlert ? 'rgba(255,0,0,0.3)' : 'rgba(0,255,0,0.3)'}; white-space:nowrap;">
                        <img src="${alert.icon}" style="width:24px; height:24px; border-radius:50%;">
                        <div style="color:white; font-size:10px; font-weight:900; line-height:1.1;">
                            ${alert.title}<br>
                            <span style="font-size:7px; color:${isAlert ? '#ffab40' : '#81c784'};">${isAlert ? 'ALERT' : 'MUST SEE'} N. ${alert.touristNumber || '?'}</span>
                        </div>
                    </div>
                `,
                iconSize: [180, 40],
                iconAnchor: [15, 20]
            });

            const m = L.marker([lat, lng], { icon: icon })
                .bindPopup(`
                    <div style="min-width:180px;">
                        <strong style="color:${color};">${isAlert ? 'ALLERTA RANGERS' : 'PUNTO DI INTERESSE'}</strong><br>
                        <div style="margin:5px 0; font-weight:800;">${alert.title}</div>
                        <div style="font-size:10px; margin-bottom:5px;">Inviato da: <strong>Turista N. ${alert.touristNumber || '?'}</strong></div>
                        <span style="font-size:9px; opacity:0.5;">Inviato: ${new Date(alert.timestamp).toLocaleString()}</span>
                        <hr style="border:none; border-top:1px solid rgba(0,0,0,0.1); margin:10px 0;">
                        <button onclick="deleteAlert(${alert.id})" style="width:100%; background:${color}; color:white; border:none; padding:8px; border-radius:5px; font-size:10px; font-weight:900; cursor:pointer;">CHIUDI SEGNALAZIONE</button>
                    </div>
                `);
            markers.push(m);
        });

        if(markers.length > 0) {
            if(alertMarkersLayer.addLayers) alertMarkersLayer.addLayers(markers);
            else markers.forEach(m => m.addTo(alertMarkersLayer));
        }
    });
}

function goToAlert(lat, lng) {
    if(!dashMap) return;
    dashMap.setView([lat, lng], 15);
}

function deleteAlert(id) {
    if(!confirm("Vuoi segnare questa segnalazione come conclusa?")) return;
    window.PARKS_DB.get('parks_library_v2', {}, function(data) {
        if(!data || !data.map_markers) return;
        data.map_markers = data.map_markers.filter(m => m.id !== id);
        window.PARKS_DB.save('parks_library_v2', data, function() {
            refreshMonitorData();
        });
    });
}
