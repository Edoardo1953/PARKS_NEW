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
        // 1. Check if we should render (not in admin, not on login)
        const fullPath = window.location.pathname;
        const fileName = fullPath.substring(fullPath.lastIndexOf('/') + 1);

        // Don't render on login/register or admin pages
        // We allow '' only if we are sure it's not the landing page, 
        // but since index.html is the landing, we exclude '' to be safe if it's the root.
        if (fullPath.includes('/admin/') || 
            fileName === 'index.html' || 
            fileName === 'login.html' || 
            fileName === 'register.html') {
            return;
        }

        if (document.querySelector('.mobile-nav')) return;
        
        const currentPage = fileName || 'homepage.html';
        
        // 1. Barra Inferiore (Quick Links)
        const nav = document.createElement('nav');
        nav.className = 'mobile-nav';
        
        const quickItems = [
            { id: 'homepage.html', icon: 'home', label: 'Home' },
            { id: 'map.html', icon: 'map', label: 'Mappa' },
            { id: 'itineraries.html', icon: 'milestone', label: 'Percorsi' },
            { id: 'library.html', icon: 'book-open', label: 'Libreria' },
            { id: 'drawer-toggle', icon: 'menu', label: 'Menu', isToggle: true }
        ];

        nav.innerHTML = quickItems.map(item => {
            const isActive = currentPage.includes(item.id);
            return `
                <a ${item.isToggle ? 'href="javascript:void(0)" onclick="window.PARKS_APP.toggleDrawer()"' : `href="${item.id}"`} class="mobile-nav-item ${isActive ? 'active' : ''}">
                    <i data-lucide="${item.icon}"></i>
                    <span>${item.label}</span>
                </a>
            `;
        }).join('');

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

        // Icon creation
        setTimeout(() => {
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
