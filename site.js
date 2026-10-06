/* Империя камня — сайт (отдельно от Telegram-бота). Ванильный JS, без сборщиков. */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const RUB=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';
const uid=()=>'o'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);

/* ---------- хранилище (пока localStorage; позже заменим на Supabase) ---------- */
const LS={
  get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
};
let cart=LS.get('ik_cart',[]);          // [{id,n,p,qty,m}]
let fav=new Map(LS.get('ik_fav',[]));   // id -> true
let user=LS.get('ik_user',null);        // {phone}
let orders=LS.get('ik_orders',[]);      // [{id,date,items,total,status}]
let savedCalc=LS.get('ik_calc',[]);     // [{id,date,label,...cs,result}]
let addrs=LS.get('ik_addr',[]);         // [string]
let leads=LS.get('ik_leads',[]);        // [{id,date,name,phone}] — заявки на обратный звонок
function saveAll(){LS.set('ik_cart',cart);LS.set('ik_fav',[...fav]);LS.set('ik_user',user);LS.set('ik_orders',orders);LS.set('ik_calc',savedCalc);LS.set('ik_addr',addrs);LS.set('ik_leads',leads)}

/* ---------- калькулятор (формула — как в Mini App) ---------- */
let FAS=FAS_RATE; // перезаписываемая копия ставки фаски (FAS_RATE — заводское значение из data.js)
let cs={md:'v',m:'g',l:80,w:40,h:5,th:2,fas:false};
function calc(){
  const per=2*(cs.l+cs.w)/100,fas=cs.fas?per*FAS:0;
  const a=cs.l*cs.w/10000;
  if(cs.md==='t'){const r=(TL[cs.m]||{})[cs.th];return{a,s:r?a*r+fas:null,u:'м²',fas}}
  const v=cs.l*cs.w*cs.h/1e6;
  return{a:v,s:v*M[cs.m].m+fas,u:'м³',fas};
}

/* ---------- тосты / подтверждение ---------- */
let toastT=null;
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2200)}
function okAnim(){const o=$('#okanim');o.classList.add('on');setTimeout(()=>o.classList.remove('on'),1400)}
function confetti(){
  const c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;z-index:30;pointer-events:none';document.body.appendChild(c);
  const ctx=c.getContext('2d');function size(){c.width=innerWidth;c.height=innerHeight}size();addEventListener('resize',size);
  const cols=['#e6c068','#8c1f2b','#fff6e6'];
  const ps=Array.from({length:70},()=>({x:innerWidth/2,y:innerHeight*.35,vx:(Math.random()-.5)*14,vy:Math.random()*-10-4,g:.35,r:3+Math.random()*4,c:cols[~~(Math.random()*3)],rot:Math.random()*6,vr:(Math.random()-.5)*.3}));
  let f=0;(function tick(){f++;ctx.clearRect(0,0,c.width,c.height);ps.forEach(p=>{p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.c;ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2*.6);ctx.restore()});
    if(f<70)requestAnimationFrame(tick);else c.remove();
  })();
}

/* ---------- роутер ---------- */
const TABS=['cat','works','calc','cart','cab'];
function go(tab){
  if(tab==='login'){location.hash='#login';renderLogin();return}
  if(tab==='admin'){location.hash='#admin';routeAdmin();return}
  if(!TABS.includes(tab))tab='cat';
  location.hash='#'+tab;render();
}
function curTab(){const h=location.hash.replace('#','');return TABS.includes(h)?h:'cat'}
function routeHash(){
  if(location.hash==='#login')renderLogin();
  else if(location.hash==='#admin')routeAdmin();
  else render();
}
addEventListener('hashchange',routeHash);

