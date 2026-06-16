
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

  // ===== UNIFIED GALLERY (featured + thumbnail strip, 10s autoplay) =====
  document.querySelectorAll('.ugal').forEach(root=>{
    const count = parseInt(root.dataset.count, 10) || 0;
    const base  = root.dataset.path || 'images/gallery';
    if(count < 1) return;
    const bg     = root.querySelector('.ugal-bg');
    const feat   = root.querySelector('.ugal-featured');
    const thumbs = root.querySelector('.ugal-thumbs');
    const toggle = root.querySelector('.ugal-toggle');
    const pad = n => String(n + 1).padStart(2, '0');

    let html = '';
    for(let i = 0; i < count; i++){
      html += `<button class="ugal-thumb" type="button" role="tab" aria-label="Photo ${i+1}" data-i="${i}"><img src="${base}/thumb/${pad(i)}.webp" alt="" loading="lazy"></button>`;
    }
    thumbs.innerHTML = html;
    const thumbEls = Array.from(thumbs.querySelectorAll('.ugal-thumb'));

    let idx = 0, timer = null, playing = false;
    const DELAY = 10000;

    function show(i){
      idx = (i + count) % count;
      const src = `${base}/large/${pad(idx)}.webp`;
      feat.src = src; bg.src = src;
      thumbEls.forEach((t, k)=>{
        const on = k === idx;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      const at = thumbEls[idx];
      if(at){
        // center the active thumb inside the strip only — never scroll the page
        const c = thumbs.getBoundingClientRect();
        const r = at.getBoundingClientRect();
        const left = thumbs.scrollLeft + (r.left - c.left) - (c.width - r.width) / 2;
        thumbs.scrollTo({ left, behavior:'smooth' });
      }
    }
    function play(){
      if(timer) clearInterval(timer);
      if(count > 1) timer = setInterval(()=>show(idx + 1), DELAY);
      playing = true; root.classList.remove('is-paused');
      if(toggle) toggle.setAttribute('aria-label', 'Pause slideshow');
    }
    function pause(){
      if(timer){ clearInterval(timer); timer = null; }
      playing = false; root.classList.add('is-paused');
      if(toggle) toggle.setAttribute('aria-label', 'Play slideshow');
    }
    const step = d => { show(idx + d); if(playing) play(); };   // play() also resets the timer

    root.querySelector('.ugal-nav.prev')?.addEventListener('click', ()=> step(-1));
    root.querySelector('.ugal-nav.next')?.addEventListener('click', ()=> step(1));
    toggle?.addEventListener('click', ()=> playing ? pause() : play());
    thumbs.addEventListener('click', e=>{
      const b = e.target.closest('.ugal-thumb'); if(!b) return;
      show(parseInt(b.dataset.i, 10));
      if(playing) play();
    });

    show(0);
    play();
  });

  // ===== REVIEWS TICKER (duplicate cards once for a seamless right→left loop) =====
  (function(){
    const track = document.querySelector('.reviews-track');
    if(!track || track.children.length < 2) return;
    const clones = [...track.children].map(c => {
      const n = c.cloneNode(true);
      n.setAttribute('aria-hidden', 'true');
      return n;
    });
    clones.forEach(n => track.appendChild(n));   // two identical halves → 50% loop is seamless
  })();

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

  // ===== SERVICES: package card flip — the whole card is clickable =====
  // Click anywhere on the front to see details; click anywhere on the back to
  // go back. Links (e.g. "Book This Package") still navigate instead of flipping.
  function setFlipped(card, flipped){
    const inner   = card.querySelector('.pkg-inner');
    const trigger = card.querySelector('.pkg-flip-btn');
    const back    = card.querySelector('.pkg-back');
    inner.classList.toggle('is-flipped', flipped);
    if(trigger) trigger.setAttribute('aria-expanded', flipped ? 'true' : 'false');
    if(back)    back.setAttribute('aria-hidden', flipped ? 'false' : 'true');
  }
  document.querySelectorAll('.pkg-card').forEach(card=>{
    card.addEventListener('click', e=>{
      if(e.target.closest('a')) return;   // let real links (Book This Package) work
      const inner = card.querySelector('.pkg-inner');
      if(!inner) return;
      setFlipped(card, !inner.classList.contains('is-flipped'));
    });
  });
  // keep the old global a no-op in case any inline handler lingers
  window.flipCard = function(){};

  // ===== RENTALS: click an image → modal with the whole image + description =====
  (function(){
    const modal = document.getElementById('rmodal');
    if(!modal) return;
    const mImg   = modal.querySelector('#rmodalImg');
    const mTitle = modal.querySelector('#rmodalTitle');
    const mPrice = modal.querySelector('#rmodalPrice');
    const mDesc  = modal.querySelector('#rmodalDesc');
    let lastFocus = null;

    function openModal(card){
      const img   = card.querySelector('.rental-media img');
      const title = card.querySelector('h3');
      const price = card.querySelector('.rental-price');
      const desc  = card.querySelector('.rental-body > p');
      if(img){ mImg.src = img.dataset.full || img.currentSrc || img.src; mImg.alt = title ? title.textContent : ''; }
      mTitle.textContent = title ? title.textContent : '';
      mPrice.textContent = price ? price.textContent : '';
      mDesc.textContent  = desc ? desc.textContent : '';
      lastFocus = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      modal.querySelector('.rmodal-close').focus({ preventScroll:true });
    }
    function closeModal(){
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if(lastFocus) lastFocus.focus({ preventScroll:true });
    }
    document.querySelectorAll('.rental-card .rental-media').forEach(m=>{
      m.setAttribute('role', 'button');
      m.setAttribute('tabindex', '0');
      m.setAttribute('aria-label', 'View larger image');
      m.addEventListener('click', ()=> openModal(m.closest('.rental-card')));
      m.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openModal(m.closest('.rental-card')); } });
    });
    modal.addEventListener('click', e=>{ if(e.target.hasAttribute('data-close')) closeModal(); });
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && modal.classList.contains('is-open')) closeModal(); });
  })();

  // ===== MASCOTS: subtle cursor parallax =====
  (function(){
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    const mascots = document.querySelectorAll('.mascot');
    if(!mascots.length || reduce) return;
    window.addEventListener('mousemove', (e)=>{
      const cx = e.clientX / window.innerWidth  - 0.5;   // -0.5 … 0.5
      const cy = e.clientY / window.innerHeight - 0.5;
      mascots.forEach(m=>{
        const d = parseFloat(m.dataset.depth || '16');
        m.style.transform = `translate(${(-cx*d).toFixed(1)}px, ${(-cy*d).toFixed(1)}px)`;
      });
    }, { passive:true });
  })();

  // ===== HERO SHOWCASE: cycle the big frame every 5s (with CSS zoom-out) =====
  (function(){
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if(reduce) return;
    const stage = document.querySelector('.hero-stage');
    if(!stage) return;
    const slides = stage.querySelectorAll('.hg-slide');
    if(slides.length < 2) return;
    let i = 0;
    setInterval(()=>{
      slides[i].classList.remove('is-active');
      let n;
      do { n = Math.floor(Math.random() * slides.length); } while(n === i && slides.length > 1);
      i = n;
      slides[i].classList.add('is-active');
    }, 8000);
  })();

  // ===== custom dropdowns (brand-styled open state) — enhances every .field select =====
  (function(){
    const chev = '<svg class="cselect-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    document.querySelectorAll('.field select').forEach(sel=>{
      const wrap = document.createElement('div'); wrap.className = 'cselect';
      sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'cselect-btn';
      btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span class="cselect-val"></span>' + chev;
      const list = document.createElement('div'); list.className = 'cselect-list'; list.setAttribute('role', 'listbox');
      Array.from(sel.options).forEach((o, i)=>{
        const it = document.createElement('div');
        it.className = 'cselect-opt'; it.setAttribute('role', 'option');
        it.textContent = o.textContent; it.dataset.i = i;
        list.appendChild(it);
      });
      wrap.appendChild(btn); wrap.appendChild(list);
      const valEl = btn.querySelector('.cselect-val');
      const opts = Array.from(list.children);
      function sync(){
        const o = sel.options[sel.selectedIndex];
        valEl.textContent = o ? o.textContent : '';
        opts.forEach((it, i)=> it.setAttribute('aria-selected', i === sel.selectedIndex ? 'true' : 'false'));
      }
      const close = ()=>{ wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
      const open  = ()=>{ wrap.classList.add('open');  btn.setAttribute('aria-expanded', 'true'); };
      sync();
      btn.addEventListener('click', ()=> wrap.classList.contains('open') ? close() : open());
      list.addEventListener('click', e=>{
        const it = e.target.closest('.cselect-opt'); if(!it) return;
        sel.selectedIndex = +it.dataset.i; sel.dispatchEvent(new Event('change')); close(); btn.focus();
      });
      sel.addEventListener('change', sync);
      document.addEventListener('click', e=>{ if(!wrap.contains(e.target)) close(); });
      document.addEventListener('keydown', e=>{ if(e.key === 'Escape') close(); });
    });
  })();

  // ===== CONTACT: pre-select package from ?package= (set by "Book This Package") =====
  (function(){
    const sel = document.getElementById('packageSelect');
    if(!sel) return;
    const wanted = new URLSearchParams(location.search).get('package');
    if(!wanted) return;
    const match = Array.from(sel.options).find(o => o.value === wanted);
    if(match){
      sel.value = wanted;
      sel.dispatchEvent(new Event('change'));   // keep the custom dropdown label in sync
      const field = sel.closest('.field');
      if(field) field.style.scrollMarginTop = '100px';
    }
  })();
