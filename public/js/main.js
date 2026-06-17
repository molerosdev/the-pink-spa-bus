
  // ===== FORM CONFIG =====
  // Forms POST to Cloudflare Pages Functions that email via Resend + store in D1.
  // Set RESEND_API_KEY, MAIL_FROM, and the DB D1 binding in the Cloudflare Pages dashboard.
  // When opened from file:// (no server) the forms run in safe DEMO mode (nothing is sent).
  const FORM_CONFIG = {
    endpoint: '/api/submit',            // legacy contact/waiver endpoint
    disclosureEndpoint: '/api/disclosure/submit',
    editEndpoint: '/api/disclosure/edit',
    resendLinkEndpoint: '/api/disclosure/resend-link',
    businessName: 'The Pink Spa Bus'
  };
  const DEMO_MODE = location.protocol === 'file:';

  // ===== EDIT MODE — detect ?edit=TOKEN on page load =====
  let disclosureEditToken = null;
  (function detectEditMode(){
    const token = new URLSearchParams(location.search).get('edit');
    if (!token) return;
    disclosureEditToken = token;
    loadForEdit(token);
  })();

  // language toggle (EN / ES)
  function setLang(lang){
    document.querySelectorAll('.lang-toggle button').forEach(b=>b.classList.toggle('active', b.dataset.lang===lang));
    document.querySelectorAll('[data-en]').forEach(el=>{
      const txt = el.dataset[lang]; if(txt===undefined) return;
      const tag = el.tagName;
      if(tag==='INPUT'||tag==='TEXTAREA'){
        el.placeholder = txt;
      } else if(tag==='IMG'){
        el.alt = txt;
      } else {
        el.innerHTML = txt;
      }
    });
    document.documentElement.lang = lang;
    currentLang = lang;
    localStorage.setItem('lang', lang);
  }
  let currentLang = 'en';
  // restore persisted language on page load
  (function(){ const saved = localStorage.getItem('lang'); if(saved==='en'||saved==='es') setLang(saved); })();

  // multi-step form
  function goStep(n){
    const agree = document.getElementById('agree');
    if(n===2 && agree && !agree.checked){
      alert(currentLang==='es' ? 'Por favor acepte el aviso para continuar.' : 'Please accept the disclosure to continue.');
      return;
    }
    document.querySelectorAll('.step-pane').forEach(p=>p.classList.toggle('active', +p.dataset.step===n));
    // re-size the signature canvas when step V becomes visible
    if(n===5 && window._sigResize) setTimeout(window._sigResize, 30);
    document.querySelectorAll('.step-node').forEach(s=>{
      const sn = +s.dataset.step;
      s.classList.toggle('active', sn===n);
      s.classList.toggle('done', sn<n);
    });
    document.querySelector('#disclosure .disclosure-card').scrollIntoView({behavior:'smooth', block:'start'});
  }

  // ===== CHILDREN MANAGEMENT =====
  let childCount = 1;

  function updateChildCounter(){
    const max = parseInt(document.getElementById('f-num-children')?.value || '1', 10);
    const added = document.querySelectorAll('#children-list .child-block').length;
    const addedEl = document.getElementById('child-added-count');
    const maxEl = document.getElementById('child-max-count');
    if (addedEl) addedEl.textContent = added;
    if (maxEl) maxEl.textContent = max;
    // disable/enable the first child's remove button
    const removeBtn = document.getElementById('c1-remove-btn');
    if (removeBtn) removeBtn.disabled = added <= 1;
    // disable all remove buttons when only 1 child
    document.querySelectorAll('#children-list .child-block .remove').forEach(btn => {
      btn.disabled = added <= 1;
    });
  }

  // React to the number input changing
  (function(){
    const numInput = document.getElementById('f-num-children');
    if (!numInput) return;
    numInput.addEventListener('change', () => {
      const target = Math.min(20, Math.max(1, parseInt(numInput.value, 10) || 1));
      numInput.value = target;
      updateChildCounter();
    });
  })();

  function addChild(){
    const list = document.getElementById('children-list');
    const currentCount = list.querySelectorAll('.child-block').length;
    if (currentCount >= 20) {
      alert(currentLang === 'es' ? 'Máximo 20 niños permitidos.' : 'Maximum of 20 children allowed.');
      return;
    }
    childCount++;
    const n = childCount;
    const block = document.createElement('div');
    block.className = 'child-block';
    block.dataset.child = n;
    const isEs = currentLang === 'es';
    block.innerHTML = `
      <span class="num">${n}</span>
      <button type="button" class="remove" onclick="removeChild(this)" data-en="Remove" data-es="Quitar">${isEs ? 'Quitar' : 'Remove'}</button>
      <div class="field-row">
        <div class="field">
          <label>${isEs ? 'Nombre del niño' : 'Child name'}</label>
          <input type="text" placeholder="${isEs ? '' : 'Luna'}">
        </div>
        <div class="field">
          <label>${isEs ? 'Edad' : 'Age'}</label>
          <input type="number" min="3" max="14" placeholder="7">
        </div>
      </div>
      <div class="field">
        <label>${isEs ? 'Alergias / notas' : 'Allergies / notes'}</label>
        <input type="text" placeholder="${isEs ? 'Ninguna / especificar' : 'None / specify'}">
      </div>
      <div class="field">
        <label>${isEs ? 'Condiciones médicas' : 'Medical conditions'}</label>
        <input type="text" placeholder="${isEs ? 'Ninguna / especificar' : 'None / specify'}">
      </div>
      <div class="field" style="margin-bottom:0">
        <label>${isEs ? 'Instrucciones especiales' : 'Special instructions'}</label>
        <input type="text" placeholder="${isEs ? 'p.ej. solo cabello, sin esmalte' : 'e.g. hair-only, no nail polish'}">
      </div>
    `;
    list.appendChild(block);
    updateChildCounter();
  }

  function removeChild(btn){
    const block = btn.closest('.child-block');
    if (!block) return;
    const allBlocks = document.querySelectorAll('#children-list .child-block');
    if (allBlocks.length <= 1) return; // should not happen, but guard
    // Check if block has any data
    const hasData = Array.from(block.querySelectorAll('input')).some(i => i.value.trim());
    if (hasData) {
      const confirm = window.confirm(currentLang === 'es'
        ? '¿Eliminar este niño? Se perderán los datos ingresados.'
        : 'Remove this child? Any entered data will be lost.');
      if (!confirm) return;
    }
    block.remove();
    // Re-number remaining blocks
    document.querySelectorAll('#children-list .child-block').forEach((b, i) => {
      const numEl = b.querySelector('.num');
      if (numEl) numEl.textContent = i + 1;
      b.dataset.child = i + 1;
    });
    updateChildCounter();
  }

  // signature pad
  (function(){
    const canvas = document.getElementById('sig-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const placeholder = document.getElementById('sig-placeholder');
    function size(){
      const r = canvas.getBoundingClientRect();
      if(!r.width) return; // still hidden — skip
      canvas.width = r.width * (window.devicePixelRatio||1);
      canvas.height = r.height * (window.devicePixelRatio||1);
      ctx.scale(window.devicePixelRatio||1, window.devicePixelRatio||1);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1a0a2e';
    }
    window._sigResize = size;
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
    window.restoreSignature = function(dataUrl){
      const img = new Image();
      img.onload = function(){
        ctx.drawImage(img, 0, 0, canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height);
        placeholder.style.opacity='0';
        hasInk = true;
      };
      img.src = dataUrl.startsWith('data:') ? dataUrl : 'data:image/png;base64,' + dataUrl;
    };
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

  // ---- disclosure / waiver submit (new D1-backed version) ----
  async function submitDisclosure(evt){
    const btn = document.getElementById('submit-btn');
    if (btn) { btn.disabled = true; btn.style.opacity = '.6'; }

    // Collect children
    const children = [];
    document.querySelectorAll('#children-list .child-block').forEach(b => {
      const inputs = b.querySelectorAll('input');
      // order: name, age, allergies, medical, special
      children.push({
        name:      inputs[0] ? inputs[0].value.trim() : '',
        age:       inputs[1] ? inputs[1].value.trim() : '',
        allergies: inputs[2] ? inputs[2].value.trim() : '',
        medical:   inputs[3] ? inputs[3].value.trim() : '',
        special:   inputs[4] ? inputs[4].value.trim() : ''
      });
    });

    const sig = window.getSignature ? window.getSignature() : '';

    const payload = {
      customer_email:          (document.getElementById('f-email')?.value || '').trim(),
      parent_name:             (document.getElementById('f-parent-name')?.value || '').trim(),
      phone:                   (document.getElementById('f-phone')?.value || '').trim(),
      event_date:              (document.getElementById('f-event-date')?.value || '').trim(),
      event_address:           (document.getElementById('f-event-address')?.value || '').trim(),
      emergency_name:          (document.getElementById('f-emergency-name')?.value || '').trim(),
      emergency_relationship:  (document.getElementById('f-emergency-relationship')?.value || '').trim(),
      emergency_phone:         (document.getElementById('f-emergency-phone')?.value || '').trim(),
      signer_name:             (document.getElementById('f-signer-name')?.value || '').trim(),
      sig_date:                (document.getElementById('sig-date')?.value || '').trim(),
      waiver_accepted:         !!document.getElementById('agree')?.checked,
      signature_b64:           sig,
      children,
      lang:                    currentLang
    };

    // If in edit mode, submit as an update
    if (disclosureEditToken) {
      await submitDisclosureUpdate(payload, btn);
      return;
    }

    if (DEMO_MODE) {
      console.warn('[DEMO MODE] file:// — not sending. Payload:', payload);
      showSuccessStep({ refNumber: 'TPS-DISC-DEMO-000001', customerEmailSent: false }, payload);
      if (btn) { btn.disabled = false; btn.style.opacity = ''; }
      return;
    }

    try {
      const res = await fetch(FORM_CONFIG.disclosureEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (btn) { btn.disabled = false; btn.style.opacity = ''; }

      if (res.status === 409 && data.duplicate) {
        showDupPanel();
        return;
      }
      if (!res.ok || !data.ok) {
        alert(currentLang === 'es'
          ? 'No se pudo enviar. ' + (data.error || '') + ' Inténtelo de nuevo o contáctenos por WhatsApp.'
          : 'Could not send. ' + (data.error || '') + ' Please try again or reach us on WhatsApp.');
        return;
      }
      showSuccessStep(data, payload);
    } catch (err) {
      console.error('Disclosure submit failed', err);
      if (btn) { btn.disabled = false; btn.style.opacity = ''; }
      alert(currentLang === 'es'
        ? 'Error de red. Inténtelo de nuevo o contáctenos por WhatsApp.'
        : 'Network error. Please try again or reach us on WhatsApp.');
    }
  }

  async function submitDisclosureUpdate(payload, btn){
    if (DEMO_MODE) {
      console.warn('[DEMO MODE] edit update — not sending. Payload:', payload);
      showSuccessStep({ refNumber: 'TPS-DISC-DEMO-000001', customerEmailSent: false }, payload, true);
      if (btn) { btn.disabled = false; btn.style.opacity = ''; }
      return;
    }
    try {
      const res = await fetch(`${FORM_CONFIG.editEndpoint}/${disclosureEditToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (btn) { btn.disabled = false; btn.style.opacity = ''; }
      if (!res.ok || !data.ok) {
        alert(currentLang === 'es'
          ? 'No se pudo actualizar. ' + (data.error || '') + ' Inténtelo de nuevo.'
          : 'Could not update. ' + (data.error || '') + ' Please try again.');
        return;
      }
      showSuccessStep(data, payload, true);
    } catch (err) {
      console.error('Disclosure update failed', err);
      if (btn) { btn.disabled = false; btn.style.opacity = ''; }
      alert(currentLang === 'es'
        ? 'Error de red. Inténtelo de nuevo.'
        : 'Network error. Please try again.');
    }
  }

  function showSuccessStep(data, payload, isUpdate){
    const refEl   = document.getElementById('success-ref');
    const dateEl  = document.getElementById('success-date');
    const emailEl = document.getElementById('success-email');
    if (refEl) refEl.textContent = (isUpdate ? 'Updated · ' : '') + 'Reference: ' + (data.refNumber || '—');
    if (dateEl) dateEl.textContent = 'Event: ' + (payload.event_date || '—');
    if (emailEl) {
      const sentMsg = data.customerEmailSent === false
        ? (currentLang === 'es' ? 'El correo no pudo enviarse — contáctenos directamente.' : 'Email could not be sent — please contact us directly.')
        : (currentLang === 'es' ? 'Copia enviada a: ' : 'A copy has been sent to: ') + (payload.customer_email || '');
      emailEl.textContent = sentMsg;
    }
    goStep(6);
  }

  function showDupPanel(){
    // Hide all step panes and show the dup panel instead
    document.querySelectorAll('.step-pane').forEach(p => p.classList.remove('active'));
    const dupPanel = document.getElementById('dup-panel');
    if (dupPanel) dupPanel.style.display = '';
  }

  async function resendEditLink(){
    const email = (document.getElementById('f-email')?.value || '').trim();
    const feedback = document.getElementById('resend-feedback');
    if (!email) {
      if (feedback) { feedback.style.display = ''; feedback.textContent = currentLang === 'es' ? 'Ingrese su correo en el Paso II.' : 'Please enter your email in Step II.'; }
      return;
    }
    if (DEMO_MODE) {
      if (feedback) { feedback.style.display = ''; feedback.textContent = '[DEMO] Link would be resent to ' + email; }
      return;
    }
    try {
      const res = await fetch(FORM_CONFIG.resendLinkEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (feedback) {
        feedback.style.display = '';
        feedback.textContent = res.ok
          ? (currentLang === 'es' ? 'Si tenemos un aviso para ese correo, el enlace fue enviado. Revise su bandeja.' : 'If we have a disclosure on file for that email, the link has been sent. Check your inbox.')
          : (currentLang === 'es' ? 'No se pudo enviar. Contáctenos por WhatsApp.' : 'Could not send. Please reach us on WhatsApp.');
      }
    } catch {
      if (feedback) { feedback.style.display = ''; feedback.textContent = currentLang === 'es' ? 'Error de red.' : 'Network error.'; }
    }
  }

  // ---- load existing disclosure for edit mode ----
  async function loadForEdit(token){
    if (DEMO_MODE) {
      console.warn('[DEMO MODE] edit mode — token:', token);
      return;
    }
    try {
      const res = await fetch(`${FORM_CONFIG.editEndpoint}/${token}`);
      if (!res.ok) {
        console.warn('Edit token not found or expired');
        return;
      }
      const d = await res.json();
      if (!d.ok) return;

      // Pre-fill parent fields
      const set = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
      set('f-parent-name', d.parent_name);
      set('f-email', d.customer_email);
      set('f-phone', d.phone);
      set('f-event-date', d.event_date);
      set('f-event-address', d.event_address);

      // Pre-fill emergency contact
      if (d.emergency) {
        set('f-emergency-name', d.emergency.name);
        set('f-emergency-relationship', d.emergency.relationship);
        set('f-emergency-phone', d.emergency.phone);
      }

      // Pre-fill signer fields
      set('f-signer-name', d.signer_name);
      set('sig-date', d.sig_date);

      // Restore signature if present
      if (d.signature_b64 && window.restoreSignature) {
        window.restoreSignature(d.signature_b64);
      }

      // Rebuild children list
      const children = d.children || [];
      if (children.length > 0) {
        const list = document.getElementById('children-list');
        // Fill first child block
        const firstBlock = list.querySelector('.child-block[data-child="1"]');
        if (firstBlock) {
          const inputs = firstBlock.querySelectorAll('input');
          if (inputs[0]) inputs[0].value = children[0].name || '';
          if (inputs[1]) inputs[1].value = children[0].age || '';
          if (inputs[2]) inputs[2].value = children[0].allergies || '';
          if (inputs[3]) inputs[3].value = children[0].medical || '';
          if (inputs[4]) inputs[4].value = children[0].special || '';
        }
        // Add remaining children
        for (let i = 1; i < children.length; i++) {
          addChild();
          const blocks = list.querySelectorAll('.child-block');
          const block = blocks[i];
          if (block) {
            const inputs = block.querySelectorAll('input');
            if (inputs[0]) inputs[0].value = children[i].name || '';
            if (inputs[1]) inputs[1].value = children[i].age || '';
            if (inputs[2]) inputs[2].value = children[i].allergies || '';
            if (inputs[3]) inputs[3].value = children[i].medical || '';
            if (inputs[4]) inputs[4].value = children[i].special || '';
          }
        }
        // Update num-children input
        const numInput = document.getElementById('f-num-children');
        if (numInput) numInput.value = children.length;
        updateChildCounter();
      }

      // Update the disclosure card header to show edit mode
      const titleEl = document.querySelector('#disclosure .disclosure-card .title');
      if (titleEl) {
        titleEl.innerHTML = currentLang === 'es'
          ? '<em>Editar</em> Aviso'
          : '<em>Edit</em> Disclosure';
      }
      const subEl = document.querySelector('#disclosure .disclosure-card .sub');
      if (subEl) {
        subEl.textContent = currentLang === 'es'
          ? 'Actualice sus datos y vuelva a firmar.'
          : 'Update your information and re-sign.';
      }
      // Update submit button text
      const submitBtn = document.getElementById('submit-btn');
      if (submitBtn) {
        submitBtn.setAttribute('data-en', 'Update Disclosure →');
        submitBtn.setAttribute('data-es', 'Actualizar Aviso →');
        submitBtn.textContent = currentLang === 'es' ? 'Actualizar Aviso →' : 'Update Disclosure →';
      }

      // Skip step 1 agreement if re-editing (waiver already accepted)
      goStep(2);
    } catch (err) {
      console.error('loadForEdit failed', err);
    }
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