/* ---------- каталог ---------- */
let curCat='Все',q='';
function favHtml(id){return `<button class="fvb ${fav.has(id)?'on':''}" data-fav="${id}">${fav.has(id)?'♥':'♡'}</button>`}
function cat_(){
  const list=P.filter(p=>(curCat==='Все'||p.c===curCat)&&(!q||p.n.toLowerCase().includes(q.toLowerCase())));
  return `
  <div class="top"><h1>Каталог</h1><div class="sub">Готовые изделия и материалы — ${P.length} позиций</div></div>
  <div class="promo"><b>Скидка 15%</b>на витринные образцы в наличии · принимаем заявки от организаций (тендеры) — звоните</div>
  <input type="text" placeholder="Поиск по каталогу…" id="sq" value="${q}" style="margin-bottom:12px">
  <div class="chips">${CATS.map(c=>`<button class="chip ${c===curCat?'on':''}" data-cat="${c}">${c}</button>`).join('')}</div>
  ${curCat==='Все'&&!q?strip():''}
  ${list.length?`<div class="grid">${list.map(p=>`
    <div class="p">
      <div class="st" style="background:radial-gradient(90% 70% at 50% 100%,${M[p.m].v},${M[p.m].c})">${p.img?`<img src="${p.img}" alt="${p.n}" loading="lazy" onerror="this.remove()">`:`<b>${CN[p.m]||''}</b>`}</div>
      <div class="pb">
        <div class="pn">${p.n}</div>
        <div class="row"><div class="pr">${RUB(p.p)}</div>${favHtml(p.id)}</div>
        <button class="btn" data-add="${p.id}">В корзину</button>
      </div>
    </div>`).join('')}</div>` : `
  <div class="cta-box">
    <p>${q?'Ничего не найдено по этому запросу.':'В этом разделе цена считается индивидуально — по размеру, материалу и объёму работ.'}</p>
    <button class="btn" id="openCallback">Оставить заявку на расчёт</button>
  </div>`}
  <div class="box" style="margin-top:20px">
    <div class="cab-sec" style="margin:0 0 8px">Остались вопросы?</div>
    <div class="sub" style="margin-bottom:12px">Перезвоним в течение 10 минут и проведём бесплатную консультацию</div>
    <input type="text" id="qName" placeholder="Ваше имя">
    <input type="tel" id="qPhone" placeholder="Номер телефона" style="margin-top:8px">
    <label class="chk"><input type="checkbox" id="qAgree"> Даю согласие на обработку моих персональных данных</label>
    <button class="btn" id="qSend">Заказать расчёт</button>
  </div>
  `;
}

/* ---------- работы (используем strip()/works_() из data.js) ---------- */
function worksView(){return works_()}

/* ---------- калькулятор ---------- */
function calcView(){
  const r=calc();
  return `
  <div class="top"><h1>Расчёт стоимости</h1><div class="sub">Прикидочная цена, точную скажет мастер при замере</div></div>
  <div class="box">
    <label>Тип расчёта</label>
    <div class="seg"><button data-md="v" class="${cs.md==='v'?'on':''}">Объём (м³)</button><button data-md="t" class="${cs.md==='t'?'on':''}">Плитка (м²)</button></div>
    <label>Камень</label>
    <select id="ms">${Object.entries(M).map(([k,v])=>`<option value="${k}" ${k===cs.m?'selected':''}>${v.n}</option>`).join('')}</select>
    <div class="row" style="gap:10px;margin-top:14px">
      <div style="flex:1"><label>Длина, см</label><input type="text" inputmode="numeric" id="cl" value="${cs.l}"></div>
      <div style="flex:1"><label>Ширина, см</label><input type="text" inputmode="numeric" id="cw" value="${cs.w}"></div>
    </div>
    ${cs.md==='v'?`<label>Высота, см</label><input type="text" inputmode="numeric" id="ch" value="${cs.h}">`:
      `<label>Толщина плитки</label><div class="seg"><button data-th="2" class="${cs.th==2?'on':''}">2 см</button><button data-th="3" class="${cs.th==3?'on':''}">3 см</button></div>`}
    <label class="chk" style="margin-top:14px"><input type="checkbox" id="cf" ${cs.fas?'checked':''}> Фаска по периметру (+${FAS} ₽/пог.м)</label>
  </div>
  <div class="res">
    <small>Ориентировочная стоимость</small>
    <div class="big">${r.s!=null?RUB(r.s):'—'}</div>
    <small>${r.a.toFixed(2)} ${r.u}${r.fas?` · фаска ${RUB(r.fas)}`:''}</small>
  </div>
  ${r.s!=null?`<button class="btn" id="calcAdd">Добавить в корзину</button>
  <button class="btn g2" id="calcSave" style="margin-top:8px">Сохранить расчёт в кабинет</button>`:
   `<div class="note">Для этой толщины нет данных по плитке — выберите другой камень или толщину.</div>`}
  `;
}

