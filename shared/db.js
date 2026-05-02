/* 🌲 PARKS - shared/db.js (DUAL PROTECTION: INDEXEDDB + LS SHADOW) */

window.PARKS_DB = {
    _dbName: 'ParksProjectDB',
    _dbVersion: 1,
    _db: null,

    // LS key for the structural shadow (no images, just text/structure)
    _shadowKey: 'parks_shadow_v1',

    // Keys that get a lightweight shadow copy in localStorage
    _shadowableKeys: ['parks_library_v2', 'parks_users', 'parks_tourists'],

    _initial: {
      categories: [
        { id: 'cat_animals', name: 'ANIMALS', image: '', subcategories: [] },
        { id: 'cat_plants', name: 'PLANTS', subcategories: [] },
        { id: 'cat_places', name: 'PLACES', subcategories: [] },
        { id: 'cat_people', name: 'PEOPLES', subcategories: [] },
        { id: 'cat_locations', name: 'GLOBE', subcategories: [] },
        { id: 'cat_documents', name: 'DOCUMENTS', subcategories: [] }
      ]
    },

    init: function(callback) {
        var self = this;
        var request = indexedDB.open(this._dbName, this._dbVersion);

        request.onupgradeneeded = function(e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains('library')) {
                db.createObjectStore('library');
            }
        };

        request.onsuccess = function(e) {
            self._db = e.target.result;
            self._migrate(function() {
                if (callback) callback();
            });
        };

        request.onerror = function(e) {
            console.error('IndexedDB Error:', e);
            if (callback) callback();
        };
    },

    // ------------------------------------------------------------------
    // SHADOW: salva copia leggera (senza images base64) in localStorage
    // come secondo livello di sicurezza contro la perdita dati
    // ------------------------------------------------------------------
    _writeShadow: function(key, value) {
        if (!value || this._shadowableKeys.indexOf(key) === -1) return;
        try {
            var slim = this._stripImages(JSON.parse(JSON.stringify(value)));
            var shadow = JSON.parse(localStorage.getItem(this._shadowKey) || '{}');
            shadow[key] = slim;
            shadow['_updated'] = new Date().toISOString();
            localStorage.setItem(this._shadowKey, JSON.stringify(shadow));
        } catch(e) {
            console.warn('Shadow write failed:', e);
        }
    },

    _readShadow: function(key) {
        try {
            var shadow = JSON.parse(localStorage.getItem(this._shadowKey) || '{}');
            return shadow[key] || null;
        } catch(e) { return null; }
    },

    // Rimuove le proprietà "image" e "photos" che contengono base64 pesanti
    _stripImages: function(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => this._stripImages(item));

        var out = {};
        for (var k in obj) {
            if (!obj.hasOwnProperty(k)) continue;
            // Rimuovi solo i campi con dati base64 pesanti
            if (k === 'image' || k === 'url') {
                // Conserva solo se non è base64
                if (typeof obj[k] === 'string' && obj[k].startsWith('data:')) {
                    out[k] = ''; // Svuota i base64
                } else {
                    out[k] = obj[k];
                }
            } else if (k === 'photos') {
                // Per i photos, conserva solo metadata (nome, tipo) senza i dati
                if (Array.isArray(obj[k])) {
                    out[k] = obj[k].map(p => {
                        if (typeof p === 'object' && p !== null) {
                            return { name: p.name || '', type: p.type || '' };
                        }
                        return null;
                    }).filter(Boolean);
                } else {
                    out[k] = [];
                }
            } else {
                out[k] = this._stripImages(obj[k]);
            }
        }
        return out;
    },

    // ------------------------------------------------------------------
    // MIGRATE: Controlla localStorage vecchio → IndexedDB → Shadow → Initial
    // ------------------------------------------------------------------
    _migrate: function(done) {
        var self = this;

        // 1. Vecchio localStorage legacy (pre-IndexedDB)
        var old = localStorage.getItem('parks_library_v2');
        if (old) {
            try {
                var data = JSON.parse(old);
                this.save('parks_library_v2', data, function() {
                    localStorage.removeItem('parks_library_v2');
                    console.log('✅ Migrazione LS→IDB completata.');
                    done();
                });
                return;
            } catch(e) { /* continua */ }
        }

        // 2. Controlla IndexedDB
        this.get('parks_library_v2', null, function(data) {
            if (data) {
                // IDB ha i dati: aggiorna il shadow
                self._writeShadow('parks_library_v2', data);
                console.log('✅ IndexedDB ha i dati. Shadow aggiornato.');
                done();
            } else {
                // 3. IDB vuoto: prova a recuperare dal shadow
                var shadow = self._readShadow('parks_library_v2');
                if (shadow && shadow.categories && shadow.categories.length > 0) {
                    console.warn('⚠️ IndexedDB vuoto! Ripristino struttura dal shadow LS. (Le immagini andranno ricaricate)');
                    self.save('parks_library_v2', shadow, function() {
                        done();
                    });
                } else {
                    // 4. Nessun dato: metti la struttura vuota iniziale
                    console.warn('⚠️ Nessun dato trovato. Inizializzazione struttura base.');
                    self.save('parks_library_v2', self._initial, function() {
                        self._writeShadow('parks_library_v2', self._initial);
                        done();
                    });
                }
            }
        });
    },

    // ------------------------------------------------------------------
    // GET: Legge da IndexedDB, con fallback al shadow se IDB è vuoto
    // ------------------------------------------------------------------
    get: function(key, fallback, callback) {
        var self = this;
        if (!this._db) {
            // Prova il shadow come ultima risorsa
            var s = this._readShadow(key);
            return callback(s || fallback);
        }
        var transaction = this._db.transaction(['library'], 'readonly');
        var store = transaction.objectStore('library');
        var request = store.get(key);

        request.onsuccess = function() {
            var res = request.result;
            if (res === undefined || res === null) {
                // IDB vuoto per questa chiave: prova il shadow
                var shadow = self._readShadow(key);
                callback(shadow !== null ? shadow : fallback);
            } else {
                callback(res);
            }
        };
        request.onerror = function() { callback(fallback); };
    },

    // ------------------------------------------------------------------
    // SAVE: Salva in IndexedDB E aggiorna il shadow
    // ------------------------------------------------------------------
    save: function(key, value, callback) {
        this._writeShadow(key, value);

        if (!this._db) { if (callback) callback(false); return; }
        var transaction = this._db.transaction(['library'], 'readwrite');
        var store = transaction.objectStore('library');
        var request = store.put(value, key);

        request.onsuccess = function() { if (callback) callback(true); };
        request.onerror = function() { if (callback) callback(false); };
    }
};
