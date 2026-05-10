/* 🌲 PARKS - shared/app.js (MOTORE DI COORDINAMENTO) */

window.PARKS_APP = {
    init: function(callback) {
        console.log("🚀 PARKS_APP: Avvio sistema...");
        this.renderMobileNav(); // Inietta la navigazione mobile se necessario

        if (window.PARKS_DB) {
            window.PARKS_DB.init(function() {
                console.log("✅ PARKS_APP: Database pronto.");
                if (callback) callback();
            });
        } else {
            console.error("❌ ERRORE: PARKS_DB non trovato!");
        }
    },

    // Iniezione Navigazione Mobile
    renderMobileNav: function() {
        // 1. Check if we should render (not on desktop, not in admin, not on login)
        if (window.innerWidth > 768) return;
        
        const fullPath = window.location.pathname;
        if (fullPath.includes('/admin/') || fullPath.includes('index.html') || fullPath.includes('login.html')) return;

        if (document.querySelector('.mobile-nav')) return;
        
        const currentPage = fullPath.substring(fullPath.lastIndexOf('/') + 1) || 'homepage.html';
        
        // 1. Barra Inferiore (Quick Links)
        const nav = document.createElement('nav');
        nav.className = 'mobile-nav';
        
        const quickItems = [
            { id: 'homepage.html', icon: 'home', label: 'Home' },
            { id: 'map.html', icon: 'map', label: 'Mappa' },
            { id: 'itineraries.html', icon: 'milestone', label: 'Percorsi' },
            { id: 'kids_corner.html', icon: 'baby', label: 'Kids' },
            { id: 'drawer-toggle', icon: 'menu', label: 'Menu', isToggle: true }
        ];

        nav.innerHTML = quickItems.map(item => `
            <a ${item.isToggle ? 'href="javascript:void(0)" id="mobile-menu-btn"' : `href="${item.id}"`} class="mobile-nav-item ${currentPage.includes(item.id) ? 'active' : ''}">
                <i data-lucide="${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        `).join('');

        // 2. Drawer (Menu Completo)
        const drawer = document.createElement('div');
        drawer.className = 'mobile-drawer';
        drawer.id = 'mobile-drawer';
        
        const allLinks = [
            { id: 'homepage.html', icon: 'home', label: 'Home' },
            { id: 'map.html', icon: 'map', label: 'Mappa Interattiva' },
            { id: 'itineraries.html', icon: 'milestone', label: 'Itinerari Safari' },
            { id: 'alerts.html', icon: 'bell', label: 'Inserisci ALERT' },
            { id: 'library.html', icon: 'book-open', label: 'Libreria' },
            { id: 'visit_namibia.html', icon: 'flag', label: 'Visit Namibia' },
            { id: 'library.html?view=mustsee', icon: 'star', label: 'Must See' },
            { id: 'kids_corner.html', icon: 'baby', label: 'Kid\'s Corner' },
            { id: 'memory2/index.html', icon: 'film', label: 'Memory Composer' }
        ];

        drawer.innerHTML = `
            <div class="drawer-header">
                <div style="font-weight:900; letter-spacing:3px; color:var(--accent);">PARKS MENU</div>
                <button onclick="window.PARKS_APP.toggleDrawer()" style="background:none; border:none; color:white; padding:10px;"><i data-lucide="x"></i></button>
            </div>
            <div class="drawer-menu">
                ${allLinks.map(link => `
                    <a href="${link.id}" class="drawer-item ${currentPage.includes(link.id) ? 'active' : ''}">
                        <i data-lucide="${link.icon}"></i>
                        <span>${link.label}</span>
                    </a>
                `).join('')}
                <button onclick="window.PARKS_APP.logout()" style="margin-top:20px; background:rgba(255,82,82,0.1); border:1px solid rgba(255,82,82,0.3); color:#ff5252; padding:15px; border-radius:15px; font-weight:900; letter-spacing:2px; display:flex; align-items:center; justify-content:center; gap:10px;">
                    <i data-lucide="log-out"></i> LOGOUT
                </button>
            </div>
        `;

        document.body.appendChild(nav);
        document.body.appendChild(drawer);

        // Event Listener per il toggle
        setTimeout(() => {
            const btn = document.getElementById('mobile-menu-btn');
            if(btn) btn.onclick = this.toggleDrawer;
            if (window.lucide) window.lucide.createIcons();
        }, 100);
    },

    toggleDrawer: function() {
        const d = document.getElementById('mobile-drawer');
        if(d) d.classList.toggle('open');
    },

    logout: function() {
        window.PARKS_APP.setSession({ loggedIn: false }, function() {
            window.location.href = 'index.html';
        });
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