/* ---------- корзина ---------- */
function cartView(){
  const total=cart.reduce((s,i)=>s+i.p*i.qty,0);
  return `
  <div class="top"><h1>Корзина</h1><div class="sub">${cart.length?cart.length+' позиции':'Пока пусто'}</div></div>
  ${cart.length?cart.map((i,ix)=>`
    <div class="it">
      <div class="sw" style="background:radial-gradient(90% 70% at 50% 100%,${M[i.m]?M[i.m].v:'#8c1f2b'},${M[i.m]?M[i.m].c:'#3b2628'})"></div>
      <div class="n">${i.n}<br><span style="color:var(--mute);font-weight:600">${RUB(i.p)}</span></div>
      <div class="q"><button data-q="-${ix}">–</button><b>${i.qty}</b><button data-q="+${ix}">+</button></div>
    </div>`).join(''):`<div class="empty">Добавьте товары из каталога или расчёта</div>`}
  ${cart.length?`
  <div class="box" style="margin-top:14px"><div class="row"><b>Итого</b><b>${RUB(total)}</b></div></div>
  <button class="btn" id="checkout">Оформить заказ</button>
  <button class="lnk danger" id="clearCart" style="display:block;margin:12px auto 0">Очистить корзину</button>`:''}
  `;
}

/* ---------- логин + кабинет ---------- */
function normPhone(v){return v.replace(/\D/g,'')}
function loginView(){
  return `
  <div class="loginwrap">
    <div class="demo-badge">Демо-режим: вход без SMS</div>
    <h1>Вход в кабинет</h1>
    <div class="sub">Введите номер телефона — пока без подтверждения кодом (добавим позже)</div>
    <label>Телефон</label>
    <input type="tel" id="phone" placeholder="+7 900 000-00-00">
    <button class="btn" id="doLogin" style="margin-top:14px">Войти</button>
  </div>`;
}
function statusLabel(s){return s==='new'?['Новый','st-new']:s==='work'?['В работе','st-work']:['Выполнен','st-done']}
function cabView(){
  if(!user){
    return `<div class="cab-locked"><h1>Кабинет</h1><p class="sub">Войдите, чтобы увидеть заказы, расчёты и избранное</p><button class="btn" id="goLogin" style="width:auto">Войти по телефону</button>
    <div style="margin-top:34px"><button class="lnk" id="adminLink" style="font-size:11px;opacity:.5">Панель администратора</button></div></div>`;
  }
  const myFav=P.filter(p=>fav.has(p.id));
  return `
  <div class="cab-head"><div><div class="who">Личный кабинет</div><div class="phone">+${user.phone}</div></div><button class="lnk danger" id="logout">Выйти</button></div>

  <div class="cab-sec">Мои заказы${orders.length?`<button class="lnk danger" id="clearOrders">Очистить все</button>`:''}</div>
  ${orders.length?orders.slice().reverse().map(o=>{const[lbl,cls]=statusLabel(o.status);return`
    <div class="ord"><div class="row1"><span class="id">Заказ ${o.id}</span><span class="st ${cls}">${lbl}</span></div>
    <div class="lines">${o.items.map(i=>`${i.n} ×${i.qty}`).join('\n')}</div>
    <div class="tot">${RUB(o.total)} · ${o.date}</div></div>`}).join(''):`<div class="empty-small">Заказов пока нет</div>`}

  <div class="cab-sec">Сохранённые расчёты</div>
  ${savedCalc.length?savedCalc.slice().reverse().map(c=>`
    <div class="calcsav"><div class="sw" style="background:radial-gradient(90% 70% at 50% 100%,${M[c.m]?M[c.m].v:'#8c1f2b'},${M[c.m]?M[c.m].c:'#3b2628'})"></div>
    <div class="ri"><b>${RUB(c.result)}</b><span>${M[c.m]?M[c.m].n:''} · ${c.l}×${c.w}${c.md==='v'?'×'+c.h:''} см</span></div>
    <button class="lnk" data-usecalc="${c.id}">Повторить</button></div>`).join(''):`<div class="empty-small">Пока нет сохранённых расчётов</div>`}

  <div class="cab-sec">Избранное</div>
  ${myFav.length?myFav.map(p=>`
    <div class="calcsav"><div class="sw" style="background:radial-gradient(90% 70% at 50% 100%,${M[p.m].v},${M[p.m].c})"></div>
    <div class="ri"><b>${p.n}</b><span>${RUB(p.p)}</span></div>
    <button class="lnk" data-add="${p.id}">В корзину</button></div>`).join(''):`<div class="empty-small">Нажимайте ♡ в каталоге, чтобы сохранить сюда</div>`}

  <div class="cab-sec">Адреса<button class="lnk" id="addAddr">+ Добавить</button></div>
  ${addrs.length?addrs.map((a,ix)=>`<div class="addrow"><span style="flex:1">${a}</span><button class="lnk danger" data-deladdr="${ix}">Удалить</button></div>`).join(''):`<div class="empty-small">Адреса пока не добавлены</div>`}

  <div style="text-align:center;margin-top:30px"><button class="lnk" id="adminLink" style="font-size:11px;opacity:.5">Панель администратора</button></div>
  `;
}

