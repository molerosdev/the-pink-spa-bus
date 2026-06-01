
  // ===== FORM CONFIG =====
  // Forms POST to a Cloudflare Pages Function (functions/api/submit.js) that emails via Resend.
  // Set RESEND_API_KEY (+ MAIL_TO, MAIL_FROM) as env vars in the Cloudflare Pages dashboard.
  // When opened from file:// (no server) the forms run in safe DEMO mode (nothing is sent).
  const FORM_CONFIG = {
    endpoint: '/api/submit',
    businessName: 'The Pink Spa Bus'
  };
  const DEMO_MODE = location.protocol === 'file:';

  // language toggle (EN / ES)
  function setLang(lang){
    document.querySelectorAll('.lang-toggle button').forEach(b=>b.classList.toggle('active', b.dataset.lang===lang));
    document.querySelectorAll('[data-en]').forEach(el=>{
      const txt = el.dataset[lang]; if(txt!==undefined) el.innerHTML = txt;
    });
    document.documentElement.lang = lang;
    currentLang = lang;
    if(typeof renderGallery === 'function') renderGallery();
  }
  let currentLang = 'en';

  // multi-step form
  function goStep(n){
    const agree = document.getElementById('agree');
    if(n===2 && agree && !agree.checked){
      alert(currentLang==='es' ? 'Por favor acepte el aviso para continuar.' : 'Please accept the disclosure to continue.');
      return;
    }
    document.querySelectorAll('.step-pane').forEach(p=>p.classList.toggle('active', +p.dataset.step===n));
    document.querySelectorAll('.step-node').forEach(s=>{
      const sn = +s.dataset.step;
      s.classList.toggle('active', sn===n);
      s.classList.toggle('done', sn<n);
    });
    document.querySelector('#disclosure .disclosure-card').scrollIntoView({behavior:'smooth', block:'start'});
  }

  // add child
  let childCount = 1;
  function addChild(){
    childCount++;
    const list = document.getElementById('children-list');
    const block = document.createElement('div');
    block.className = 'child-block';
    block.dataset.child = childCount;
    const isEs = currentLang==='es';
    block.innerHTML = `
      <span class="num">${childCount}</span>
      <button type="button" class="remove" onclick="this.parentNode.remove()">${isEs?'Quitar':'Remove'}</button>
      <div class="field-row">
        <div class="field">
          <label>${isEs?'Nombre del niño':'Child name'}</label>
          <input type="text">
        </div>
        <div class="field">
          <label>${isEs?'Edad':'Age'}</label>
          <input type="number" min="3" max="14">
        </div>
      </div>
      <div class="field" style="margin-bottom:0">
        <label>${isEs?'Alergias / notas':'Allergies / notes'}</label>
        <input type="text">
      </div>
    `;
    list.appendChild(block);
  }

  // signature pad
  (function(){
    const canvas = document.getElementById('sig-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const placeholder = document.getElementById('sig-placeholder');
    function size(){
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * (window.devicePixelRatio||1);
      canvas.height = r.height * (window.devicePixelRatio||1);
      ctx.scale(window.devicePixelRatio||1, window.devicePixelRatio||1);
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = '#2B1B22';
    }
    setTimeout(size, 50);
    window.addEventListener('resize', size);
    let drawing=false, last=null;
    function pos(e){
      const r = canvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX-r.left, y: t.clientY-r.top };
    }
    function start(e){ drawing=true; last=pos(e); placeholder.style.opacity='0'; }
    function move(e){
      if(!drawing) return; e.preventDefault();
      const p = pos(e);
      ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke();
      last=p;
    }
    function end(){ drawing=false; }
    canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move);
    canvas.addEventListener('mouseup',end); canvas.addEventListener('mouseleave',end);
    canvas.addEventListener('touchstart',start,{passive:false});
    canvas.addEventListener('touchmove',move,{passive:false});
    canvas.addEventListener('touchend',end);
    let hasInk = false;
    const _start = start;
    canvas.addEventListener('mousedown', ()=>hasInk=true);
    canvas.addEventListener('touchstart', ()=>hasInk=true);
    window.clearSig = function(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      placeholder.style.opacity='1'; hasInk=false;
    };
    window.getSignature = function(){ return hasInk ? canvas.toDataURL('image/png') : ''; };
  })();

  // ---- field collection helpers ----
  function collectFields(scope, skipInsideSelector){
    const out = {};
    scope.querySelectorAll('.field').forEach(f=>{
      if(skipInsideSelector && f.closest(skipInsideSelector)) return;
      const labelEl = f.querySelector('label');
      const input = f.querySelector('input, textarea, select');
      if(!labelEl || !input) return;
      const label = labelEl.textContent.trim();
      if(input.value) out[label] = input.value;
    });
    return out;
  }

  // POST a structured payload to the Cloudflare Pages Function (Resend). Returns Promise<boolean>.
  async function sendForm(payload){
    if(DEMO_MODE){
      console.warn('[DEMO MODE] file:// — not sending. Payload:', payload);
      return true; // let the UI complete so the demo still feels real
    }
    try{
      const res = await fetch(FORM_CONFIG.endpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(()=>({}));
      return res.ok && data.ok !== false;
    }catch(err){
      console.error('Form submit failed', err);
      return false;
    }
  }

  // ---- disclosure / waiver submit ----
  async function submitForm(){
    const card = document.querySelector('#disclosure .disclosure-card');
    const fields = collectFields(card, '.child-block');

    // children blocks → structured list
    const children = [];
    card.querySelectorAll('.child-block').forEach((b,i)=>{
      const f = collectFields(b);
      const parts = Object.entries(f).map(([k,v])=>`${k}: ${v}`).join(' · ');
      if(parts) children.push(`Child ${i+1} — ${parts}`);
    });

    const payload = {
      type: 'waiver',
      subject: 'New Spa Party Disclosure',
      lang: currentLang,
      fields,
      children,
      accepted: !!document.getElementById('agree')?.checked,
      signature: (window.getSignature && window.getSignature()) || ''
    };

    const btn = event && event.target ? event.target : null;
    if(btn){ btn.disabled = true; btn.style.opacity = '.6'; }
    const ok = await sendForm(payload);
    if(btn){ btn.disabled = false; btn.style.opacity = ''; }

    if(ok){ goStep(6); }
    else { alert(currentLang==='es' ? 'No se pudo enviar. Inténtelo de nuevo o contáctenos por WhatsApp.' : 'Could not send. Please try again or reach us on WhatsApp.'); }
  }

  // ---- contact form submit ----
  async function contactSubmit(){
    const form = document.querySelector('#contact form');
    const payload = { type:'contact', subject:'New Contact Note', lang:currentLang, fields: collectFields(form) };
    const btn = form.querySelector('button[type="submit"]');
    const orig = btn ? btn.textContent : '';
    if(btn){ btn.disabled = true; btn.textContent = currentLang==='es' ? 'Enviando…' : 'Sending…'; }
    const ok = await sendForm(payload);
    if(btn){ btn.disabled = false; btn.textContent = orig; }
    if(ok){
      form.reset();
      alert(currentLang==='es' ? '¡Gracias! Le contactaremos en 24 horas.' : 'Thank you! We will be in touch within 24 hours.');
    } else {
      alert(currentLang==='es' ? 'No se pudo enviar. Inténtelo de nuevo o contáctenos por WhatsApp.' : 'Could not send. Please try again or reach us on WhatsApp.');
    }
  }

  // smooth scroll + close mobile menu on click
  document.querySelectorAll('nav.site a[href^="#"]').forEach(a=>{
    a.addEventListener('click', ()=>document.getElementById('nav').classList.remove('open'));
  });

  // ===== GALLERY =====
  // To add an event (up to 6): create images/gallery/<slug>/large/NN.jpg + thumb/NN.jpg
  // (NN = 01,02,…), then add an entry below. `count` = how many photos in that event.
  const GALLERY = [
    { title: "Emma's Birthday", slug: "emmas-birthday", count: 10 }
    // { title: "Sofia's 7th", slug: "sofias-7th", count: 8 },
  ];
  const GALLERY_MIN_TILES = 3; // pad with "coming soon" cards for a balanced grid

  function renderGallery(){
    const grid = document.getElementById('gallery-grid');
    if(!grid) return;
    let html = '';
    GALLERY.forEach((ev, i)=>{
      const cover = `images/gallery/${ev.slug}/thumb/01.jpg`;
      const label = currentLang==='es' ? 'fotos' : 'photos';
      html += `<button class="event-card" onclick="openEvent(${i})" aria-label="${ev.title} — ${ev.count} ${label}">
        <img class="cover" src="${cover}" alt="${ev.title}" loading="lazy">
        <span class="cap"><span class="title">${ev.title}</span><span class="count">${ev.count} ${label}</span></span>
      </button>`;
    });
    for(let p = GALLERY.length; p < GALLERY_MIN_TILES; p++){
      html += `<div class="event-card soon"><span>${currentLang==='es' ? 'Más celebraciones pronto' : 'More celebrations soon'}</span></div>`;
    }
    grid.innerHTML = html;
  }

  // ===== LIGHTBOX =====
  let lbEvent = null, lbIndex = 0;
  function openEvent(i){
    lbEvent = GALLERY[i]; lbIndex = 0;
    document.getElementById('lightbox').classList.add('open');
    document.getElementById('lightbox').setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    showLbImage();
  }
  function showLbImage(){
    if(!lbEvent) return;
    const n = String(lbIndex+1).padStart(2,'0');
    document.getElementById('lb-img').src = `images/gallery/${lbEvent.slug}/large/${n}.jpg`;
    document.getElementById('lb-img').alt = `${lbEvent.title} — ${lbIndex+1}/${lbEvent.count}`;
    document.getElementById('lb-cap').textContent = `${lbEvent.title} · ${lbIndex+1} / ${lbEvent.count}`;
  }
  function lbStep(d){
    if(!lbEvent) return;
    lbIndex = (lbIndex + d + lbEvent.count) % lbEvent.count;
    showLbImage();
  }
  function closeLightbox(){
    document.getElementById('lightbox').classList.remove('open');
    document.getElementById('lightbox').setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    lbEvent = null;
  }
  const _lb = document.getElementById('lightbox');
  if(_lb){ _lb.addEventListener('click', e=>{ if(e.target.id === 'lightbox') closeLightbox(); }); }
  document.addEventListener('keydown', e=>{
    const lb = document.getElementById('lightbox');
    if(!lb || !lb.classList.contains('open')) return;
    if(e.key === 'Escape') closeLightbox();
    else if(e.key === 'ArrowLeft') lbStep(-1);
    else if(e.key === 'ArrowRight') lbStep(1);
  });

  renderGallery();

  // ===== EXPERIENCE CAROUSEL (auto-rotating crossfade) =====
  (function(){
    const car = document.getElementById('expCarousel');
    if(!car) return;
    const slides = car.querySelectorAll('.exp-slide');
    if(slides.length < 2) return;
    let i = 0;
    setInterval(()=>{
      slides[i].classList.remove('is-active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('is-active');
    }, 4000);
  })();
