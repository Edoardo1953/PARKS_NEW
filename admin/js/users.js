/**
 * PARKS - Users & Tourists Management Module
 */

function renderUsers() {
    var container = document.getElementById('users-container');
    if(!container) return;
    container.innerHTML = users.map(u => `
        <div class="db-section" style="padding:1.5rem; position:relative; background: ${u.role === 'SUPER_ADMIN' ? 'rgba(255,171,64,0.08)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${u.role === 'SUPER_ADMIN' ? 'var(--accent)' : 'rgba(255,171,64,0.2)'};">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:1.5rem;">
                <div style="width:40px; height:40px; border-radius:10px; background:${u.role === 'SUPER_ADMIN' ? 'var(--accent)' : (u.role === 'ADMIN' ? 'var(--primary-green)' : '#666')}; display:flex; align-items:center; justify-content:center; color:#000;">
                    <i data-lucide="${u.role === 'SUPER_ADMIN' ? 'shield-alert' : (u.role === 'ADMIN' ? 'shield-check' : 'user')}" style="width:20px;"></i>
                </div>
                <div style="flex:1;">
                    <input type="text" value="${u.name}" onchange="updateUser('${u.id}', 'name', this.value)" style="background:none; border:none; color:white; font-weight:900; font-size:14px; width:100%; outline:none;" ${u.role === 'SUPER_ADMIN' ? 'readonly' : ''}>
                    <div style="font-size:9px; font-weight:900; color:var(--accent); letter-spacing:1px; margin-top:2px;">${u.role.replace('_', ' ')}</div>
                </div>
                ${u.role !== 'SUPER_ADMIN' ? `<button onclick="delUser('${u.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i data-lucide="trash-2" style="width:16px;"></i></button>` : ''}
            </div>
            <div class="input-group">
                <span class="label">PASSWORD ACCESSO</span>
                <input type="text" value="${u.password}" onchange="updateUser('${u.id}', 'password', this.value)" class="f-input" style="padding:8px 12px; font-size:11px; font-family:monospace; letter-spacing:2px; font-weight:900;">
            </div>
            <div class="input-group">
                <span class="label">TIPO ACCESSO / PERMESSI</span>
                <select onchange="updateUser('${u.id}', 'permissions', this.value)" class="f-input" style="padding:8px 12px; font-size:11px; font-weight:800; cursor:pointer;" ${u.role === 'SUPER_ADMIN' ? 'disabled' : ''}>
                    <option value="MODIFICA" ${u.permissions === 'MODIFICA' ? 'selected' : ''}>MODIFICA COMPLETA</option>
                    <option value="SOLO VISTA" ${u.permissions === 'SOLO VISTA' ? 'selected' : ''}>SOLO VISUALIZZAZIONE</option>
                    <option value="RESTRETTO" ${u.permissions === 'RESTRETTO' ? 'selected' : ''}>ACCESSO LIMITATO</option>
                    ${u.role === 'SUPER_ADMIN' ? '<option value="TOTALE" selected>CONTROLLO TOTALE</option>' : ''}
                </select>
            </div>
            <div class="input-group" style="margin-bottom:0;">
                <span class="label">SCADENZA ACCESSO</span>
                ${u.role === 'SUPER_ADMIN' ? 
                    '<div style="font-size:11px; font-weight:900; color:var(--primary-green); padding:10px 0;">ACCESSO ILLIMITATO</div>' : 
                    `<input type="date" value="${u.expiry || ''}" onchange="updateUser('${u.id}', 'expiry', this.value)" class="f-input" style="padding:8px 12px; font-size:11px; font-weight:800; cursor:pointer;">`
                }
            </div>
        </div>
    `).join('');
    lucide.createIcons();
    renderTourists();
}

function addUser() {
    var name = prompt("Nome Utente:");
    if(!name) return;
    var role = prompt("Ruolo (ADMIN o USER):");
    if(!role || (role.toUpperCase() !== 'ADMIN' && role.toUpperCase() !== 'USER')) { alert("Ruolo non valido."); return; }
    users.push({ id: 'u_' + Date.now(), name: name.toUpperCase(), role: role.toUpperCase(), password: Math.random().toString(36).slice(-6).toUpperCase(), permissions: role.toUpperCase() === 'ADMIN' ? 'MODIFICA' : 'SOLO VISTA' });
    saveUsers();
}

function updateUser(id, key, val) { 
    var u = users.find(x => x.id === id); 
    if(u) { 
        u[key] = (key === 'expiry') ? val : val.toUpperCase(); 
        window.PARKS_DB.save('parks_users', users);
    } 
}
function delUser(id) { if(confirm("Eliminare utente?")) { users = users.filter(u => u.id !== id); saveUsers(); } }
function saveUsers() { window.PARKS_DB.save('parks_users', users, renderUsers); }

function updateTouristExpiry(id, val) {
    var t = tourists.find(x => x.id === id);
    if(t) {
        t.expiry = val;
        window.PARKS_DB.save('parks_tourists', tourists);
    }
}

function updateTouristRepertorio(id, val) {
    var t = tourists.find(x => x.id === id);
    if(t) {
        t.repertorio = val;
        window.PARKS_DB.save('parks_tourists', tourists);
    }
}

function genRepertorio(id) {
    var t = tourists.find(x => x.id === id);
    if(t) {
        t.repertorio = Math.floor(100000000 + Math.random() * 900000000).toString();
        renderTourists();
        window.PARKS_DB.save('parks_tourists', tourists);
    }
}

function renderTourists() {
    var container = document.getElementById('tourists-container');
    if(!container) return;
    if(!tourists || tourists.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; padding:4rem; text-align:center; opacity:0.3; font-weight:700;">NESSUN TURISTA REGISTRATO</div>';
        return;
    }
    container.innerHTML = tourists.map(t => `
        <div class="db-section" style="padding:1.5rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:20px; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px;">
                <div style="font-weight:900; font-size:13px; color:var(--accent);">${(t.name || 'Senza Nome').toUpperCase()} ${(t.surname || '').toUpperCase()}</div>
                <div style="display:flex; gap:10px;">
                    <button onclick="editTourist('${t.id}')" style="background:none; border:none; color:white; opacity:0.4; cursor:pointer;"><i data-lucide="edit-2" style="width:14px;"></i></button>
                    <button onclick="delTourist('${t.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i data-lucide="trash-2" style="width:14px;"></i></button>
                </div>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                <div style="font-size:10px; opacity:0.6;">DOC: <b style="color:white; opacity:1;">${t.docType || 'N/D'} ${t.docNumber || ''}</b></div>
                <div style="font-size:10px; opacity:0.6;">NAZ: <b style="color:white; opacity:1;">${t.nationality || 'N/D'}</b></div>
                <div style="font-size:10px; opacity:0.6;">SCADENZA: <input type="date" value="${t.expiry || ''}" onchange="updateTouristExpiry('${t.id}', this.value)" style="background:none; border:none; color:var(--danger); font-size:10px; font-weight:900; cursor:pointer; width:90px; outline:none;"></div>
                <div style="font-size:10px; opacity:0.6; display:flex; align-items:center; gap:5px;">
                    REP: <input type="text" value="${t.repertorio || ''}" onchange="updateTouristRepertorio('${t.id}', this.value)" style="background:none; border:none; color:var(--primary-green); font-size:10px; font-weight:900; width:80px; outline:none;">
                    <button onclick="genRepertorio('${t.id}')" style="background:none; border:none; color:var(--accent); cursor:pointer; padding:0;"><i data-lucide="refresh-cw" style="width:10px;"></i></button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function delTourist(id) {
    if(confirm("Eliminare turista?")) {
        tourists = tourists.filter(t => t.id !== id);
        window.PARKS_DB.save('parks_tourists', tourists, renderTourists);
    }
}

function editTourist(id) {
    var t = tourists.find(x => x.id === id);
    if(!t) return;
    
    curEditItem = t; // Use the same global for consistency
    document.getElementById('edit-tourist-header').innerText = "MODIFICA: " + (t.name || '').toUpperCase();
    document.getElementById('et-firstName').value = t.name || '';
    document.getElementById('et-lastName').value = t.surname || '';
    document.getElementById('et-email').value = t.email || '';
    document.getElementById('et-phone').value = t.phone || '';
    document.getElementById('et-address').value = t.address || '';
    document.getElementById('et-city').value = t.city || '';
    document.getElementById('et-country').value = t.country || '';
    document.getElementById('et-nationality').value = t.nationality || '';
    document.getElementById('et-postalCode').value = t.postalCode || '';
    document.getElementById('et-repertorio').value = t.repertorio || '';
    document.getElementById('et-expiry').value = t.expiry || '';
    document.getElementById('et-dob').value = t.dob || '';
    document.getElementById('et-password').value = t.password || '';

    switchView('tourist-editor');
}

async function saveTouristEdit() {
    if(!curEditItem) return;
    const t = curEditItem;
    t.name = document.getElementById('et-firstName').value.toUpperCase();
    t.surname = document.getElementById('et-lastName').value.toUpperCase();
    t.email = document.getElementById('et-email').value;
    t.phone = document.getElementById('et-phone').value;
    t.address = document.getElementById('et-address').value.toUpperCase();
    t.city = document.getElementById('et-city').value.toUpperCase();
    t.country = document.getElementById('et-country').value.toUpperCase();
    t.nationality = document.getElementById('et-nationality').value.toUpperCase();
    t.postalCode = document.getElementById('et-postalCode').value;
    t.repertorio = document.getElementById('et-repertorio').value;
    t.expiry = document.getElementById('et-expiry').value;
    t.dob = document.getElementById('et-dob').value;
    t.password = document.getElementById('et-password').value;

    window.PARKS_DB.save('parks_tourists', tourists, function() {
        alert("Dati turista salvati!");
        switchView('users');
        switchUserTab('tourist');
    });
}
function switchUserTab(tab) {
    document.querySelectorAll('#view-users .t-btn').forEach(b => b.classList.remove('active'));
    
    // Support both ID naming conventions
    const btn = document.getElementById('tab-sys-users') || document.getElementById('t-users');
    const tBtn = document.getElementById('tab-tourists') || document.getElementById('t-tourists');
    const fBtn = document.getElementById('tab-fiches');

    if(tab === 'sys') { if(btn) btn.classList.add('active'); }
    if(tab === 'tourist') { if(tBtn) tBtn.classList.add('active'); }
    if(tab === 'fiche') { if(fBtn) fBtn.classList.add('active'); }

    document.getElementById('users-container').style.display = (tab === 'sys') ? 'grid' : 'none';
    document.getElementById('tourists-container').style.display = (tab === 'tourist') ? 'flex' : 'none';
    document.getElementById('fiches-container').style.display = (tab === 'fiche') ? 'flex' : 'none';

    const opsBtn = document.getElementById('user-ops-btn');
    if(opsBtn) opsBtn.style.display = (tab === 'sys') ? 'block' : 'none';

    if(tab === 'sys') renderUsers();
    if(tab === 'tourist') renderTourists();
    if(tab === 'fiche') renderFiches();
}

function renderFiches() {
    const list = document.getElementById('fiches-table')?.querySelector('tbody');
    if(!list) return;
    
    const fName = document.getElementById('filter-name')?.value.toUpperCase() || "";
    const fContact = document.getElementById('filter-contact')?.value.toUpperCase() || "";
    const fCountry = document.getElementById('filter-country')?.value.toUpperCase() || "";

    const filtered = tourists.filter(t => {
        const nameMatch = (t.name + ' ' + t.surname).toUpperCase().includes(fName);
        const contactMatch = (t.email + ' ' + t.phone).toUpperCase().includes(fContact);
        const countryMatch = (t.city + ' ' + t.country).toUpperCase().includes(fCountry);
        return nameMatch && contactMatch && countryMatch;
    });

    if(filtered.length === 0) {
        list.innerHTML = '<tr><td colspan="5" style="padding:3rem; text-align:center; opacity:0.3;">NESSUN RISULTATO CORRISPONDENTE</td></tr>';
        return;
    }

    list.innerHTML = filtered.map(t => `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05); font-size:11px;">
            <td style="padding:15px;">
                <div style="font-weight:900;">${(t.name || '').toUpperCase()} ${(t.surname || '').toUpperCase()}</div>
                <div style="font-size:9px; opacity:0.5;">ID: ${t.id}</div>
            </td>
            <td style="padding:15px;">
                <div>${t.email || '-'}</div>
                <div style="opacity:0.6;">${t.phone || '-'}</div>
            </td>
            <td style="padding:15px;">
                <div>${(t.city || '-').toUpperCase()}</div>
                <div style="opacity:0.6;">${(t.country || '-').toUpperCase()}</div>
            </td>
            <td style="padding:15px;">
                <span style="background:rgba(255,171,64,0.1); color:var(--accent); padding:4px 10px; border-radius:6px; font-weight:900;">${t.repertorio || '-'}</span>
            </td>
            <td style="padding:15px; text-align:right;">
                <button onclick="editTourist('${t.id}')" style="background:var(--accent); color:black; border:none; padding:6px 12px; border-radius:8px; font-size:10px; font-weight:900; cursor:pointer;">APRI SCHEDA</button>
            </td>
        </tr>
    `).join('');
}

// Ensure the tourists-list tbody is also populated when in tourist tab
// The HTML uses a table for tourists in some versions and a grid in others.
// I will support both by updating renderTourists to also check for tourists-list tbody.
const originalRenderTourists = renderTourists;
renderTourists = function() {
    originalRenderTourists();
    const list = document.getElementById('tourists-list');
    if(!list) return;
    list.innerHTML = tourists.map(t => `
        <tr style="border-bottom:1px solid rgba(255,255,255,0.05); font-size:11px;">
            <td style="padding:15px;"><b>${(t.name || '').toUpperCase()} ${(t.surname || '').toUpperCase()}</b></td>
            <td style="padding:15px;">${t.email || '-'} / ${t.phone || '-'}</td>
            <td style="padding:15px;"><code style="color:var(--accent);">${t.password || '****'}</code></td>
            <td style="padding:15px;">${t.repertorio || '-'}</td>
            <td style="padding:15px;"><span style="color:${t.expiry && new Date(t.expiry) < new Date() ? 'var(--danger)' : 'var(--primary-green)'}">${t.expiry || 'N/D'}</span></td>
            <td style="padding:15px;">
                <button onclick="editTourist('${t.id}')" style="background:none; border:none; color:white; opacity:0.4;"><i data-lucide="edit-2" style="width:14px;"></i></button>
            </td>
        </tr>
    `).join('');
    if(window.lucide) lucide.createIcons();
}