/* ---------- подвал сайта (разделы + контакты) ---------- */
function footerHtml(){
  return `
  <footer class="sfoot">
    <div class="sfoot-brand"><img class="lg sm" src="${LOGO}" alt=""><span>Империя камня</span></div>
    <div class="sfoot-cols">
      <div class="sfoot-col">
        <b>Каталог</b>
        ${CATS.filter(c=>c!=='Все').map(c=>`<button class="sfoot-lnk" data-foot-cat="${c}">${c}</button>`).join('')}
      </div>
      <div class="sfoot-col">
        <b>Контакты</b>
        <a href="tel:+79204812075">+7 (920) 481-20-75</a>
        <a href="https://wa.me/79204812075" target="_blank" rel="noopener">WhatsApp</a>
        <a href="https://vk.com/club76623292" target="_blank" rel="noopener">ВКонтакте</a>
      </div>
      <div class="sfoot-col">
        <b>Адреса</b>
        <span>ул. Бастионная, 29<br>ежедневно 8:30–17:30</span>
        <span>ул. Мичуринская, 275<br>ежедневно 9:00–18:00</span>
      </div>
    </div>
    <div class="sfoot-copy">© ${new Date().getFullYear()} Империя камня · Тамбов</div>
  </footer>`;
}
/* ---------- отрисовка ---------- */
function render(){
  const tab=curTab();
  $$('.topnav button[data-go]').forEach(b=>b.classList.toggle('on',b.dataset.go===tab));
  const A=$('#app');
  A.innerHTML = (tab==='cat'?cat_() : tab==='works'?worksView() : tab==='calc'?calcView() : tab==='cart'?cartView() : cabView()) + footerHtml();
  $('#cartDot').hidden = cart.length===0;
  $('#cartDot').textContent = cart.reduce((s,i)=>s+i.qty,0);
  renderTabs(tab);
  bindView(tab);
}
function renderTabs(tab){
  const names={cat:'Каталог',works:'Работы',calc:'Расчёт',cart:'Корзина',cab:'Кабинет'};
  $('#tabs').innerHTML = TABS.map(t=>`<button class="tab ${t===tab?'on':''}" data-go="${t}">${names[t]}${t==='cart'&&cart.length?`<span class="dot">${cart.reduce((s,i)=>s+i.qty,0)}</span>`:''}</button>`).join('');
  const i=TABS.indexOf(tab);$('#ind').style.transform=`translateX(${i*100}%)`;
}

function addToCart(id){
  const p=P.find(p=>p.id===id);if(!p)return;
  const row=cart.find(i=>i.id===id);
  if(row)row.qty++;else cart.push({id:p.id,n:p.n,p:p.p,qty:1,m:p.m});
  saveAll();toast('Добавлено в корзину');render();
}
function addCalcToCart(){
  const r=calc();if(r.s==null)return;
  const name=`${M[cs.m].n}, ${cs.md==='v'?`${cs.l}×${cs.w}×${cs.h} см`:`${cs.l}×${cs.w} см, ${cs.th} см плитка`}${cs.fas?' + фаска':''}`;
  cart.push({id:'calc-'+uid(),n:name,p:r.s,qty:1,m:cs.m});
  saveAll();toast('Расчёт добавлен в корзину');render();
}

