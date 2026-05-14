/**
 * PARKS - Main Admin Controller
 */

// Global State
var library = { categories: [], available_icons: {}, map_markers: [], available_maps: [], active_map_id: null };
var visitNamibia = { categories: [] };
var curSection = 'dashboard';
var curDrag = null;
var curEditContext = null;
var curEditItem = null;
var itinerariesList = [];
var users = [];
var tourists = [];
var homeContent = {};
var gallery = [];
var kidsDrawings = [];
var memoryGames = [];
var kidsQuiz = [];
var kidsPuzzles = [];

// Navigation
function switchView(view) {
    document.querySelectorAll('.view-pane').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const target = document.getElementById('view-' + view);
    if(target) target.classList.add('active');
    
    const nav = document.getElementById('nav-' + view);
    if(nav) nav.classList.add('active');
    
    curSection = view;
    
    if(view === 'dashboard' && typeof initDashboardMap === 'function') initDashboardMap();
    if(view === 'library' && typeof renderLib === 'function') renderLib();
    if(view === 'visit' && typeof renderLib === 'function') renderLib();
    if(view === 'itineraries' && typeof renderAdminItineraries === 'function') renderAdminItineraries();
    if(view === 'users' && typeof renderUsers === 'function') renderUsers();
    if(view === 'kids' && typeof renderKids === 'function') renderKids();
    if(view === 'home' && typeof renderHome === 'function') renderHome();
    if(view === 'map' && typeof renderMapEditor === 'function') renderMapEditor();
    
    if(window.lucide) lucide.createIcons();
}

function openUserView() {
    window.open('../user/index.html', '_blank');
}

// Global Save Bridge
function save(refreshLib = true) { 
    window.PARKS_DB.save('parks_library_v2', library, () => {
        if(refreshLib && (curSection === 'library' || curSection === 'visit')) renderLib();
        if(refreshLib && typeof renderUI === 'function') renderUI();
    });

    if(curSection === 'visit') {
        window.PARKS_DB.save('parks_visit_namibia_v1', visitNamibia);
    }
}

// Initialization
window.PARKS_APP.init(() => { 
    console.log("🚀 Admin System Initialized.");
    
    const loadData = (key, fallback, targetVar, callback) => {
        window.PARKS_DB.get(key, fallback, (data) => {
            try {
                if(data) {
                    if(key === 'parks_itineraries') {
                        let raw = Array.isArray(data) ? data : Object.values(data);
                        window.itinerariesList = raw.filter(x => x !== null).map(iti => {
                            if(iti && iti.waypoints && !Array.isArray(iti.waypoints)) iti.waypoints = Object.values(iti.waypoints);
                            if(iti && !iti.waypoints) iti.waypoints = [];
                            return iti;
                        });
                    } else {
                        window[targetVar] = data;
                    }
                }
                if(callback) callback();
            } catch(e) {
                console.warn("Error loading " + key, e);
                if(callback) callback();
            }
        });
    };

    loadData('parks_library_v2', {categories:[], available_icons:{}, map_markers:[], available_maps:[]}, 'library', () => {
        if(typeof renderUI === 'function') renderUI();
        switchView('dashboard');
    });

    loadData('parks_itineraries', [], 'itinerariesList', () => { if(typeof renderAdminItineraries === 'function') renderAdminItineraries(); });
    loadData('parks_users', [], 'users', () => { if(typeof renderUsers === 'function') renderUsers(); });
    loadData('parks_tourists', [], 'tourists', () => { if(typeof renderTourists === 'function') renderTourists(); });
    loadData('parks_home_v1', {}, 'homeContent');
    loadData('parks_gallery', [], 'gallery');
    loadData('parks_visit_namibia_v1', {categories:[]}, 'visitNamibia');
    loadData('parks_kids_drawings', [], 'kidsDrawings');
    loadData('parks_kids_quiz', [], 'kidsQuiz');
    loadData('parks_kids_memory_v2', [], 'memoryGames');
    loadData('parks_kids_puzzles', [], 'kidsPuzzles');
});
