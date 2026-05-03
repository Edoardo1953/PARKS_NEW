/* 🌲 PARKS - shared/db.js (FIREBASE CLOUD + INDEXEDDB CACHE) */

window.PARKS_DB = {
    _dbName: 'ParksProjectDB',
    _dbVersion: 1,
    _db: null,
    
    // Configurazione Firebase di Edoardo
    _firebaseConfig: {
      apiKey: "AIzaSyAUDj-EhXc691cMRsBy1qP46UWkPIgcEb4",
      authDomain: "parks-67a08.firebaseapp.com",
      databaseURL: "https://parks-67a08-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "parks-67a08",
      storageBucket: "parks-67a08.firebasestorage.app",
      messagingSenderId: "872271919437",
      appId: "1:872271919437:web:34362478eb72c6950d9f04"
    },

    init: function(callback) {
        var self = this;
        // 1. Inizializza IndexedDB come cache locale
        var request = indexedDB.open(this._dbName, this._dbVersion);
        request.onupgradeneeded = function(e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains('library')) {
                db.createObjectStore('library');
            }
        };
        request.onsuccess = function(e) {
            self._db = e.target.result;
            self._loadFirebase(callback);
        };
        request.onerror = function(e) {
            console.error('IndexedDB Error:', e);
            self._loadFirebase(callback);
        };
    },

    _loadFirebase: function(done) {
        var self = this;
        if (window.firebase) return done();

        // Carica Firebase dinamicamente
        function loadScript(src, cb) {
            var s = document.createElement('script');
            s.src = src;
            s.onload = cb;
            document.head.appendChild(s);
        }

        loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js", function() {
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js", function() {
                loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js", function() {
                    if (!firebase.apps.length) {
                        firebase.initializeApp(self._firebaseConfig);
                    }
                    done();
                });
            });
        });
    },

    _generateUUID: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    _uploadBase64ToStorage: async function(base64Str) {
        return new Promise((resolve, reject) => {
            var ext = 'png';
            var mimeMatch = base64Str.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
            if (mimeMatch && mimeMatch.length > 1) {
                ext = mimeMatch[1].split('/')[1] || 'png';
            }
            var uuid = this._generateUUID();
            var path = 'images/' + uuid + '.' + ext;
            var ref = firebase.storage().ref().child(path);
            
            ref.putString(base64Str, 'data_url').then(function(snapshot) {
                snapshot.ref.getDownloadURL().then(function(downloadURL) {
                    resolve(downloadURL);
                }).catch(reject);
            }).catch(reject);
        });
    },

    _processImagesBeforeSave: async function(value) {
        var self = this;
        var base64Items = [];
        
        // 1. Ricerca sincrona velocissima di tutte le foto nel file da 270MB
        function findImages(obj) {
            if (!obj || typeof obj !== 'object') return;
            if (Array.isArray(obj)) {
                for (var i = 0; i < obj.length; i++) findImages(obj[i]);
                return;
            }
            for (var k in obj) {
                if (!obj.hasOwnProperty(k)) continue;
                if (typeof obj[k] === 'string' && obj[k].startsWith('data:image/')) {
                    base64Items.push({ parent: obj, key: k, base64: obj[k] });
                } else if (typeof obj[k] === 'object' && obj[k] !== null) {
                    findImages(obj[k]);
                }
            }
        }
        
        findImages(value);
        
        // Aggiorna UI con il totale
        var progressText = document.getElementById('firebase-progress');
        if (progressText && base64Items.length > 0) {
            progressText.innerHTML = "Trovate <b>" + base64Items.length + "</b> foto da caricare.<br>Inizio caricamento...";
        }

        // 2. Carica le foto una ad una e sostituisce il link
        for(var i=0; i < base64Items.length; i++) {
            var item = base64Items[i];
            if (progressText) {
                progressText.innerHTML = "Caricamento foto: <b>" + (i + 1) + "</b> di <b>" + base64Items.length + "</b>...<br><small>(Non chiudere questa finestra)</small>";
            }
            try {
                item.parent[item.key] = await self._uploadBase64ToStorage(item.base64);
            } catch(e) {
                if (i === 0) { // Mostra l'errore vero della prima foto!
                    alert("FATAL ERROR STORAGE: " + (e.message || e));
                }
                console.error("Errore upload foto " + i, e);
            }
        }
        
        return value;
    },

    get: function(key, fallback, callback) {
        var self = this;
        // Controlla prima sul Cloud Firebase
        if (window.firebase) {
            firebase.database().ref(key).once('value').then(function(snapshot) {
                if (snapshot.exists()) {
                    var data = snapshot.val();
                    // Salva nella cache locale
                    if (self._db) {
                        try {
                            var tx = self._db.transaction(['library'], 'readwrite');
                            tx.objectStore('library').put(data, key);
                        } catch(e){}
                    }
                    callback(data);
                } else {
                    // Fallback a IndexedDB locale (utile la prima volta prima dell'importazione)
                    self._getFromLocal(key, fallback, callback);
                }
            }).catch(function(err) {
                console.error("Firebase Read Error:", err);
                self._getFromLocal(key, fallback, callback);
            });
        } else {
            self._getFromLocal(key, fallback, callback);
        }
    },

    _getFromLocal: function(key, fallback, callback) {
        var self = this;
        if (!this._db) { return this._tryShadow(key, fallback, callback); }
        var transaction = this._db.transaction(['library'], 'readonly');
        var store = transaction.objectStore('library');
        var request = store.get(key);
        request.onsuccess = function() {
            var res = request.result;
            if (res === undefined || res === null) {
                self._tryShadow(key, fallback, callback);
            } else {
                callback(res);
            }
        };
        request.onerror = function() { self._tryShadow(key, fallback, callback); };
    },

    _tryShadow: function(key, fallback, callback) {
        try {
            var shadow = JSON.parse(localStorage.getItem('parks_shadow_v1') || '{}');
            var val = shadow[key] !== undefined ? shadow[key] : fallback;
            if (val === undefined && key === 'parks_library_v2') {
                val = { categories: [
                    { id: 'cat_animals', name: 'ANIMALS', image: '', subcategories: [] },
                    { id: 'cat_plants', name: 'PLANTS', subcategories: [] },
                    { id: 'cat_places', name: 'PLACES', subcategories: [] },
                    { id: 'cat_people', name: 'PEOPLES', subcategories: [] },
                    { id: 'cat_locations', name: 'GLOBE', subcategories: [] },
                    { id: 'cat_documents', name: 'DOCUMENTS', subcategories: [] }
                ]};
            }
            callback(val);
        } catch(e) {
            callback(fallback);
        }
    },

    save: async function(key, value, callback) {
        var self = this;
        
        // UI di caricamento per capire se sta lavorando (non impilare i banner)
        if (!document.getElementById('firebase-saving')) {
            var loader = document.createElement('div');
            loader.id = 'firebase-saving';
            loader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:sans-serif;color:#fff;text-align:center;padding:20px;';
            loader.innerHTML = '<h2 style="margin-bottom:15px; color:#4CAF50;">Sincronizzazione col Cloud in corso</h2><div id="firebase-progress" style="font-size:20px; padding:20px; background:rgba(255,255,255,0.1); border-radius:10px; min-width:300px;">Analisi del file in corso... (potrebbe bloccarsi per qualche secondo)</div><br><p style="color:#aaa;">Visto che il file pesa 270MB, il caricamento di tutte le foto<br>potrebbe impiegare diverso tempo. Porta pazienza!</p>';
            document.body.appendChild(loader);
        }

        try {
            // 1. Processa le immagini (carica i base64 nello Storage e li sostituisce con i link web)
            var processedValue = await this._processImagesBeforeSave(value);

            // 2. Salva nel database Cloud
            if (window.firebase) {
                try {
                    await firebase.database().ref(key).set(processedValue);
                } catch(firebaseErr) {
                    console.error("Firebase DB Set Error:", firebaseErr);
                    alert("Errore salvataggio Cloud (Probabilmente permessi di sicurezza negati su Firebase). I dati verranno salvati solo in locale per ora.");
                }
            }
            
            // 3. Aggiorna la cache locale IndexedDB
            if (this._db) {
                var tx = this._db.transaction(['library'], 'readwrite');
                tx.objectStore('library').put(processedValue, key);
            }

            if(document.getElementById('firebase-saving')) document.getElementById('firebase-saving').remove();
            if (callback) callback(true);
            
        } catch(e) {
            console.error("Save Error:", e);
            if(document.getElementById('firebase-saving')) document.getElementById('firebase-saving').remove();
            if (callback) callback(false);
        }
    }
};