function bindView(tab){
  $$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
  $$('[data-foot-cat]').forEach(b=>b.onclick=()=>{curCat=b.dataset.footCat;q='';go('cat')});
  $$('[data-add]').forEach(b=>b.onclick=()=>addToCart(isNaN(+b.dataset.add)?b.dataset.add:+b.dataset.add));
  $$('[data-fav]').forEach(b=>b.onclick=()=>{const id=+b.dataset.fav;fav.has(id)?fav.delete(id):fav.set(id,true);saveAll();render()});
  $$('[data-o]').forEach(el=>el.onclick=()=>{li=+el.dataset.o;showLb()});
  $$('[data-lb]').forEach(b=>b.onclick=()=>lb(b.dataset.lb));

  if(tab==='cat'){
    $('#sq').oninput=e=>{q=e.target.value;render();$('#sq').focus();$('#sq').setSelectionRange(q.length,q.length)};
    $$('[data-cat]').forEach(b=>b.onclick=()=>{curCat=b.dataset.cat;render()});
    if($('#openCallback'))$('#openCallback').onclick=openCallback;
    if($('#qSend'))$('#qSend').onclick=()=>{
      if(!$('#qAgree').checked){toast('Подтвердите согласие на обработку данных');return}
      const phone=normPhone($('#qPhone').value);
      if(phone.length<10){toast('Введите номер полностью');return}
      const name=$('#qName').value.trim();
      leads.push({id:uid(),date:new Date().toLocaleDateString('ru-RU'),phone,name});
      saveAll();toast('Заявка отправлена — мы вам перезвоним!');
      sendToTelegram({type:'callback',phone,name});
      $('#qPhone').value='';$('#qName').value='';$('#qAgree').checked=false;
    };
  }
  if(tab==='calc'){
    $$('[data-md]').forEach(b=>b.onclick=()=>{cs.md=b.dataset.md;render()});
    $$('[data-th]').forEach(b=>b.onclick=()=>{cs.th=+b.dataset.th;render()});
    $('#ms').onchange=e=>{cs.m=e.target.value;render()};
    $('#cl').oninput=e=>{cs.l=+e.target.value||0;render()};
    $('#cw').oninput=e=>{cs.w=+e.target.value||0;render()};
    if($('#ch'))$('#ch').oninput=e=>{cs.h=+e.target.value||0;render()};
    $('#cf').onchange=e=>{cs.fas=e.target.checked;render()};
    if($('#calcAdd'))$('#calcAdd').onclick=addCalcToCart;
    if($('#calcSave'))$('#calcSave').onclick=()=>{
      const r=calc();savedCalc.push({id:uid(),date:new Date().toLocaleDateString('ru-RU'),result:r.s,...cs});saveAll();
      toast(user?'Расчёт сохранён в кабинет':'Сохранено — войдите, чтобы увидеть в кабинете');
    };
  }
  if(tab==='cart'){
    $$('[data-q]').forEach(b=>b.onclick=()=>{
      const d=b.dataset.q,ix=+d.slice(1);cart[ix].qty+=d[0]==='+'?1:-1;if(cart[ix].qty<=0)cart.splice(ix,1);saveAll();render();
    });
    if($('#checkout'))$('#checkout').onclick=()=>{
      if(!user){toast('Войдите, чтобы оформить заказ');go('cab');return}
      const total=cart.reduce((s,i)=>s+i.p*i.qty,0);
      const orderId='№'+(orders.length+1001);
      const items=cart.map(i=>({n:i.n,qty:i.qty}));
      orders.push({id:orderId,date:new Date().toLocaleDateString('ru-RU'),items,total,status:'new'});
      cart=[];saveAll();okAnim();confetti();toast('Заказ оформлен!');setTimeout(()=>go('cab'),600);
      sendToTelegram({type:'order',orderId,items,total});
    };
    if($('#clearCart'))$('#clearCart').onclick=()=>{
      if(!cart.length)return;
      if(confirm('Очистить корзину? Все товары будут удалены.')){cart=[];saveAll();toast('Корзина очищена');render()}
    };
  }
  if(tab==='cab'){
    if($('#goLogin'))$('#goLogin').onclick=()=>go('login');
    if($('#adminLink'))$('#adminLink').onclick=()=>go('admin');
    if($('#logout'))$('#logout').onclick=()=>{user=null;saveAll();render()};
    if($('#clearOrders'))$('#clearOrders').onclick=()=>{
      if(confirm('Очистить всю историю заказов? Это действие нельзя отменить.')){orders=[];saveAll();toast('История заказов очищена');render()}
    };
    if($('#addAddr'))$('#addAddr').onclick=()=>{const a=prompt('Введите адрес:');if(a&&a.trim()){addrs.push(a.trim());saveAll();render()}};
    $$('[data-deladdr]').forEach(b=>b.onclick=()=>{addrs.splice(+b.dataset.deladdr,1);saveAll();render()});
    $$('[data-usecalc]').forEach(b=>b.onclick=()=>{
      const c=savedCalc.find(c=>c.id===b.dataset.usecalc);if(!c)return;
      cs={md:c.md,m:c.m,l:c.l,w:c.w,h:c.h,th:c.th,fas:c.fas};go('calc');
    });
  }
}

