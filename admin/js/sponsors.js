/**
 * PARKS - Sponsors & Partners Management Module
 */

var curSpTab = 'sponsors';
var curSpEditType = null;
var curSpEditItem = null;
var curSpEditIndex = -1;

var SP_TIERS = {
    sponsors: [
        { value: 'gold', label: 'GOLD', color: '#FFD700', bg: 'rgba(255,215,0,0.15)' },
        { value: 'silver', label: 'SILVER', color: '#C0C0C0', bg: 'rgba(192,192,192,0.15)' },
        { value: 'bronze', label: 'BRONZE', color: '#CD7F32', bg: 'rgba(205,127,50,0.15)' }
    ],
    partners: [
        { value: 'strategico', label: 'STRATEGICO', color: '#4CAF50', bg: 'rgba(76,175,80,0.15)' },
        { value: 'promozionale', label: 'PROMOZIONALE', color: '#2196F3', bg: 'rgba(33,150,243,0.15)' },
        { value: 'tecnico', label: 'TECNICO', color: '#9C27B0', bg: 'rgba(156,39,176,0.15)' }
    ]
};

var SP_COMMITMENTS = ['FINANZIARIO', 'PROMOZIONALE', 'TECNICO', 'LOGISTICO', 'MEDIA', 'ISTITUZIONALE'];

function getTierInfo(type, value) {
    var tiers = SP_TIERS[type === 'sponsor' ? 'sponsors' : 'partners'] || [];
    return tiers.find(function(t) { return t.value === value; }) || { value: value, label: (value || '').toUpperCase(), color: '#888', bg: 'rgba(255,255,255,0.1)' };
}

// ─── RENDERING ───────────────────────────────────────────────

function renderSponsors() {
    var spZone = document.getElementById('sp-sponsors-zone');
    var ptZone = document.getElementById('sp-partners-zone');
    if (!spZone || !ptZone) return;

    var shapeSelect = document.getElementById('main-sponsor-shape-select');
    if (shapeSelect) {
        shapeSelect.value = (sponsorsPartners && sponsorsPartners.mainSponsorShape) || 'round';
    }

    var zoomInput = document.getElementById('main-sponsor-zoom');
    if (zoomInput) {
        var zoomVal = (sponsorsPartners && sponsorsPartners.mainSponsorZoom !== undefined) ? sponsorsPartners.mainSponsorZoom : 100;
        zoomInput.value = zoomVal;
        document.getElementById('zoom-val').innerText = zoomVal + '%';
    }

    var padInput = document.getElementById('main-sponsor-padding');
    if (padInput) {
        var padVal = (sponsorsPartners && sponsorsPartners.mainSponsorPadding !== undefined) ? sponsorsPartners.mainSponsorPadding : 20;
        padInput.value = padVal;
        document.getElementById('pad-val').innerText = padVal + 'px';
    }

    if (curSpTab === 'sponsors') {
        spZone.style.display = 'block';
        ptZone.style.display = 'none';
    } else {
        spZone.style.display = 'none';
        ptZone.style.display = 'block';
    }

    // Render sponsors
    var spGrid = document.getElementById('sp-sponsors-grid');
    var sponsors = (sponsorsPartners && sponsorsPartners.sponsors) || [];
    if (spGrid) {
        if (sponsors.length === 0) {
            spGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding:4rem; opacity:0.3; font-weight:700;">Nessuno sponsor presente. Aggiungi il primo!</div>';
        } else {
            spGrid.innerHTML = sponsors.map(function(sp, idx) { return renderSpCard(sp, 'sponsor', idx); }).join('');
        }
    }

    // Render partners
    var ptGrid = document.getElementById('sp-partners-grid');
    var partners = (sponsorsPartners && sponsorsPartners.partners) || [];
    if (ptGrid) {
        if (partners.length === 0) {
            ptGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding:4rem; opacity:0.3; font-weight:700;">Nessun partner presente. Aggiungi il primo!</div>';
        } else {
            ptGrid.innerHTML = partners.map(function(pt, idx) { return renderSpCard(pt, 'partner', idx); }).join('');
        }
    }

    if (window.lucide) lucide.createIcons();
}

