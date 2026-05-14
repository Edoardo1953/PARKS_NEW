/**
 * PARKS - Homepage CMS Module
 */

function renderHome() {
    window.PARKS_DB.get('parks_home_v1', {}, function(data) {
        window.homeContent = data;
        document.getElementById('home-title').value = data.title || '';
        document.getElementById('home-tagline').value = data.tagline || '';
        document.getElementById('home-description').value = data.description || '';
    });

    window.PARKS_DB.get('parks_gallery', [], function(data) {
        window.gallery = data;
        renderGallery();
    });
}

function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if(!grid) return;
    
    if(!window.gallery || window.gallery.length === 0) {
        grid.innerHTML = '<div style="opacity:0.3; padding:20px;">Nessuna foto in galleria</div>';
        return;
    }

    grid.innerHTML = window.gallery.map((img, idx) => `
        <div class="photo-box">
            <img src="${img}">
            <button class="photo-del" onclick="deleteGalleryPhoto(${idx})">×</button>
        </div>
    `).join('');
}

async function uploadGallery(event) {
    const files = event.target.files;
    if(!files || files.length === 0) return;

    for(let file of files) {
        const url = await window.PARKS_DB.uploadFile(file, 'gallery/' + Date.now() + '_' + file.name);
        window.gallery.push(url);
    }
    
    window.PARKS_DB.save('parks_gallery', window.gallery, () => {
        renderGallery();
    });
    event.target.value = '';
}

function deleteGalleryPhoto(idx) {
    if(!confirm("Eliminare questa foto dalla galleria?")) return;
    window.gallery.splice(idx, 1);
    window.PARKS_DB.save('parks_gallery', window.gallery, () => {
        renderGallery();
    });
}

function saveHomeAll() {
    const data = {
        title: document.getElementById('home-title').value,
        tagline: document.getElementById('home-tagline').value,
        description: document.getElementById('home-description').value
    };
    
    window.PARKS_DB.save('parks_home_v1', data, (success) => {
        if(success) alert("Homepage aggiornata con successo!");
        else alert("Errore durante il salvataggio.");
    });
}
