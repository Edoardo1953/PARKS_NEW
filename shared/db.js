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
        if (window.firebase) return done();

        // Carica Firebase dinamicamente
        function loadScript(src, cb) {
            var s = document.createElement('script');
            s.src = src;
            s.onload = cb;
            s.onerror = function() { cb(); };
            document.head.appendChild(s);
        }

        loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js", function() {
            loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js", function() {
                loadScript("https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js", function() {
                    if (window.firebase && !firebase.apps.length) {
                        try {
                            firebase.initializeApp(self._firebaseConfig);
                        } catch(e) { }
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

    _uploadBase64ToStorage: async function(base64Str, filename = null) {
        return new Promise((resolve, reject) => {
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
            if (!window.firebase) return reject("Firebase not initialized");
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
                 'parks_weather_config'],

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
        var isHuge = (key === 'parks_library_v2' || key === 'parks_gallery' || key === 'parks_visit_namibia_v1');

        function readFromIDB(cb) {
            if (self._db) {
                var tx = self._db.transaction(['library'], 'readonly');
                var req = tx.objectStore('library').get(key);
                req.onsuccess = function() {
                    cb(req.result !== undefined && req.result !== null ? req.result : fallback);
                };
                req.onerror = function() { cb(fallback); };
            } else {
                cb(fallback);
            }
        }

        if (isHuge) {
            var versionKey = key + '_version';
            function fetchHugeFromFirebase() {
                self._getFromFirebase(key, fallback, function(data) {
                    firebase.database().ref(versionKey).once('value').then(snap => {
                        var v = snap.val() || Date.now();
                        self._updateIDB(versionKey, v);
                        callback(data);
                    });
                });
            }

            if (window.firebase) {
                firebase.database().ref(versionKey).once('value').then(vSnap => {
                    var cloudV = vSnap.val();
                    if (self._db) {
                        var tx = self._db.transaction(['library'], 'readonly');
                        var vReq = tx.objectStore('library').get(versionKey);
                        vReq.onsuccess = function() {
                            var localV = vReq.result;
                            if (cloudV && cloudV !== localV) {
                                console.log("[DB] Nuova versione Cloud per " + key + " (" + cloudV + " vs " + localV + "). Download...");
                                fetchHugeFromFirebase();
                            } else {
                                readFromIDB(callback);
                            }
                        };
                        vReq.onerror = function() { fetchHugeFromFirebase(); };
                    } else {
                        fetchHugeFromFirebase();
                    }
                }).catch(() => {
                    readFromIDB(callback);
                });
            } else {
                readFromIDB(callback);
            }
            return;
        }

        if (window.firebase) {
            firebase.database().ref(key).once('value').then(function(snap) {
                if (snap.exists() && snap.val() !== null) {
                    var data = snap.val();
                    self._updateIDB(key, data);
                    callback(data);
                } else {
                    console.warn('[DB] Firebase vuoto per "' + key + '", uso IndexedDB locale.');
                    readFromIDB(callback);
                }
            }).catch(function(err) {
                console.warn('[DB] Firebase error per "' + key + '":', err);
                readFromIDB(function(idbResult) {
                    callback(idbResult || fallback);
                });
            });
            return;
        }

        readFromIDB(callback);
    },

    _getFromFirebase: function(key, fallback, callback) {
        var self = this;
        if (window.firebase) {
            firebase.database().ref(key).once('value').then(function(snap) {
                if (snap.exists()) {
                    var data = snap.val();
                    self._updateIDB(key, data);
                    callback(data);
                } else {
                    callback(fallback);
                }
            }).catch(function() {
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
        if (window.firebase && !localOnly) {
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
                console.error("[DB] Firebase Sync Error for " + key + ":", err);
                if (callback) callback(false);
            }
        } else {
            if (callback) callback(true);
        }
    }
};
