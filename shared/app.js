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
        const pathParts = fullPath.split('/');
        let fileName = pathParts[pathParts.length - 1] || 'homepage.html';
        if (fileName.includes('?')) fileName = fileName.split('?')[0];

        // Don't render on login/register or the ROOT index.html
        // We check if we are in the /user/ directory to be safe
        const isUserPage = fullPath.includes('/user/');
        
        if (!isUserPage || 
            fullPath.endsWith('/index.html') && !fullPath.includes('/user/') ||
            fileName === 'login.html' || 
            fileName === 'register.html') {
            
            // Special case: if it's a user sub-page named index.html (like memory2/index.html), we SHOULD render
            if (isUserPage) {
                // Continue to rendering
            } else {
                console.log("🚫 PARKS_APP: Navigazione mobile esclusa per questa pagina (" + fileName + ")");
                return;
            }
        }

        // Robust path handling for shared assets and subdirectories
        let sharedPath = '../shared/';
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src;
            if (src.includes('shared/app.js')) {
                sharedPath = src.split('app.js')[0];
                break;
            }
        }
        
        const isSubdir = fullPath.includes('/memory2/');
        const pathPrefix = isSubdir ? '../' : '';

        // 1. TOP BAR (Iniezione automatica se manca)
        if (!document.querySelector('.parks-mobile-topbar') && !document.querySelector('.mobile-header') && window.innerWidth <= 768) {
            const topBar = document.createElement('div');
            topBar.className = 'parks-mobile-topbar';
            topBar.style.cssText = "display:flex; position:fixed; top:0; left:0; right:0; height:60px; background:rgba(13,30,26,0.98); backdrop-filter:blur(20px); border-bottom:1px solid rgba(255,255,255,0.1); z-index:9998; padding:0 15px; justify-content:space-between; align-items:center;";
            
            const isHome = fileName === 'homepage.html';
            
            topBar.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    ${!isHome ? `
                        <button onclick="window.history.back()" style="background:rgba(255,171,64,0.1); border:1px solid rgba(255,171,64,0.3); color:#ffab40; padding:6px 10px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="chevron-left" style="width:18px; height:18px;"></i>
                        </button>
                    ` : ''}
                    <img src="${sharedPath}parks_logo_combined_white.svg" style="height:22px; width:auto;" alt="PARKS">
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button onclick="window.PARKS_APP.toggleDrawer()" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:white; padding:8px 10px; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                        <i data-lucide="menu" style="width:20px; height:20px;"></i>
                    </button>
                </div>
            `;
            document.body.prepend(topBar);
            
            // Adjust main content padding to account for fixed top bar
            // Enforce with !important to override mobile_responsive.css
            const containers = ['.main-content-scroll', '.main-content', '.layout', '.app-container'];
            for (let selector of containers) {
                const el = document.querySelector(selector);
                if (el) {
                    el.style.setProperty('padding-top', '60px', 'important');
                    break; // Only apply to the first one found!
                }
            }
        }

        if (document.querySelector('.mobile-nav')) return;
        
        const currentPage = fileName;
        
        // 2. Barra Inferiore (Quick Links)
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
            let link = item.isToggle ? 'javascript:void(0)' : (pathPrefix + item.id);
            // Special case: if we are in memory2/ and the link is memory2/index.html, it's just index.html
            if (fullPath.includes('/memory2/') && item.id.includes('memory2/')) {
                link = item.id.split('/')[1];
            }

            return `
                <a ${item.isToggle ? `onclick="window.PARKS_APP.toggleDrawer()"` : `href="${link}"`} class="mobile-nav-item ${isActive ? 'active' : ''}">
                    <i data-lucide="${item.icon}"></i>
                    <span>${item.label}</span>
                </a>
            `;
        }).join('');

        // 3. Drawer (Menu Completo)
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
            { id: 'memory2/index.html', icon: 'film', label: 'Memory Composer' },
            { id: 'forex_light.html', icon: 'trending-up', label: 'Cambi Valute' }
        ];

        drawer.innerHTML = `
            <div class="drawer-header">
                <div style="font-weight:900; letter-spacing:3px; color:var(--accent);">PARKS MENU</div>
                <button onclick="window.PARKS_APP.toggleDrawer()" style="background:none; border:none; color:white; padding:10px;"><i data-lucide="x"></i></button>
            </div>
            <div class="drawer-menu">
                ${allLinks.map(link => {
                    let finalLink = pathPrefix + link.id;
                    if (fullPath.includes('/memory2/') && link.id.includes('memory2/')) {
                        finalLink = link.id.split('/')[1];
                    }
                    return `
                        <a href="${finalLink}" class="drawer-item ${currentPage.includes(link.id) ? 'active' : ''}">
                            <i data-lucide="${link.icon}"></i>
                            <span>${link.label}</span>
                        </a>
                    `;
                }).join('')}
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
