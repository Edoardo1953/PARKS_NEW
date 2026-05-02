/* ===========================
   MEMORY2 — app.js
   Architettura: window.Memory oggetto globale
   Espone tutte le funzioni critiche in modo sincrono (no DOMContentLoaded)
   =========================== */

(function () {
    'use strict';

    // --- State ---
    var imagesList = [];
    var draggedIndex = null;
    var draggedZoom = null; // Memorizza tipo e livello zoom trascinato
    var activeZoomClickType = null;
    var activeZoomClickLevel = null;
    var isPlaying = false;
    var isRendering = false;
    var animationId = null;
    var startTime = 0;
    var audioContext = null;
    var audioSourceNode = null;
    var audioDestNode = null;

    // --- Refs DOM (lazy, cercati la prima volta che servono) ---
    function el(id) { return document.getElementById(id); }

    // --- Toast ---
    function showToast(msg, type) {
        var old = el('m2-toast');
        if (old) old.parentNode.removeChild(old);
        var t = document.createElement('div');
        t.id = 'm2-toast';
        t.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);' +
            'background:' + (type === 'success' ? '#3fb950' : '#f85149') + ';' +
            'color:#fff;padding:1rem 2rem;border-radius:12px;font-family:Outfit,sans-serif;' +
            'font-size:1rem;font-weight:600;z-index:999999;box-shadow:0 8px 30px rgba(0,0,0,.5);' +
            'max-width:90vw;text-align:center;pointer-events:none;';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 5000);
    }

    // --- Comprimi immagine ---
    function compressImage(file, callback) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = new Image();
            img.onerror = function() {
                showToast('Formato non supportato: "' + file.name + '"', 'error');
            };
            img.onload = function() {
                var MAX = 1920;
                var w = img.width, h = img.height;
                if (w > h && w > MAX)      { h = h * MAX / w; w = MAX; }
                else if (h > w && h > MAX) { w = w * MAX / h; h = MAX; }
                else if (w === h && w > MAX){ w = MAX; h = MAX; }

                var oc = document.createElement('canvas');
                oc.width = Math.round(w); oc.height = Math.round(h);
                var octx = oc.getContext('2d');
                octx.drawImage(img, 0, 0, oc.width, oc.height);

                var dataUrl = oc.toDataURL('image/jpeg', 0.85);
                var final = new Image();
                final.onload = function() { callback(final, dataUrl); };
                final.src = dataUrl;
            };
            img.src = e.target.result;
        };
        reader.onerror = function() {
            showToast('Errore lettura: "' + file.name + '"', 'error');
        };
        reader.readAsDataURL(file);
    }

    // --- handleFiles (esposta globalmente) ---
    function handleFiles(files) {
        // Tentiamo di riportare il focus sulla finestra del browser per Windows
        try { window.focus(); } catch(e) {}

        if (!files || files.length === 0) {
            showToast('Nessun file ricevuto.', 'error');
            return;
        }

        var MAX_PHOTOS = 30;
        var accepted = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.type.indexOf('image/') === 0 || /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(f.name)) {
                accepted.push(f);
            }
        }

        if (accepted.length === 0) {
            showToast('Nessuna immagine valida trovata.', 'error');
            return;
        }

        // Controllo Limite
        if (imagesList.length + accepted.length > MAX_PHOTOS) {
            var scartate = (imagesList.length + accepted.length) - MAX_PHOTOS;
            showToast('Limite di ' + MAX_PHOTOS + ' foto raggiunto. Solo le prime verranno caricate.', 'error');
            accepted = accepted.slice(0, Math.max(0, MAX_PHOTOS - imagesList.length));
            if (accepted.length === 0) return;
        }

        showToast(accepted.length + ' foto caricate con successo.', 'success');
        accepted.forEach(function(file) {
            compressImage(file, function(imgEl, dataUrl) {
                imagesList.push({ id: Date.now() + Math.random(), file: file, url: dataUrl, imgElement: imgEl });
                renderTimeline();
                updateButtons();
                drawFrame(0);
            });
        });
    }

    // --- Musica ---
    function handleMusicChange(input) {
        if (input.files.length > 0) {
            el('music-text').innerText = input.files[0].name;
            el('audio-player').src = URL.createObjectURL(input.files[0]);
        } else {
            el('music-text').innerText = 'Carica un MP3...';
            el('audio-player').src = '';
        }
    }

    // --- Canvas ---
    function updateCanvasAspect() {
        var canvas = el('video-canvas');
        var container = el('canvas-container');
        if (!canvas || !container) return;
        var format = el('video-format').value;
        var res = parseInt(el('video-quality').value) || 1080;
        var w, h;
        if (format === '9:16')      { h = res; w = Math.round(res * 9/16); container.style.aspectRatio = '9/16'; }
        else if (format === '16:9') { w = res; h = Math.round(res * 9/16); container.style.aspectRatio = '16/9'; }
        else                        { w = res; h = res; container.style.aspectRatio = '1/1'; }
        canvas.width = w; canvas.height = h;
        if (!isPlaying && !isRendering) drawPlaceholder();
    }

    function drawPlaceholder() {
        var canvas = el('video-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (imagesList.length === 0) {
            ctx.fillStyle = '#30363d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.font = '600 24px Outfit, sans-serif';
            ctx.fillText("L'Anteprima apparirà qui", canvas.width/2, canvas.height/2);
        }
    }

    function drawImageScaled(ctx, canvas, img, slideProgress, maxZoomFallback, customZoom) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        var cr = canvas.width / canvas.height, ir = img.width / img.height;
        var dw, dh;
        if (ir > cr) { dh = canvas.height; dw = img.width * (canvas.height / img.height); }
        else         { dw = canvas.width;  dh = img.height * (canvas.width / img.width); }
        
        // Calcolo Zoom Effettivo
        var scale = 1.0;
        var panX = 0, panY = 0;
        
        if (customZoom && customZoom.type) {
            // Zoom personalizzato
            var zLevel = parseInt(customZoom.level) || 1;
            var maxZoomCustom = 0.20; // Default level 1
            if (zLevel === 1) maxZoomCustom = 0.20;
            if (zLevel === 2) maxZoomCustom = 0.45;
            if (zLevel === 3) maxZoomCustom = 0.80;
            
            if (customZoom.type === 'in') {
                scale = 1.0 + (slideProgress * maxZoomCustom);
            } else if (customZoom.type === 'out') {
                scale = (1.0 + maxZoomCustom) - (slideProgress * maxZoomCustom);
            }
            
            // Pan verso le coordinate specifiche (x,y da 0.0 a 1.0)
            var targetX = customZoom.x !== undefined ? customZoom.x : 0.5;
            var targetY = customZoom.y !== undefined ? customZoom.y : 0.5;
            
            // Calcolo dell'offset dal centro
            var maxPanX = (targetX - 0.5) * dw; // Quanto ci si deve spostare al massimo
            var maxPanY = (targetY - 0.5) * dh;
            
            // Applica il pan proporzionale allo zoom attuale
            var currentPanFactor = 1.0 - (1.0 / scale); 
            panX = -maxPanX * currentPanFactor * scale;
            panY = -maxPanY * currentPanFactor * scale;

        } else if (maxZoomFallback > 0) {
            // Fallback Zoom Globale (centrato, in avanti)
            scale = 1.0 + slideProgress * maxZoomFallback;
        }

        var sw = dw * scale, sh = dh * scale;
        
        ctx.save();
        ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
        ctx.drawImage(img, -sw / 2, -sh / 2, sw, sh);
        ctx.restore();
    }

    function drawFrame(t) {
        var canvas = el('video-canvas');
        if (!canvas) return false;
        var ctx = canvas.getContext('2d');
        if (imagesList.length === 0) { drawPlaceholder(); return false; }

        var dur = parseInt(el('slide-duration').value) || 4;
        var zoom = parseFloat(el('zoom-amount').value) || 0;
        var trans = el('transition-type').value;
        var tText = el('video-title').value.trim();
        var tPlace = el('title-placement').value;

        var slides = [];
        if (tText && tPlace === 'intro') slides.push({ type: 'intro', text: tText });
        imagesList.forEach(function(item) { slides.push({ type: 'image', item: item }); });

        var total = slides.length * dur;
        var loopT = isPlaying ? t % total : t;
        if (!isPlaying && t >= total) return false;

        var ci = Math.floor(loopT / dur);
        var ni = (ci + 1) % slides.length;
        var slideT = loopT % dur;
        var slideProg = slideT / dur;
        var fadeDur = trans === 'fade' ? Math.min(1.0, dur/3) : 0;
        var overlapStart = dur - fadeDur;

        function _draw(slide, prog, alpha) {
            ctx.globalAlpha = alpha;
            if (slide.type === 'intro') {
                var grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                var c1 = el('title-bg-color-1') ? el('title-bg-color-1').value : '#58a6ff';
                var c2 = el('title-bg-color-2') ? el('title-bg-color-2').value : '#a371f7';
                grad.addColorStop(0, c1); grad.addColorStop(1, c2);
                ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.font = 'bold ' + Math.max(28, Math.round(canvas.width*0.07)) + 'px Outfit,sans-serif';
                ctx.fillText(slide.text, canvas.width/2, canvas.height/2);
            } else {
                var zoomData = slide.item.zoom ? slide.item.zoom : null;
                drawImageScaled(ctx, canvas, slide.item.imgElement, prog, zoom, zoomData);
                if (tPlace === 'overlay' && slides.indexOf(slide) === 0 && tText) {
                    ctx.save();
                    ctx.fillStyle = '#fff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.font = 'bold ' + Math.round(canvas.width*0.06) + 'px Outfit,sans-serif';
                    
                    // Ombra sottile per leggibilità su sfondi chiari
                    ctx.shadowColor = 'rgba(0,0,0,0.6)';
                    ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = 2;
                    ctx.shadowOffsetY = 2;
                    
                    ctx.fillText(tText, canvas.width/2, canvas.height/2);
                    ctx.restore();
                }
            }
        }

        if (slideT > overlapStart && fadeDur > 0) {
            var fp = (slideT - overlapStart) / fadeDur;
            _draw(slides[ci], slideProg, 1.0 - fp);
            if (!isRendering || ci < slides.length-1) _draw(slides[ni], 0, fp);
        } else {
            _draw(slides[ci], slideProg, 1.0);
        }
        ctx.globalAlpha = 1.0;
        return true;
    }

    // --- Timeline ---
    function renderTimeline() {
        var tl = el('timeline');
        if (!tl) return;
        if (imagesList.length === 0) {
            tl.innerHTML = '<div class="empty-timeline">Carica alcune foto per iniziare</div>';
            return;
        }
        tl.innerHTML = '';
        imagesList.forEach(function(item, index) {
            var div = document.createElement('div');
            div.className = 'timeline-item';
            div.draggable = true;

            div.addEventListener('dragstart', function(e) { draggedIndex = index; div.style.opacity='0.5'; e.stopPropagation(); });
            div.addEventListener('dragend',   function()  { div.style.opacity='1'; draggedIndex = null; });
            div.addEventListener('dragenter', function(e) {
                e.preventDefault(); e.stopPropagation();
                if (draggedZoom) div.style.borderColor='var(--success)';
                else div.style.borderColor='rgba(88,166,255,.8)';
            });
            div.addEventListener('dragover',  function(e) { e.preventDefault(); e.stopPropagation(); });
            div.addEventListener('dragleave', function()  { div.style.borderColor='transparent'; });
            div.addEventListener('drop', function(e) {
                e.preventDefault(); e.stopPropagation();
                div.style.borderColor = 'transparent';
                
                if (draggedZoom) {
                    // Applicare zoom custom all'immagine
                    var rect = div.getBoundingClientRect();
                    // Calcolo della posizione relativa all'immagine (0.0 - 1.0)
                    var xPct = (e.clientX - rect.left) / rect.width;
                    var yPct = (e.clientY - rect.top) / rect.height;
                    
                    imagesList[index].zoom = {
                        type: draggedZoom.type,
                        level: draggedZoom.level,
                        x: xPct,
                        y: yPct
                    };
                    showToast('Zoom ' + draggedZoom.type.toUpperCase() + ' (Liv.' + draggedZoom.level + ') applicato!', 'success');
                    draggedZoom = null;
                    renderTimeline(); drawFrame(0);
                } else if (draggedIndex !== null && draggedIndex !== index) {
                    // Riordino foto
                    var moved = imagesList.splice(draggedIndex, 1)[0];
                    imagesList.splice(index, 0, moved);
                    draggedIndex = null;
                    renderTimeline(); drawFrame(0);
                }
            });

            // Gestione Click per applicare Zoom su Mobile/Touch
            div.addEventListener('click', function(e) {
                // Se si sta cliccando un bottone (rimuovi, sposta) ignoriamo l'applicazione dello zoom
                if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.zoom-badge')) return;

                if (activeZoomClickType) {
                    var rect = div.getBoundingClientRect();
                    var xPct = (e.clientX - rect.left) / rect.width;
                    var yPct = (e.clientY - rect.top) / rect.height;
                    
                    imagesList[index].zoom = {
                        type: activeZoomClickType,
                        level: activeZoomClickLevel,
                        x: xPct,
                        y: yPct
                    };
                    
                    showToast('Zoom applicato!', 'success');
                    
                    // Deseleziona strumento dopo l'uso per evitare click accidentali successivi
                    var allBtns = document.querySelectorAll('.zoom-btn');
                    allBtns.forEach(function(b) { b.classList.remove('selected'); });
                    activeZoomClickType = null;
                    activeZoomClickLevel = null;
                    
                    renderTimeline(); drawFrame(0);
                }
            });

            var img = document.createElement('img'); img.src = item.url;
            var badge = document.createElement('div'); badge.className='turn-badge'; badge.innerText = index+1;
            
            var zBadge = document.createElement('div'); 
            zBadge.className = 'zoom-badge' + (item.zoom ? ' active' : '');
            zBadge.title = 'Rimuovi Zoom Personalizzato'; // Tooltip
            if (item.zoom) {
                zBadge.innerHTML = '<i class="fa-solid fa-magnifying-glass-' + (item.zoom.type==='in'?'plus':'minus') + '"></i>';
                // Click per rimuovere l'effetto
                zBadge.onclick = function(e) {
                    e.stopPropagation();
                    delete item.zoom;
                    showToast('Zoom personalizzato rimosso.', 'success');
                    renderTimeline(); 
                    drawFrame(0);
                };
            }

            var btnR = document.createElement('button'); btnR.className='remove-btn'; btnR.innerHTML='<i class="fa-solid fa-xmark"></i>';
            btnR.onclick = function(e) { e.stopPropagation(); imagesList.splice(index,1); renderTimeline(); updateButtons(); drawFrame(0); };
            var btnL = document.createElement('button'); btnL.className='move-btn move-left'; btnL.innerHTML='<i class="fa-solid fa-chevron-left"></i>';
            if (index===0) btnL.style.display='none';
            btnL.onclick = function(e) { e.stopPropagation(); if(index>0){var t=[imagesList[index],imagesList[index-1]];imagesList[index-1]=t[0];imagesList[index]=t[1];renderTimeline();drawFrame(0);} };
            var btnRR = document.createElement('button'); btnRR.className='move-btn move-right'; btnRR.innerHTML='<i class="fa-solid fa-chevron-right"></i>';
            if (index===imagesList.length-1) btnRR.style.display='none';
            btnRR.onclick = function(e) { e.stopPropagation(); if(index<imagesList.length-1){var t=[imagesList[index],imagesList[index+1]];imagesList[index+1]=t[0];imagesList[index]=t[1];renderTimeline();drawFrame(0);} };

            div.appendChild(img); div.appendChild(badge); div.appendChild(zBadge); div.appendChild(btnR); div.appendChild(btnL); div.appendChild(btnRR);
            tl.appendChild(div);
        });
    }

    function updateButtons() {
        var ready = imagesList.length > 0;
        var bp = el('btn-preview');
        var br1 = el('btn-render-mp4');
        var br2 = el('btn-render-webm');
        if (bp) bp.disabled = !ready || isRendering;
        if (br1) br1.disabled = !ready || isRendering;
        if (br2) br2.disabled = !ready || isRendering;
    }

    // --- Anteprima ---
    function togglePreview() {
        var audio = el('audio-player');
        var bp = el('btn-preview');
        if (isPlaying) {
            isPlaying = false;
            cancelAnimationFrame(animationId);
            el('canvas-container').classList.remove('playing');
            if (bp) bp.innerHTML = '<i class="fa-solid fa-eye"></i> <span>Avvia Anteprima</span>';
            if (audio) audio.pause();
            drawFrame(0);
        } else {
            isPlaying = true; startTime = 0;
            el('canvas-container').classList.add('playing');
            if (bp) bp.innerHTML = '<i class="fa-solid fa-stop"></i> <span>Ferma Anteprima</span>';
            if (audio && audio.src) { 
                if (audioContext && audioSourceNode) {
                    try { audioSourceNode.disconnect(); } catch(e) {}
                    audioSourceNode.connect(audioContext.destination);
                }
                audio.currentTime=0; 
                audio.play().catch(function(){}); 
            }
            requestAnimationFrame(function loop(ts) {
                if (!isPlaying) return;
                if (!startTime) startTime = ts;
                drawFrame((ts - startTime) / 1000);
                animationId = requestAnimationFrame(loop);
            });
        }
    }

    // --- Render ---
    function startRender(targetFormat) {
        if (imagesList.length === 0 || isRendering) return;
        if (isPlaying) togglePreview();
        isRendering = true; 
        updateButtons();
        
        targetFormat = targetFormat || 'mp4';
        
        var progressContainer = el('progress-container');
        var progressBar = el('progress-bar');
        var progressText = el('progress-text');
        
        if (progressContainer) progressContainer.style.display = 'block';
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.innerText = "Inizio rendering...";

        try {
            updateCanvasAspect();
            drawFrame(0); // Forza il disegno del primo frame prima dello stream

            var dur = parseInt(el('slide-duration').value) || 4;
            var tText = el('video-title').value.trim();
            var hasIntro = (tText && el('title-placement').value === 'intro');
            var totalSlides = (hasIntro ? 1 : 0) + imagesList.length;
            var totalDur = totalSlides * dur;
            var fps = 30;

            var canvas = el('video-canvas');
            var canvasStream = canvas.captureStream(fps);
            var finalStream = canvasStream;

            var audio = el('audio-player');
            var musicIn = el('music-input');
            if (musicIn && musicIn.files.length > 0 && audio && audio.src) {
                try {
                    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    if (!audioDestNode) audioDestNode = audioContext.createMediaStreamDestination();
                    if (!audioSourceNode) { 
                        audioSourceNode = audioContext.createMediaElementSource(audio); 
                    }
                    try { audioSourceNode.disconnect(); } catch(e) {}
                    audioSourceNode.connect(audioDestNode);
                    
                    audio.currentTime = 0; 
                    audio.play().catch(function(e) { console.warn("Audio play failed:", e); });
                    finalStream = new MediaStream(canvasStream.getVideoTracks().concat(audioDestNode.stream.getAudioTracks()));
                } catch(e) { console.warn('Audio setup failed:', e); }
            }

            var chunks = [];
            var types = [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm',
                'video/mp4'
            ];
            var mimeType = types.find(function(t) { return MediaRecorder.isTypeSupported(t); }) || 'video/webm';
            
            var recorder = new MediaRecorder(finalStream, { mimeType: mimeType });
            recorder.ondataavailable = function(e) { if (e.data.size > 0) chunks.push(e.data); };
            recorder.onstop = function() {
                if (audio) audio.pause();
                var blob = new Blob(chunks, { type: mimeType });
                var url = URL.createObjectURL(blob);
                
                // Sanitizza titolo per il file
                var rawTitle = el('video-title').value.trim() || 'video_memory';
                var safeTitle = rawTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'video';
                
                if (chunks.length === 0) {
                    showToast("Errore: Nessun dato video generato.", "error");
                    isRendering = false;
                    updateButtons();
                    return;
                }
                
                var dlWebm = el('download-link-webm');
                var dlMp4 = el('download-link-mp4');
                
                // Definiamo i nomi file. Forziamo .mp4 per la massima compatibilità utente
                var filenameMp4 = safeTitle + ".mp4";
                var filenameWebm = safeTitle + ".webm";

                if (dlWebm) {
                    dlWebm.href = url;
                    dlWebm.download = filenameWebm;
                }
                
                if (dlMp4) {
                    dlMp4.href = url;
                    dlMp4.download = filenameMp4;
                }

                // Configura Player Anteprima Video
                var vidPreview = el('final-video-preview');
                if (vidPreview) {
                    vidPreview.src = url;
                    vidPreview.loop = true;
                    vidPreview.autoplay = true;
                    vidPreview.muted = false; 
                    
                    // Forza il loop per file senza metadati di durata (WebM)
                    vidPreview.onended = function() {
                        this.currentTime = 0;
                        this.play();
                    };
                    
                    // Fallback basato sulla durata calcolata durante il render
                    var expectedDur = totalDur; 
                    vidPreview.ontimeupdate = function() {
                        if (this.currentTime >= expectedDur - 0.3) {
                            this.currentTime = 0;
                            this.play();
                        }
                    };
                    
                    vidPreview.style.display = 'block';
                    vidPreview.load();
                }

                // --- TRIGGER DOWNLOAD AUTOMATICO (solo Desktop) ---
                var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (!isMobile && blob.size > 0) {
                    try {
                        var autoDl = document.createElement('a');
                        autoDl.href = url;
                        autoDl.download = (targetFormat === 'webm') ? filenameWebm : filenameMp4;
                        autoDl.style.display = 'none';
                        document.body.appendChild(autoDl);
                        autoDl.click();
                        setTimeout(function() { document.body.removeChild(autoDl); }, 100);
                        showToast("Download avviato!", "success");
                    } catch(e) { console.error("Auto-download failed:", e); }
                } else if (isMobile) {
                    showToast("Video pronto! Usa i tasti sotto per salvare.", "success");
                }

                try {
                    // Supporto Condivisione Nativa (Mobile/iOS)
                    var btnShare = el('btn-share-native');
                    if (btnShare) {
                        if (navigator.share && navigator.canShare) {
                            try {
                                var fileToShare = new File([blob], filenameMp4, { type: (targetFormat === 'mp4') ? mimeType : 'video/mp4' });
                                if (navigator.canShare({ files: [fileToShare] })) {
                                    btnShare.style.display = 'inline-flex';
                                    btnShare.onclick = function() {
                                        navigator.share({
                                            title: rawTitle || 'Il mio video Memory2',
                                            text: 'Guarda il mio video creato con Memory Composer!',
                                            files: [fileToShare]
                                        }).catch(function(err) {
                                            console.log("Condivisione annullata/fallita:", err);
                                        });
                                    };
                                } else {
                                    btnShare.style.display = 'none';
                                }
                            } catch(e) {
                                btnShare.style.display = 'none';
                            }
                        } else {
                            btnShare.style.display = 'none';
                        }
                    }
                } finally {
                    isRendering = false; 
                    updateButtons();
                    if (progressContainer) progressContainer.style.display = 'none';
                    if (progressBar) progressBar.style.width = '0%';
                    el('download-modal').classList.add('active');
                }
            };
            
            recorder.start();

            var firstStamp = null;
            requestAnimationFrame(function renderLoop(ts) {
                if (!isRendering) return;
                if (!firstStamp) firstStamp = ts;
                
                var elapsed = Math.max(0, (ts - firstStamp) / 1000);
                drawFrame(elapsed);
                
                var pct = Math.min(100, Math.round((elapsed / totalDur) * 100));
                if (progressBar) progressBar.style.width = pct + '%';
                if (progressText) progressText.innerText = 'Rendering... ' + pct + '%';
                
                if (elapsed >= totalDur) { 
                    recorder.stop(); 
                } else { 
                    requestAnimationFrame(renderLoop); 
                }
            });

        } catch (err) {
            console.error("Render Error:", err);
            showToast("Errore durante il rendering: " + err.message, "error");
            isRendering = false;
            updateButtons();
            if (progressContainer) progressContainer.style.display = 'none';
        }
    }

    // --- Avvio ---
    window.addEventListener('load', function() {
        updateCanvasAspect();
        drawPlaceholder();
        renderTimeline();
        updateButtons();
    });

    // --- Gestore Zoom Drag & Click ---
    function handleZoomDrag(e, type, level) {
        e.dataTransfer.setData('text/plain', type); // Required for FireFox
        draggedZoom = { type: type, level: level };
    }

    function handleZoomClick(type, level, btnEl) {
        var allBtns = document.querySelectorAll('.zoom-btn');
        var isSelected = btnEl.classList.contains('selected');
        
        allBtns.forEach(function(b) { b.classList.remove('selected'); });
        
        if (isSelected) {
            activeZoomClickType = null;
            activeZoomClickLevel = null;
            showToast('Zoom deselezionato.', 'success');
        } else {
            btnEl.classList.add('selected');
            activeZoomClickType = type;
            activeZoomClickLevel = level;
            showToast('Effetto ' + type.toUpperCase() + ' (Liv.' + level + ') pronto! Tocca il centro di una foto per applicarlo.', 'success');
        }
    }

    // --- Espone l'API globale ---
    window.Memory = {
        handleFiles: handleFiles,
        handleMusicChange: handleMusicChange,
        updateCanvasAspect: updateCanvasAspect,
        togglePreview: togglePreview,
        startRender: startRender,
        handleZoomDrag: handleZoomDrag,
        handleZoomClick: handleZoomClick,
        get draggedIndex() { return draggedIndex; },
        forceRedraw: function() { drawFrame(0); }
    };

}());
