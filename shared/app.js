/* 🌲 PARKS - shared/app.js (MOTORE DI COORDINAMENTO) */

window.PARKS_APP = {
    init: function(callback) {
        console.log("🚀 PARKS_APP: Avvio sistema...");
        if (window.PARKS_DB) {
            window.PARKS_DB.init(function() {
                console.log("✅ PARKS_APP: Database pronto.");
                if (callback) callback();
            });
        } else {
            console.error("❌ ERRORE: PARKS_DB non trovato!");
        }
    },

    // Gestione Sessione
    getSession: function(callback) {
        window.PARKS_DB.get('parks_session', { loggedIn: false, role: 'PUBLIC' }, function(data) {
            if(callback) callback(data);
        });
    },

    setSession: function(user, callback) {
        window.PARKS_DB.save('parks_session', user, function() {
            if(callback) callback();
        });
    }
};