/* отдельный экран логина — не входит в TABS, рисуется напрямую */
function renderLogin(){
  $('#app').innerHTML=loginView();
  $('#doLogin').onclick=()=>{
    const v=normPhone($('#phone').value);
    if(v.length<10){toast('Введите номер полностью');return}
    user={phone:v};saveAll();toast('Добро пожаловать!');go('cab');
  };
}

/* ---------- админ-панель ----------
   Пока нет общей базы данных (см. шаг 2), изменения админа сохраняются
   в localStorage ЭТОГО устройства и применяются поверх заводских данных
   из data.js. Это удобно для черновика, но другие посетители сайта их
   пока не увидят — для этого нужен общий backend (Supabase). */
const ADMIN_PIN='2580'; // поменяем в любой момент, если попросите
function isAdmin(){return LS.get('ik_admin_auth',false)===true}
function applyAdminOverrides(){
  const op=LS.get('ik_admin_P',null);if(op){P.length=0;op.forEach(x=>P.push(x))}
  const og=LS.get('ik_admin_G',null);if(og){G.length=0;og.forEach(x=>G.push(x))}
  const om=LS.get('ik_admin_M',null);if(om)Object.keys(om).forEach(k=>{if(M[k])Object.assign(M[k],om[k])});
  const otl=LS.get('ik_admin_TL',null);if(otl)Object.keys(otl).forEach(k=>{TL[k]=Object.assign(TL[k]||{},otl[k])});
  const ofas=LS.get('ik_admin_fas',null);if(ofas!=null)FAS=ofas;
}
function persistCatalog(){LS.set('ik_admin_P',P)}
function persistGallery(){LS.set('ik_admin_G',G)}
function persistStone(){LS.set('ik_admin_M',M);LS.set('ik_admin_TL',TL);LS.set('ik_admin_fas',FAS)}

