/* 🌲 PARKS - shared/db.js (FIREBASE CLOUD + INDEXEDDB CACHE) */

window.PARKS_DB = {
    _dbName: 'PARKS_FINAL_STORAGE',
    _dbVersion: 2,
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
            console.log("[DB] IndexedDB FINAL pronta.");
            self._loadFirebase(callback);
        };
        request.onerror = function(e) {
            console.error('IndexedDB Error:', e);
            self._loadFirebase(callback);
        };
    },

    _loadFirebase: function(done) {
        var self = this;
        if (window.firebase && firebase.apps && firebase.apps.length) return done();

        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            console.log("[DB] Navigatore offline. Procedo con la cache locale IndexedDB.");
            return done();
        }

        // Timeout globale di 4 secondi per evitare blocchi infiniti se la connessione è instabile
        var timeoutTriggered = false;
        var globalTimeout = setTimeout(function() {
            if (!timeoutTriggered) {
                timeoutTriggered = true;
                console.warn("[DB] Timeout globale caricamento Firebase (4s). Fallback su cache locale.");
                done();
            }
        }, 4000);

        function loadScript(src, cb) {
            if (timeoutTriggered) return;
            var s = document.createElement('script');
            s.src = src;
            s.onload = function() {
                if (!timeoutTriggered) cb();
            };
            s.onerror = function() {
                if (!timeoutTriggered) cb();
            };
            document.head.appendChild(s);
        }

        loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js", function() {
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js", function() {
                loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js", function() {
                    clearTimeout(globalTimeout);
                    if (!timeoutTriggered) {
                        if (window.firebase && !firebase.apps.length) {
                            try {
                                firebase.initializeApp(self._firebaseConfig);
                                console.log("[DB] Firebase inizializzato correttamente.");
                            } catch(e) { 
                                console.error("[DB] Errore inizializzazione Firebase:", e);
                            }
                        }
                        done();
                    }
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

    _uploadBase64ToStorage: async function(base64Str, filename = null) {
        return new Promise((resolve, reject) => {
            if (!window.firebase || !firebase.apps || !firebase.apps.length || typeof firebase.storage !== 'function') {
                return reject("Firebase storage not initialized");
            }
            var uuid = this._generateUUID();
            var name = filename || (uuid + '.png');
            var ref = firebase.storage().ref().child('uploads/' + name);
            ref.putString(base64Str, 'data_url').then(function(snapshot) {
                snapshot.ref.getDownloadURL().then(resolve).catch(reject);
            }).catch(reject);
        });
    },

    uploadFile: async function(file) {
        return new Promise((resolve, reject) => {
            if (!window.firebase || !firebase.apps || !firebase.apps.length || typeof firebase.storage !== 'function') {
                return reject("Firebase storage not initialized");
            }
            var uuid = this._generateUUID();
            var ext = file.name.split('.').pop();
            var name = uuid + '.' + ext;
            var ref = firebase.storage().ref().child('uploads/' + name);
            
            var uploadTask = ref.put(file);
            uploadTask.on('state_changed', 
                (snapshot) => {
                    // console.log('Progress:', (snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                }, 
                (error) => reject(error), 
                () => {
                    uploadTask.snapshot.ref.getDownloadURL().then(resolve).catch(reject);
                }
            );
        });
    },

    _smallKeys: ['parks_itineraries', 'parks_alerts', 'parks_home_v1', 'parks_users', 'parks_tourists',
                 'parks_kids_drawings', 'parks_kids_memory', 'parks_kids_quiz', 'parks_kids_puzzles',
                 'parks_weather_config', 'parks_session', 'parks_utensili_v1'],

    _updateIDB: function(key, data) {
        if (!this._db || data === null || data === undefined) return;
        try {
            var wtx = this._db.transaction(['library'], 'readwrite');
            wtx.objectStore('library').put(data, key);
        } catch(e) {
            console.error("[DB] IDB Write Error for " + key, e);
        }
    },

    get: function(key, fallback, callback) {
        var self = this;

        function readFromIDB(cb) {
            if (self._db) {
                try {
                    var tx = self._db.transaction(['library'], 'readonly');
                    var req = tx.objectStore('library').get(key);
                    req.onsuccess = function() {
                        cb(req.result !== undefined && req.result !== null ? req.result : null);
                    };
                    req.onerror = function() { cb(null); };
                } catch(e) {
                    cb(null);
                }
            } else {
                cb(null);
            }
        }

        readFromIDB(function(localResult) {
            // Se abbiamo già dati salvati localmente in IndexedDB, usali sempre con priorità
            if (localResult !== null && localResult !== undefined) {
                if (callback) callback(localResult);
                return;
            }

            // Altrimenti se IndexedDB è vuoto, scarica da Firebase come inizializzazione iniziale
            if (window.firebase && firebase.apps && firebase.apps.length && typeof firebase.database === 'function') {
                var callbackCalled = false;
                var queryTimeout = setTimeout(function() {
                    if (!callbackCalled) {
                        callbackCalled = true;
                        if (callback) callback(fallback);
                    }
                }, 2000);

                firebase.database().ref(key).once('value').then(function(snap) {
                    clearTimeout(queryTimeout);
                    if (callbackCalled) return;
                    callbackCalled = true;
                    if (snap.exists() && snap.val() !== null) {
                        var data = snap.val();
                        self._updateIDB(key, data);
                        if (callback) callback(data);
                    } else {
                        if (callback) callback(fallback);
                    }
                }).catch(function() {
                    clearTimeout(queryTimeout);
                    if (callbackCalled) return;
                    callbackCalled = true;
                    if (callback) callback(fallback);
                });
                return;
            }

            if (callback) callback(fallback);
        });
    },

    _getFromFirebase: function(key, fallback, callback) {
        var self = this;
        if (window.firebase && firebase.apps && firebase.apps.length && typeof firebase.database === 'function') {
            var callbackCalled = false;
            var t = setTimeout(function() {
                if (!callbackCalled) {
                    callbackCalled = true;
                    console.warn("[DB] Timeout _getFromFirebase per '" + key + "'. Uso fallback.");
                    callback(fallback);
                }
            }, 2500); // 2.5 secondi timeout

            firebase.database().ref(key).once('value').then(function(snap) {
                clearTimeout(t);
                if (callbackCalled) {
                    // Aggiorna solo IndexedDB in background
                    if (snap.exists() && snap.val() !== null) {
                        self._updateIDB(key, snap.val());
                    }
                    return;
                }
                callbackCalled = true;
                if (snap.exists()) {
                    var data = snap.val();
                    self._updateIDB(key, data);
                    callback(data);
                } else {
                    callback(fallback);
                }
            }).catch(function() {
                clearTimeout(t);
                if (callbackCalled) return;
                callbackCalled = true;
                callback(fallback);
            });
        } else {
            callback(fallback);
        }
    },

    save: async function(key, value, callback, localOnly = false) {
        var self = this;
        
        // 1. Salva in IndexedDB
        this._updateIDB(key, value);

        // 2. Salva nel database Cloud
        if (window.firebase && firebase.apps && firebase.apps.length && typeof firebase.database === 'function' && !localOnly) {
            try {
                var isHuge = (key === 'parks_library_v2' || key === 'parks_gallery' || key === 'parks_visit_namibia_v1');
                
                if (isHuge) {
                    var v = Date.now();
                    await firebase.database().ref(key + '_version').set(v);
                    this._updateIDB(key + '_version', v);
                }

                await firebase.database().ref(key).set(value);
                if (callback) callback(true);
            } catch(err) {
                console.warn("[DB] Firebase Sync Warning for " + key + " (salvato con successo in IndexedDB locale):", err);
                if (callback) callback(true);
            }
        } else {
            if (callback) callback(true);
        }
    }
};
