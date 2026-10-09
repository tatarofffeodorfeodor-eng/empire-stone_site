import { $, $$, formatRub } from './ui/dom.js';
import { toast } from './ui/toast.js';
import { supabase, isBackendConfigured } from './lib/supabase.js';
import { MATERIALS } from './data/materials.js';
import { PRODUCTS, CATEGORIES } from './data/product-catalog.js';
import { GALLERY } from './data/gallery.js';
import { calcState } from './calculator/calculator.js';
import {
  saveMaterialPrice, saveChamferRate, createProduct, updateProduct, deleteProduct,
  updateGalleryCaption, deleteGalleryPhoto, addGalleryPhoto,
} from './data/remote.js';
import {
  fetchLeadsAdmin, deleteLeadAdmin, fetchOrdersAdmin, updateOrderStatusAdmin, deleteOrderAdmin,
} from './lib/leads-orders.js';

/**
 * Админ-панель. Логин — настоящий (Supabase Auth, email+пароль), а не PIN в
 * коде. Кто именно админ — отдельная таблица admins в БД (см. supabase/schema.sql),
 * её проверяет RPC is_admin(). Все правки идут прямо в Supabase и сразу видны
 * всем посетителям сайта, а не только этому устройству.
 */
let adminOrders = [];
let adminLeads = [];

async function checkIsAdmin() {
  if (!isBackendConfigured) return false;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { data, error } = await supabase.rpc('is_admin');
  if (error) { console.error('[admin] is_admin check failed:', error); return false; }
  return data === true;
}

function noBackendViewHtml() {
  return `<div class="loginwrap"><h1>Админ-панель</h1>
  <div class="sub">Бэкенд не настроен (нет .env с ключами Supabase) — админ-панель недоступна.
  См. supabase/schema.sql и .env.example в репозитории.</div></div>`;
}

function adminGateViewHtml(errorMsg) {
  return `<div class="loginwrap">
  <div class="demo-badge">Только для владельца сайта</div>
  <h1>Админ-панель</h1>
  <div class="sub">Войдите email и паролем, которые указали при создании аккаунта в Supabase</div>
  ${errorMsg ? `<div class="sub" style="color:#e2574c">${errorMsg}</div>` : ''}
  <label>Email</label>
  <input type="email" id="aEmail" placeholder="owner@example.com" autocomplete="username">
  <label style="margin-top:10px">Пароль</label>
  <input type="password" id="aPass" placeholder="••••••••" autocomplete="current-password">
  <button class="btn" id="adminGo" style="margin-top:14px">Войти</button>
  </div>`;
}

async function renderAdminGate(errorMsg) {
  $('#app').innerHTML = adminGateViewHtml(errorMsg);
  const go = $('#adminGo');
  const submit = async () => {
    const email = $('#aEmail').value.trim();
    const password = $('#aPass').value;
    if (!email || !password) { toast('Введите email и пароль'); return; }
    go.disabled = true;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      go.disabled = false;
      renderAdminGate('Неверный email или пароль');
      return;
    }
    const admin = await checkIsAdmin();
    if (!admin) {
      await supabase.auth.signOut();
      go.disabled = false;
      renderAdminGate('Этот аккаунт не привязан как администратор сайта');
      return;
    }
    toast('Добро пожаловать, админ');
    renderAdmin();
  };
  go.onclick = submit;
  $('#aPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
}

function statusLabel(status) {
  if (status === 'new') return 'Новый';
  if (status === 'work') return 'В работе';
  return 'Выполнен';
}