function routeAdmin(){isAdmin()?renderAdmin():renderAdminGate()}
function adminGateView(){
  return `<div class="loginwrap"><div class="demo-badge">Только для владельца сайта</div><h1>Админ-панель</h1><div class="sub">Введите PIN-код</div>
  <input type="tel" id="apin" placeholder="PIN"><button class="btn" id="adminGo" style="margin-top:14px">Войти</button></div>`;
}
function renderAdminGate(){
  $('#app').innerHTML=adminGateView();
  $('#adminGo').onclick=()=>{
    if($('#apin').value.trim()===ADMIN_PIN){LS.set('ik_admin_auth',true);toast('Добро пожаловать, админ');renderAdmin()}
    else toast('Неверный PIN');
  };
}
function adminView(){
  return `
  <div class="top"><h1>Админ-панель</h1><div class="sub">Правки видны сразу у вас. Чтобы их видели все посетители — нужен шаг 2 (общая база данных)</div></div>

  <div class="cab-sec">Цены на камень, ₽/м³</div>
  <div class="box">${Object.entries(M).map(([k,v])=>`
    <div class="row" style="margin-bottom:8px"><span>${v.n}</span><input type="text" inputmode="numeric" style="width:130px;text-align:right" data-mp="${k}" value="${v.m}"></div>`).join('')}
  </div>

  <div class="cab-sec">Плитка, ₽/м² по толщине</div>
  <div class="box">${Object.keys(M).map(k=>{const obj=TL[k]||{};return`
    <div style="margin-bottom:10px"><b>${M[k].n}</b>
    ${[2,3].map(th=>`<div class="row" style="margin:4px 0"><span>${th} см</span><input type="text" inputmode="numeric" style="width:130px;text-align:right" data-tlp="${k}|${th}" value="${obj[th]||''}" placeholder="нет"></div>`).join('')}
    </div>`}).join('')}
  </div>

  <div class="cab-sec">Фаска, ₽ за пог. метр</div>
  <div class="box"><input type="text" inputmode="numeric" id="fasInput" value="${FAS}"></div>
  <button class="btn" id="saveStone">Сохранить цены</button>

  <div class="cab-sec" style="margin-top:26px">Заявки на обратный звонок (${leads.length})</div>
  ${leads.length?leads.slice().reverse().map(l=>`
    <div class="lead"><b>+${l.phone}</b>${l.name?l.name+' · ':''}${l.date}
    <button class="lnk danger" data-leaddel="${l.id}" style="margin-left:8px">Удалить</button></div>`).join(''):`<div class="empty-small">Заявок пока нет</div>`}

  <div class="cab-sec" style="margin-top:26px">Товары каталога (${P.length})</div>
  ${P.map((p,ix)=>`
    <div class="box">
      <input type="text" data-pn="${ix}" value="${p.n}" style="margin-bottom:8px">
      <div class="row" style="gap:8px">
        <input type="text" inputmode="numeric" data-pp="${ix}" value="${p.p}" style="flex:1;min-width:0">
        <select data-pc="${ix}" style="flex:1;min-width:0">${CATS.filter(c=>c!=='Все').map(c=>`<option ${c===p.c?'selected':''}>${c}</option>`).join('')}</select>
        <select data-pm="${ix}" style="flex:1;min-width:0">${Object.entries(M).map(([k,v])=>`<option value="${k}" ${k===p.m?'selected':''}>${v.n}</option>`).join('')}</select>
      </div>
      <button class="lnk danger" data-pdel="${ix}" style="margin-top:6px">Удалить товар</button>
    </div>`).join('')}
  <button class="btn g2" id="addProduct">+ Добавить товар</button>

  <div class="cab-sec" style="margin-top:26px">Фото работ (${G.length})</div>
  ${G.map((g,ix)=>`
    <div class="box"><img src="${g.s}" style="width:100%;border-radius:10px;margin-bottom:8px">
    <input type="text" data-gt="${ix}" value="${g.t}">
    <button class="lnk danger" data-gdel="${ix}" style="margin-top:6px">Удалить фото</button></div>`).join('')}
  <label class="btn g2" style="display:block;text-align:center;cursor:pointer">+ Добавить фото<input type="file" accept="image/*" id="addPhoto" style="display:none"></label>

  <button class="lnk" id="adminLogout" style="margin:28px 0 10px">Выйти из админ-панели</button>
  `;
}
function renderAdmin(){$('#app').innerHTML=adminView();bindAdmin()}
function bindAdmin(){
  $$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
  $$('[data-mp]').forEach(i=>i.onchange=()=>{M[i.dataset.mp].m=+i.value||0});
  $$('[data-tlp]').forEach(i=>i.onchange=()=>{const[k,th]=i.dataset.tlp.split('|');TL[k]=TL[k]||{};TL[k][th]=+i.value||0});
  $('#fasInput').onchange=e=>{FAS=+e.target.value||0};
  $('#saveStone').onclick=()=>{persistStone();toast('Цены сохранены')};
  $$('[data-leaddel]').forEach(b=>b.onclick=()=>{leads=leads.filter(l=>l.id!==b.dataset.leaddel);saveAll();renderAdmin()});

  $$('[data-pn]').forEach(i=>i.onchange=()=>{P[+i.dataset.pn].n=i.value;persistCatalog()});
  $$('[data-pp]').forEach(i=>i.onchange=()=>{P[+i.dataset.pp].p=+i.value||0;persistCatalog()});
  $$('[data-pc]').forEach(i=>i.onchange=()=>{P[+i.dataset.pc].c=i.value;persistCatalog()});
  $$('[data-pm]').forEach(i=>i.onchange=()=>{P[+i.dataset.pm].m=i.value;persistCatalog()});
  $$('[data-pdel]').forEach(b=>b.onclick=()=>{if(confirm('Удалить товар?')){P.splice(+b.dataset.pdel,1);persistCatalog();renderAdmin()}});
  $('#addProduct').onclick=()=>{P.push({id:Date.now(),n:'Новый товар',p:0,c:CATS[1],m:Object.keys(M)[0]});persistCatalog();renderAdmin()};

  $$('[data-gt]').forEach(i=>i.onchange=()=>{G[+i.dataset.gt].t=i.value;persistGallery()});
  $$('[data-gdel]').forEach(b=>b.onclick=()=>{if(confirm('Удалить фото?')){G.splice(+b.dataset.gdel,1);persistGallery();renderAdmin()}});
  $('#addPhoto').onchange=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=()=>{G.push({s:r.result,t:'Новая работа'});persistGallery();renderAdmin()};r.readAsDataURL(f);
  };
  $('#adminLogout').onclick=()=>{LS.set('ik_admin_auth',false);go('cab')};
}

