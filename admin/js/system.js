/**
 * PARKS - System Management Module (Backup, Restore, Cloud Sync)
 */

function exportBackup() {
    var fullData = {
        parks_itineraries: window.itinerariesList || [],
        parks_users: window.users || [],
        parks_tourists: window.tourists || [],
        parks_library_v2: window.library || {},
        parks_visit_namibia_v1: window.visitNamibia || {},
        parks_home_v1: (typeof homeContent !== 'undefined' ? homeContent : {}),
        parks_gallery: (typeof gallery !== 'undefined' ? gallery : []),
        parks_kids_drawings: window.kidsDrawings || [],
        parks_kids_memory_v2: window.memoryGames || [],
        parks_kids_quiz: window.kidsQuiz || [],
        parks_kids_puzzles: window.kidsPuzzles || [],
        timestamp: Date.now()
    };
    
    var blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'PARKS_FULL_BACKUP_' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importBackup(event) {
    var file = event.target.files[0];
    if(!file) return;
    
    if(!confirm("ATTENZIONE: Il ripristino sovrascriverà tutti i dati. Procedere?")) {
        event.target.value = '';
        return;
    }

    var loader = document.createElement('div');
    loader.id = 'bulk-import-loader';
    loader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:100000;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:sans-serif;color:#fff;text-align:center;padding:20px;backdrop-filter:blur(10px);';
    
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var data = JSON.parse(e.target.result);
            var keys = Object.keys(data).filter(k => k.startsWith('parks_'));
            var total = keys.length;
            
            if(total === 0) {
                alert("Il file non sembra contenere dati validi.");
                loader.remove();
                return;
            }

            var checklistHtml = keys.map(k => `
                <div id="check-${k}" style="display:flex; justify-content:space-between; align-items:center; padding:10px 15px; background:rgba(255,255,255,0.03); margin-bottom:5px; border-radius:10px; border:1px solid rgba(255,255,255,0.05); font-size:12px; font-weight:700;">
                    <span>${k.replace('parks_', '').toUpperCase()}</span>
                    <span class="status-icon" style="opacity:0.3;">⏳</span>
                </div>
            `).join('');

            loader.innerHTML = `
                <div style="background:rgba(20,20,20,0.95); padding:40px; border-radius:30px; border:1px solid rgba(255,255,255,0.1); box-shadow:0 25px 50px rgba(0,0,0,0.5); max-width:500px; width:95%; max-height:80vh; overflow-y:auto;">
                    <h2 style="margin-bottom:5px; color:#ffab40; letter-spacing:2px; font-size:18px;">RIPRISTINO SISTEMA</h2>
                    <div id="import-checklist-container" style="text-align:left; margin-bottom:20px;">${checklistHtml}</div>
                    <div id="bulk-progress-text" style="font-size:13px; color:#ffab40; font-weight:800; margin-top:20px;">Preparazione...</div>
                </div>
            `;
            document.body.appendChild(loader);

            function saveNext(index) {
                if(index >= total) {
                    loader.remove();
                    alert("RIPRISTINO COMPLETATO!");
                    location.reload();
                    return;
                }
                
                var key = keys[index];
                var rawData = data[key];
                var targetKey = key;

                if(key === 'parks_home_content') targetKey = 'parks_home_v1';
                
                var progText = document.getElementById('bulk-progress-text');
                if(progText) progText.innerHTML = 'Salvataggio: ' + targetKey.replace('parks_', '').toUpperCase();

                window.PARKS_DB.save(targetKey, rawData, function() {
                    var checkIcon = document.querySelector('#check-' + key + ' .status-icon');
                    if(checkIcon) { checkIcon.innerHTML = '✅'; checkIcon.style.opacity = '1'; }
                    saveNext(index + 1);
                }, true);
            }
            saveNext(0);
        } catch(err) {
            alert("Errore: " + err.message);
            loader.remove();
        }
    };
    reader.readAsText(file);
}

function exitAndBackup() {
    exportBackup();
    setTimeout(() => { location.href = '../user/index.html'; }, 1000);
}

function clearLocalCache() {
    if (confirm("Svuotare la memoria temporanea?")) {
        const DB_NAME = 'PARKS_FINAL_STORAGE';
        window.indexedDB.deleteDatabase(DB_NAME);
        window.location.reload();
    }
}

async function pushLocalToCloud() {
    if(!confirm("Sovrascrivere il Cloud con i dati locali?")) return;
    
    var loader = document.createElement('div');
    loader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:100000;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:sans-serif;color:#fff;text-align:center;padding:20px;backdrop-filter:blur(10px);';
    loader.innerHTML = `<div style="background:rgba(255,255,255,0.05); padding:40px; border-radius:30px; border:1px solid rgba(255,255,255,0.1);"><h2 id="push-progress-text">Inizializzazione...</h2></div>`;
    document.body.appendChild(loader);
    var progText = document.getElementById('push-progress-text');

    var keys = [
        'parks_itineraries', 'parks_users', 'parks_tourists', 
        'parks_library_v2', 'parks_visit_namibia_v1', 'parks_home_v1', 
        'parks_gallery', 'parks_kids_drawings', 'parks_kids_memory_v2', 
        'parks_kids_quiz', 'parks_kids_puzzles'
    ];

    for(let key of keys) {
        progText.innerText = "Invio " + key.toUpperCase() + "...";
        let data = window[key.replace('parks_', '').replace('_v1','').replace('_v2','')]; 
        // Fallback mapping
        if(key === 'parks_itineraries') data = window.itinerariesList;
        if(key === 'parks_home_v1') data = window.homeContent;
        if(key === 'parks_kids_memory_v2') data = window.memoryGames;
        
        if(data && window.firebase) {
            await firebase.database().ref(key).set(data);
        }
    }
    loader.remove();
    alert("Cloud aggiornato!");
}

function cloudRecovery() {
    if(!confirm("ATTENZIONE: Recuperando i dati dal Cloud sovrascriverai TUTTI i dati locali. Continuare?")) return;
    
    var loader = document.createElement('div');
    loader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:100000;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:sans-serif;color:#fff;text-align:center;padding:20px;backdrop-filter:blur(10px);';
    loader.innerHTML = `<div style="background:rgba(255,255,255,0.05); padding:40px; border-radius:30px; border:1px solid rgba(255,255,255,0.1);"><h2 id="recovery-progress-text">Inizializzazione recupero...</h2></div>`;
    document.body.appendChild(loader);
    var progText = document.getElementById('recovery-progress-text');

    var keys = [
        'parks_itineraries', 'parks_users', 'parks_tourists', 
        'parks_library_v2', 'parks_visit_namibia_v1', 'parks_home_v1', 
        'parks_gallery', 'parks_kids_drawings', 'parks_kids_memory_v2', 
        'parks_kids_quiz', 'parks_kids_puzzles'
    ];

    let completed = 0;
    for(let key of keys) {
        progText.innerText = "Recupero " + key.toUpperCase() + "...";
        window.firebase.database().ref(key).once('value', (snapshot) => {
            const data = snapshot.val();
            if(data) {
                window.PARKS_DB.save(key, data, () => {
                    completed++;
                    if(completed === keys.length) {
                        loader.remove();
                        alert("Sincronizzazione completata! La pagina verrà ricaricata.");
                        location.reload();
                    }
                }, true);
            } else {
                completed++;
                if(completed === keys.length) {
                    loader.remove();
                    alert("Recupero terminato. Alcune chiavi erano vuote.");
                    location.reload();
                }
            }
        });
    }
}

function forceCloudSync() {
    cloudRecovery();
}