function adminViewHtml() {
  return `
  <div class="top"><h1>Админ-панель</h1><div class="sub">Правки сразу видят все посетители сайта</div></div>

  <div class="cab-sec">Цены на камень, ₽/м³</div>
  <div class="box">${Object.entries(MATERIALS).map(([k, v]) => `
    <div class="row" style="margin-bottom:8px"><span>${v.name}</span><input type="text" inputmode="numeric" style="width:130px;text-align:right" data-mp="${k}" value="${v.pricePerM3}"></div>`).join('')}
  </div>

  <div class="cab-sec">Фаска, ₽ за пог. метр</div>
  <div class="box"><input type="text" inputmode="numeric" id="fasInput" value="${calcState.chamferRate}"></div>
  <button class="btn" id="saveStone">Сохранить цены</button>

  <div class="cab-sec" style="margin-top:26px">Заказы (${adminOrders.length})</div>
  ${adminOrders.length ? adminOrders.map((o) => `
    <div class="ord"><div class="row1"><span class="id">Заказ №${o.order_no}</span>
      <select data-ordstatus="${o.id}">
        <option value="new" ${o.status === 'new' ? 'selected' : ''}>Новый</option>
        <option value="work" ${o.status === 'work' ? 'selected' : ''}>В работе</option>
        <option value="done" ${o.status === 'done' ? 'selected' : ''}>Выполнен</option>
      </select></div>
    <div class="lines">+${o.phone} · ${(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(', ')}</div>
    <div class="tot">${formatRub(o.total)} · ${new Date(o.created_at).toLocaleDateString('ru-RU')}
      <button class="lnk danger" data-orddel="${o.id}" style="margin-left:8px">Удалить</button></div></div>`).join('')
    : `<div class="empty-small">Заказов пока нет</div>`}

  <div class="cab-sec" style="margin-top:26px">Заявки на обратный звонок (${adminLeads.length})</div>
  ${adminLeads.length ? adminLeads.map((l) => `
    <div class="lead"><b>+${l.phone}</b>${l.name ? ' · ' + l.name : ''} · ${new Date(l.created_at).toLocaleDateString('ru-RU')}
    <button class="lnk danger" data-leaddel="${l.id}" style="margin-left:8px">Удалить</button></div>`).join('')
    : `<div class="empty-small">Заявок пока нет</div>`}

  <div class="cab-sec" style="margin-top:26px">Товары каталога (${PRODUCTS.length})</div>
  ${PRODUCTS.map((p) => `
    <div class="box">
      <input type="text" data-pn="${p.id}" value="${p.name}" style="margin-bottom:8px">
      <div class="row" style="gap:8px">
        <input type="text" inputmode="numeric" data-pp="${p.id}" value="${p.price}" style="flex:1;min-width:0">
        <select data-pc="${p.id}" style="flex:1;min-width:0">${CATEGORIES.filter((c) => c !== 'Все').map((c) => `<option ${c === p.category ? 'selected' : ''}>${c}</option>`).join('')}</select>
        <select data-pm="${p.id}" style="flex:1;min-width:0">${Object.entries(MATERIALS).map(([k, v]) => `<option value="${k}" ${k === p.material ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
      </div>
      <button class="lnk danger" data-pdel="${p.id}" style="margin-top:6px">Удалить товар</button>
    </div>`).join('')}
  <button class="btn g2" id="addProduct">+ Добавить товар</button>

  <div class="cab-sec" style="margin-top:26px">Фото работ (${GALLERY.length})</div>
  ${GALLERY.map((g) => `
    <div class="box"><img src="${g.src}" style="width:100%;border-radius:10px;margin-bottom:8px">
    <input type="text" data-gt="${g.id}" value="${g.caption}">
    <button class="lnk danger" data-gdel="${g.id}" style="margin-top:6px">Удалить фото</button></div>`).join('')}
  <label class="btn g2" style="display:block;text-align:center;cursor:pointer">+ Добавить фото<input type="file" accept="image/*" id="addPhoto" style="display:none"></label>

  <button class="lnk" id="adminLogout" style="margin:28px 0 10px">Выйти из админ-панели</button>
  `;
}

async function renderAdmin() {
  $('#app').innerHTML = `<div class="loginwrap"><div class="sub">Загрузка…</div></div>`;
  [adminOrders, adminLeads] = await Promise.all([fetchOrdersAdmin(), fetchLeadsAdmin()]);
  $('#app').innerHTML = adminViewHtml();
  bindAdmin();
}

function bindAdmin() {
  $$('[data-go]').forEach((b) => { b.onclick = () => window.dispatchEvent(new CustomEvent('ik:navigate', { detail: b.dataset.go })); });

  $$('[data-mp]').forEach((i) => {
    i.onchange = async () => {
      const val = +i.value || 0;
      MATERIALS[i.dataset.mp].pricePerM3 = val;
      try { await saveMaterialPrice(i.dataset.mp, val); } catch (e) { toast('Не удалось сохранить цену'); }
    };
  });
  $('#saveStone').onclick = async () => {
    const rate = +$('#fasInput').value || 0;
    calcState.chamferRate = rate;
    try { await saveChamferRate(rate); toast('Цены сохранены'); } catch (e) { toast('Не удалось сохранить'); }
  };

  $$('[data-ordstatus]').forEach((sel) => {
    sel.onchange = async () => {
      try { await updateOrderStatusAdmin(sel.dataset.ordstatus, sel.value); toast('Статус обновлён'); }
      catch (e) { toast('Не удалось обновить статус'); }
    };
  });
  $$('[data-orddel]').forEach((b) => {
    b.onclick = async () => {
      if (!confirm('Удалить заказ?')) return;
      try { await deleteOrderAdmin(b.dataset.orddel); renderAdmin(); } catch (e) { toast('Не удалось удалить'); }
    };
  });

  $$('[data-leaddel]').forEach((b) => {
    b.onclick = async () => {
      try { await deleteLeadAdmin(b.dataset.leaddel); renderAdmin(); } catch (e) { toast('Не удалось удалить'); }
    };
  });

  $$('[data-pn]').forEach((i) => {
    i.onchange = async () => {
      const p = PRODUCTS.find((x) => String(x.id) === i.dataset.pn);
      if (p) p.name = i.value;
      try { await updateProduct(i.dataset.pn, { name: i.value }); } catch (e) { toast('Не удалось сохранить'); }
    };
  });
  $$('[data-pp]').forEach((i) => {
    i.onchange = async () => {
      const val = +i.value || 0;
      const p = PRODUCTS.find((x) => String(x.id) === i.dataset.pp);
      if (p) p.price = val;
      try { await updateProduct(i.dataset.pp, { price: val }); } catch (e) { toast('Не удалось сохранить'); }
    };
  });
  $$('[data-pc]').forEach((i) => {
    i.onchange = async () => {
      const p = PRODUCTS.find((x) => String(x.id) === i.dataset.pc);
      if (p) p.category = i.value;
      try { await updateProduct(i.dataset.pc, { category: i.value }); } catch (e) { toast('Не удалось сохранить'); }
    };
  });
  $$('[data-pm]').forEach((i) => {
    i.onchange = async () => {
      const p = PRODUCTS.find((x) => String(x.id) === i.dataset.pm);
      if (p) p.material = i.value;
      try { await updateProduct(i.dataset.pm, { material: i.value }); } catch (e) { toast('Не удалось сохранить'); }
    };
  });
  $$('[data-pdel]').forEach((b) => {
    b.onclick = async () => {
      if (!confirm('Удалить товар?')) return;
      try { await deleteProduct(b.dataset.pdel); const ix = PRODUCTS.findIndex((x) => String(x.id) === b.dataset.pdel); if (ix >= 0) PRODUCTS.splice(ix, 1); renderAdmin(); }
      catch (e) { toast('Не удалось удалить'); }
    };
  });
  $('#addProduct').onclick = async () => {
    try {
      const created = await createProduct({ name: 'Новый товар', price: 0, category: CATEGORIES[1], material: Object.keys(MATERIALS)[0] });
      PRODUCTS.push(created);
      renderAdmin();
    } catch (e) { toast('Не удалось добавить товар'); }
  };

  $$('[data-gt]').forEach((i) => {
    i.onchange = async () => {
      const g = GALLERY.find((x) => String(x.id) === i.dataset.gt);
      if (g) g.caption = i.value;
      try { await updateGalleryCaption(i.dataset.gt, i.value); } catch (e) { toast('Не удалось сохранить'); }
    };
  });
  $$('[data-gdel]').forEach((b) => {
    b.onclick = async () => {
      if (!confirm('Удалить фото?')) return;
      try { await deleteGalleryPhoto(b.dataset.gdel); const ix = GALLERY.findIndex((x) => String(x.id) === b.dataset.gdel); if (ix >= 0) GALLERY.splice(ix, 1); renderAdmin(); }
      catch (e) { toast('Не удалось удалить'); }
    };
  });
  $('#addPhoto').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    toast('Загружаем фото…');
    try {
      const created = await addGalleryPhoto(file, 'Новая работа');
      GALLERY.push({ id: created.id, src: created.src, caption: created.caption });
      renderAdmin();
    } catch (err) { toast('Не удалось загрузить фото'); }
  };

  $('#adminLogout').onclick = async () => {
    await supabase.auth.signOut();
    window.dispatchEvent(new CustomEvent('ik:navigate', { detail: 'cab' }));
  };
}

export async function routeAdmin() {
  if (!isBackendConfigured) { $('#app').innerHTML = noBackendViewHtml(); return; }
  $('#app').innerHTML = `<div class="loginwrap"><div class="sub">Загрузка…</div></div>`;
  const admin = await checkIsAdmin();
  if (admin) renderAdmin(); else renderAdminGate();
}
