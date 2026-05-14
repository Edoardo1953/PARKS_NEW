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
    
    const transientViews = ['fiche-editor', 'tourist-editor', 'itinerary-editor-modal', 'quiz-editor-modal'];
    if(!transientViews.includes(view)) {
        curSection = view;
    }
    
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

    // Load Library with Migration check
    window.PARKS_DB.get('parks_library_v2', null, (dataV2) => {
        if(dataV2 && dataV2.available_icons) {
            window.library = dataV2;
            finishLibLoad();
        } else {
            // Try fallback to old key
            window.PARKS_DB.get('parks_library', null, (dataOld) => {
                if(dataOld) {
                    console.log("Migrating data from parks_library to parks_library_v2...");
                    window.library = dataOld;
                    // Ensure structure
                    if(!window.library.available_icons) window.library.available_icons = {};
                    if(!window.library.map_markers) window.library.map_markers = [];
                    if(!window.library.available_maps) window.library.available_maps = [];
                    // Save to new key
                    window.PARKS_DB.save('parks_library_v2', window.library);
                } else {
                    window.library = {categories:[], available_icons:{}, map_markers:[], available_maps:[]};
                }
                finishLibLoad();
            });
        }
    });

    function finishLibLoad() {
        if(typeof renderUI === 'function') renderUI();
        if(typeof renderMarkerIcons === 'function') renderMarkerIcons(); // Force refresh for map editor
        switchView('dashboard');
    }

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