/* ---------- контакты и обратный звонок (реальные данные компании) ---------- */
function openCallback(){$('#cbModal').classList.add('on')}
function closeCallback(){$('#cbModal').classList.remove('on')}
document.body.insertAdjacentHTML('beforeend',`
<button id="fab" title="Связаться">☎</button>
<div id="cd">
  <div class="ob">
    <div class="cab-sec" style="margin:0 0 10px">Связаться с нами</div>
    <a class="cbtn" href="tel:+79204812075">📞 +7 (920) 481-20-75</a>
    <a class="cbtn" href="https://wa.me/79204812075" target="_blank" rel="noopener">WhatsApp</a>
    <a class="cbtn" href="https://vk.com/club76623292" target="_blank" rel="noopener">ВКонтакте</a>
    <div class="addr"><b>ул. Бастионная, 29</b>Ежедневно 8:30–17:30 · <a href="https://yandex.ru/maps/?text=${encodeURIComponent('Тамбов, ул. Бастионная, 29')}" target="_blank" rel="noopener">на карте</a></div>
    <div class="addr"><b>ул. Мичуринская, 275</b>Ежедневно 9:00–18:00 · <a href="https://yandex.ru/maps/?text=${encodeURIComponent('Тамбов, ул. Мичуринская, 275')}" target="_blank" rel="noopener">на карте</a></div>
    <button class="btn" id="cdCallback" style="margin-top:10px">Оставить заявку на звонок</button>
    <button class="btn g2" id="cdClose" style="margin-top:8px">Закрыть</button>
  </div>
</div>
<div id="cbModal" class="ovl"><div class="ob">
  <div class="cab-sec" style="margin:0 0 10px">Обратный звонок</div>
  <div class="sub" style="margin-bottom:12px">Оставьте номер — перезвоним в рабочее время (8:30–18:00)</div>
  <input type="tel" id="cbPhone" placeholder="+7 900 000-00-00">
  <input type="text" id="cbName" placeholder="Как вас зовут (необязательно)" style="margin-top:8px">
  <button class="btn" id="cbSend" style="margin-top:12px">Отправить заявку</button>
  <button class="lnk" id="cbClose" style="display:block;margin:10px auto 0">Закрыть</button>
</div></div>
`);
$('#fab').onclick=()=>$('#cd').classList.add('on');
$('#cd').onclick=e=>{if(e.target.id==='cd')$('#cd').classList.remove('on')};
$('#cdClose').onclick=()=>$('#cd').classList.remove('on');
$('#cdCallback').onclick=()=>{$('#cd').classList.remove('on');openCallback()};
$('#cbModal').onclick=e=>{if(e.target.id==='cbModal')closeCallback()};
$('#cbClose').onclick=closeCallback;
function sendToTelegram(payload){
  fetch('/.netlify/functions/send-lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(()=>{});
}
$('#cbSend').onclick=()=>{
  const phone=normPhone($('#cbPhone').value);
  if(phone.length<10){toast('Введите номер полностью');return}
  const name=$('#cbName').value.trim();
  leads.push({id:uid(),date:new Date().toLocaleDateString('ru-RU'),phone,name});
  saveAll();closeCallback();toast('Заявка отправлена — мы вам перезвоним!');
  sendToTelegram({type:'callback',phone,name});
  $('#cbPhone').value='';$('#cbName').value='';
};

/* ---------- запуск ---------- */
$('#brandLogo').src=LOGO;
applyAdminOverrides();
routeHash();