function renderSpCard(item, type, idx) {
    var tier = getTierInfo(type, item.type);
    var hasImage = item.image && item.image.length > 0;
    var mediaCount = (item.media || []).length;

    return `
        <div onclick="editSponsorPartner('${type}', ${idx})" 
             style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:20px; overflow:hidden; cursor:pointer; transition:all 0.3s cubic-bezier(0.4,0,0.2,1); position:relative;"
             onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='${tier.color}'; this.style.boxShadow='0 15px 40px rgba(0,0,0,0.3)'"
             onmouseout="this.style.transform='none'; this.style.borderColor='rgba(255,255,255,0.08)'; this.style.boxShadow='none'">
            
            <!-- STATUS BADGE -->
            <div style="position:absolute; top:15px; right:15px; z-index:10; display:flex; gap:6px;">
                ${item.linkedItemId ? '<div style="background:rgba(0,188,212,0.2); color:#00BCD4; padding:4px 10px; border-radius:20px; font-size:9px; font-weight:900; letter-spacing:1px; border:1px solid rgba(0,188,212,0.3); display:flex; align-items:center; gap:4px;"><span style="font-size:11px; font-weight:900;">P</span> LINKED</div>' : ''}
                ${item.isActive !== false ? 
                    '<div style="background:rgba(76,175,80,0.2); color:#4CAF50; padding:4px 10px; border-radius:20px; font-size:9px; font-weight:900; letter-spacing:1px; border:1px solid rgba(76,175,80,0.3);">ATTIVO</div>' : 
                    '<div style="background:rgba(255,82,82,0.2); color:#ff5252; padding:4px 10px; border-radius:20px; font-size:9px; font-weight:900; letter-spacing:1px; border:1px solid rgba(255,82,82,0.3);">INATTIVO</div>'}
            </div>

            <!-- IMAGE / LOGO -->
            <div style="height:160px; background:linear-gradient(135deg, ${tier.bg}, rgba(0,0,0,0.4)); display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                ${hasImage ? 
                    '<img src="' + item.image + '" style="width:100%; height:100%; object-fit:' + (item.linkedItemId ? 'cover' : 'contain') + '; ' + (item.linkedItemId ? '' : 'padding:20px;') + '">' : 
                    '<i data-lucide="' + (type === 'sponsor' ? 'gem' : 'handshake') + '" style="width:50px; height:50px; opacity:0.15;"></i>'}
                <div style="position:absolute; bottom:0; left:0; right:0; height:40px; background:linear-gradient(transparent, rgba(0,0,0,0.6));"></div>
            </div>

            <!-- CONTENT -->
            <div style="padding:20px;">
                <!-- TIER BADGE -->
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
                    <span style="background:${tier.bg}; color:${tier.color}; padding:4px 12px; border-radius:8px; font-size:10px; font-weight:900; letter-spacing:2px; border:1px solid ${tier.color}40;">${tier.label}</span>
                    ${item.commitment ? '<span style="background:rgba(255,171,64,0.1); color:var(--accent); padding:4px 10px; border-radius:8px; font-size:9px; font-weight:800; letter-spacing:1px;">' + item.commitment + '</span>' : ''}
                </div>

                <!-- NAME -->
                <h3 style="margin:0 0 10px 0; font-size:1.1rem; font-weight:900; letter-spacing:2px; color:white;">${item.name || 'SENZA NOME'}</h3>

                <!-- SOURCE ORIGIN (if linked) -->
                ${item.sourceOrigin ? '<div style="margin-bottom:10px; padding:6px 10px; background:rgba(0,188,212,0.08); border-radius:8px; border:1px solid rgba(0,188,212,0.15); font-size:9px; font-weight:700; color:#00BCD4; letter-spacing:0.5px; display:flex; align-items:center; gap:6px;"><i data-lucide="link" style="width:10px; height:10px;"></i> ' + item.sourceOrigin + '</div>' : ''}

                <!-- DESCRIPTION PREVIEW -->
                ${item.description ? '<p style="margin:0 0 15px 0; font-size:11px; opacity:0.5; line-height:1.5; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">' + item.description + '</p>' : ''}

                <!-- FOOTER INFO -->
                <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05);">
                    ${item.website ? '<a href="' + item.website + '" target="_blank" onclick="event.stopPropagation()" style="color:var(--accent); font-size:10px; font-weight:800; text-decoration:none; display:flex; align-items:center; gap:5px; opacity:0.8;"><i data-lucide="external-link" style="width:12px;"></i> SITO WEB</a>' : '<span></span>'}
                    <div style="display:flex; align-items:center; gap:10px;">
                        ${mediaCount > 0 ? '<span style="font-size:9px; opacity:0.4; font-weight:700;">' + mediaCount + ' MEDIA</span>' : ''}
                        <i data-lucide="chevron-right" style="width:16px; opacity:0.3;"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ─── TAB SWITCHING ───────────────────────────────────────────

function switchSpTab(tab) {
    curSpTab = tab;
    document.getElementById('tab-sp-sponsors').className = 'kid-tab' + (tab === 'sponsors' ? ' active' : '');
    document.getElementById('tab-sp-partners').className = 'kid-tab' + (tab === 'partners' ? ' active' : '');
    renderSponsors();
}

// ─── CRUD ────────────────────────────────────────────────────

function addSponsor() {
    var name = prompt("Nome dello Sponsor:");
    if (!name) return;
    if (!sponsorsPartners.sponsors) sponsorsPartners.sponsors = [];
    sponsorsPartners.sponsors.push({
        id: 'sp_' + Date.now(),
        name: name.toUpperCase(),
        type: 'gold',
        description: '',
        website: '',
        image: '',
        media: [],
        commitment: 'FINANZIARIO',
        notes: '',
        isActive: true
    });
    saveSponsorsData();
}

function addPartner() {
    var name = prompt("Nome del Partner:");
    if (!name) return;
    if (!sponsorsPartners.partners) sponsorsPartners.partners = [];
    sponsorsPartners.partners.push({
        id: 'pt_' + Date.now(),
        name: name.toUpperCase(),
        type: 'strategico',
        description: '',
        website: '',
        image: '',
        media: [],
        commitment: 'PROMOZIONALE',
        notes: '',
        isActive: true
    });
    saveSponsorsData();
}

// ─── EDITOR ──────────────────────────────────────────────────

function editSponsorPartner(type, idx) {
    var list = type === 'sponsor' ? sponsorsPartners.sponsors : sponsorsPartners.partners;
    if (!list || !list[idx]) return;

    curSpEditType = type;
    curSpEditIndex = idx;
    curSpEditItem = list[idx];

    // Populate editor fields
    document.getElementById('sp-editor-title').innerText = (type === 'sponsor' ? '✦ MODIFICA SPONSOR' : '🤝 MODIFICA PARTNER');
    document.getElementById('sp-name').value = curSpEditItem.name || '';
    document.getElementById('sp-desc').value = curSpEditItem.description || '';
    document.getElementById('sp-website').value = curSpEditItem.website || '';
    document.getElementById('sp-notes').value = curSpEditItem.notes || '';

    // Type dropdown
    var typeSelect = document.getElementById('sp-type');
    typeSelect.innerHTML = '';
    var tiers = SP_TIERS[type === 'sponsor' ? 'sponsors' : 'partners'];
    tiers.forEach(function(t) {
        var opt = document.createElement('option');
        opt.value = t.value;
        opt.textContent = t.label;
        if (t.value === curSpEditItem.type) opt.selected = true;
        typeSelect.appendChild(opt);
    });

    // Commitment dropdown
    var commitSelect = document.getElementById('sp-commitment');
    commitSelect.innerHTML = '';
    SP_COMMITMENTS.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        if (c === curSpEditItem.commitment) opt.selected = true;
        commitSelect.appendChild(opt);
    });

    // Active toggle
    updateSpActiveToggle();

    renderSpMediaGrid();
    switchView('sponsor-editor');
}

function updateSpActiveToggle() {
    var toggleBtn = document.getElementById('sp-active-toggle');
    if (!toggleBtn || !curSpEditItem) return;
    var isActive = curSpEditItem.isActive !== false;
    toggleBtn.style.color = isActive ? '#4CAF50' : '#ff5252';
    toggleBtn.innerHTML = isActive ? 
        '<i data-lucide="toggle-right" style="width:32px; height:32px;"></i>' : 
        '<i data-lucide="toggle-left" style="width:32px; height:32px;"></i>';
    if (window.lucide) lucide.createIcons();
}

// ─── MEDIA MANAGEMENT ────────────────────────────────────────

function updateMainSponsorShape(val) {
    if (!sponsorsPartners) return;
    sponsorsPartners.mainSponsorShape = val;
    saveSponsorsData(true);
    
    var previewContainer = document.getElementById('preview-sponsor-container');
    if (previewContainer) {
        previewContainer.className = 'preview-sponsor-logo shape-' + val;
    }
}

function updateMainSponsorStyle() {
    if (!sponsorsPartners) return;
    var zoom = document.getElementById('main-sponsor-zoom').value;
    var imgZoom = document.getElementById('main-sponsor-img-zoom').value;
    sponsorsPartners.mainSponsorZoom = parseInt(zoom) || 100;
    sponsorsPartners.mainSponsorImgZoom = parseInt(imgZoom) || 100;
    saveSponsorsData(true);
    
    var previewContainer = document.getElementById('preview-sponsor-container');
    if (previewContainer) {
        previewContainer.style.setProperty('--zoom', sponsorsPartners.mainSponsorZoom / 100);
        previewContainer.style.setProperty('--img-zoom', sponsorsPartners.mainSponsorImgZoom / 100);
        previewContainer.style.padding = '0px'; // Reset padding since we zoom now
    }
}

function renderSpMediaGrid() {
    var container = document.getElementById('sp-media-grid');
    if (!container || !curSpEditItem) return;

    // Logo preview
    var logoPreview = document.getElementById('sp-logo-preview');
    if (logoPreview) {
        if (curSpEditItem.image) {
            logoPreview.innerHTML = '<img src="' + curSpEditItem.image + '" style="width:100%; height:100%; object-fit:contain;">';
        } else {
            logoPreview.innerHTML = '<i data-lucide="image-plus" style="width:30px; height:30px; opacity:0.2;"></i>';
        }
    }

    // Media grid
    container.innerHTML = (curSpEditItem.media || []).map(function(m, idx) {
        var url = typeof m === 'object' ? m.url : m;
        var name = typeof m === 'object' ? m.name : '';
        var isPdf = (typeof m === 'object' && m.type === 'application/pdf');
        var isVideo = (typeof m === 'object' && (m.type === 'video/mp4' || (m.type && m.type.startsWith('video/'))));

        return '<div class="photo-box" ' + ((isPdf || isVideo) ? 'onclick="openDoc(\'' + url + '\', \'' + name + '\')"' : '') + '>' +
            (isPdf ? 
                '<div class="pdf-icon" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; background:rgba(255,82,82,0.1);"><i data-lucide="file-text" style="width:24px;"></i><span style="font-size:8px; margin-top:4px;">' + (name || 'PDF') + '</span></div>' :
                (isVideo ? 
                    '<video src="' + url + '" muted style="width:100%; height:100%; object-fit:cover;"></video>' :
                    '<img src="' + url + '" style="width:100%; height:100%; object-fit:cover;">')) +
            '<button class="photo-del" onclick="event.stopPropagation(); deleteSpMedia(' + idx + ')">×</button>' +
        '</div>';
    }).join('');

    if (window.lucide) lucide.createIcons();
}

async function uploadSpLogo(e) {
    var file = e.target.files[0];
    if (!file) return;
    var preview = document.getElementById('sp-logo-preview');
    if (preview) preview.style.opacity = '0.3';
    try {
        var cloudUrl = await window.PARKS_DB.uploadFile(file);
        curSpEditItem.image = cloudUrl;
        renderSpMediaGrid();
    } catch (err) {
        console.error("Upload logo error:", err);
        alert("Errore durante il caricamento del logo.");
    } finally {
        if (preview) preview.style.opacity = '1';
        e.target.value = '';
    }
}

async function uploadMainSponsorLogo(e) {
    var file = e.target.files[0];
    if (!file) return;
    try {
        var cloudUrl = await window.PARKS_DB.uploadFile(file);
        sponsorsPartners.mainSponsorLogo = cloudUrl;
        saveSponsorsData();
        
        var previewImg = document.getElementById('preview-sponsor-img');
        if (previewImg) previewImg.src = cloudUrl;
        
        alert("Logo principale aggiornato con successo!");
    } catch (err) {
        console.error("Upload main sponsor logo error:", err);
        alert("Errore durante il caricamento del logo principale.");
    } finally {
        e.target.value = '';
    }
}

async function uploadSpMedia(e) {
    var files = Array.from(e.target.files);
    if (files.length === 0) return;
    var section = document.getElementById('sp-media-section');
    if (section) section.style.opacity = '0.5';
    for (var i = 0; i < files.length; i++) {
        try {
            var cloudUrl = await window.PARKS_DB.uploadFile(files[i]);
            if (!curSpEditItem.media) curSpEditItem.media = [];
            curSpEditItem.media.push({ url: cloudUrl, name: files[i].name.toUpperCase(), type: files[i].type });
        } catch (err) {
            alert("Errore caricamento " + files[i].name);
        }
    }
    if (section) section.style.opacity = '1';
    renderSpMediaGrid();
    e.target.value = '';
}

function deleteSpMedia(idx) {
    if (confirm("Eliminare questo media?")) {
        curSpEditItem.media.splice(idx, 1);
        renderSpMediaGrid();
    }
}

// ─── TOGGLE ACTIVE ───────────────────────────────────────────

function toggleSpActive() {
    if (!curSpEditItem) return;
    curSpEditItem.isActive = !(curSpEditItem.isActive !== false);
    updateSpActiveToggle();
}

// ─── SAVE / DELETE ───────────────────────────────────────────

function saveSponsorPartner() {
    if (!curSpEditItem) return;
    curSpEditItem.name = (document.getElementById('sp-name').value || '').toUpperCase();
    curSpEditItem.type = document.getElementById('sp-type').value;
    curSpEditItem.commitment = document.getElementById('sp-commitment').value;
    curSpEditItem.description = document.getElementById('sp-desc').value;
    curSpEditItem.website = document.getElementById('sp-website').value;
    curSpEditItem.notes = document.getElementById('sp-notes').value;
    saveSponsorsData();
    switchView('sponsors');
}

function deleteSponsorPartner() {
    if (!confirm("ELIMINARE QUESTO SOGGETTO E TUTTI I SUOI CONTENUTI?")) return;
    var list = curSpEditType === 'sponsor' ? sponsorsPartners.sponsors : sponsorsPartners.partners;
    list.splice(curSpEditIndex, 1);
    saveSponsorsData();
    switchView('sponsors');
}

function saveSponsorsData(silent) {
    window.PARKS_DB.save('parks_sponsors_partners', sponsorsPartners, function() {
        if (!silent) renderSponsors();
    });
}

// ─── SYNC PARTNERS FROM LIBRARY / VISIT NAMIBIA ──────────────

function syncPartnersFromLibrary() {
    var sources = [
        { data: window.library, label: 'LIBRERIA' },
        { data: window.visitNamibia, label: 'VISIT NAMIBIA' }
    ];

    if (!sponsorsPartners.partners) sponsorsPartners.partners = [];

    var found = 0;
    var created = 0;
    var updated = 0;

    sources.forEach(function(source) {
        if (!source.data || !source.data.categories) return;
        source.data.categories.forEach(function(cat) {
            (cat.subcategories || []).forEach(function(sub) {
                (sub.items || []).forEach(function(item) {
                    if (!item.isPartner) return;
                    found++;

                    // Check if already linked
                    var linkedId = item.id;
                    var existing = sponsorsPartners.partners.find(function(p) { return p.linkedItemId === linkedId; });

                    // Get first image from photos
                    var mainImage = '';
                    var mediaItems = [];
                    if (item.photos && item.photos.length > 0) {
                        var first = item.photos[0];
                        mainImage = (typeof first === 'object') ? first.url : first;
                        // Import all remaining photos as media
                        for (var i = 1; i < item.photos.length; i++) {
                            var p = item.photos[i];
                            mediaItems.push({
                                url: typeof p === 'object' ? p.url : p,
                                name: typeof p === 'object' ? p.name : ('FOTO ' + (i + 1)),
                                type: typeof p === 'object' ? (p.type || 'image/jpeg') : 'image/jpeg'
                            });
                        }
                    }

                    var origin = source.label + ' → ' + cat.name + ' → ' + sub.name;

                    if (existing) {
                        // Update existing partner with latest data from library
                        existing.name = item.name;
                        existing.description = item.description || existing.description;
                        existing.image = mainImage || existing.image;
                        existing.sourceOrigin = origin;
                        existing.lat = item.lat || existing.lat;
                        existing.lng = item.lng || existing.lng;
                        // Only update media if the existing partner has no manual media yet
                        if ((!existing.media || existing.media.length === 0) && mediaItems.length > 0) {
                            existing.media = mediaItems;
                        }
                        updated++;
                    } else {
                        // Create new partner from library item
                        sponsorsPartners.partners.push({
                            id: 'pt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                            linkedItemId: linkedId,
                            sourceOrigin: origin,
                            name: item.name,
                            type: 'strategico',
                            description: item.description || '',
                            website: '',
                            image: mainImage,
                            media: mediaItems,
                            commitment: 'PROMOZIONALE',
                            notes: 'Importato automaticamente da: ' + origin,
                            isActive: true,
                            lat: item.lat || '',
                            lng: item.lng || ''
                        });
                        created++;
                    }
                });
            });
        });
    });

    if (found === 0) {
        alert("Nessun elemento contrassegnato come Partner (P) trovato nella Libreria o Visit Namibia.\n\nVai nella Libreria, apri una scheda (es. un Hotel) e clicca sul pulsante P per contrassegnarlo.");
        return;
    }

    saveSponsorsData();
    alert("SINCRONIZZAZIONE COMPLETATA!\n\n" +
        "• Elementi con P trovati: " + found + "\n" +
        "• Nuovi Partner creati: " + created + "\n" +
        "• Partner aggiornati: " + updated);
}
