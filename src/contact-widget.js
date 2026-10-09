import { $, generateId } from './ui/dom.js';
import { toast } from './ui/toast.js';
import { store, persist } from './state/store.js';
import { normalizePhone } from './views/login-view.js';
import { createLead } from './lib/leads-orders.js';
import { createCustomOrder } from './lib/custom-orders.js';

function openCallbackForm() { $('#cbModal').classList.add('on'); }
function closeCallbackForm() { $('#cbModal').classList.remove('on'); }
function openCustomForm() { $('#coModal').classList.add('on'); }
function closeCustomForm() { $('#coModal').classList.remove('on'); }

function sendToTelegram(payload) {
  fetch('/.netlify/functions/send-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

/** Плавающая кнопка "Связаться" + её два всплывающих окна (контакты и форма обратного звонка). Markup — в index.html. */
export function initContactWidget() {
  $('#fab').onclick = () => $('#cd').classList.add('on');
  $('#cd').onclick = (e) => { if (e.target.id === 'cd') $('#cd').classList.remove('on'); };
  $('#cdClose').onclick = () => $('#cd').classList.remove('on');
  $('#cdCallback').onclick = () => { $('#cd').classList.remove('on'); openCallbackForm(); };
  $('#cdCustom').onclick = () => { $('#cd').classList.remove('on'); openCustomForm(); };
  $('#cbModal').onclick = (e) => { if (e.target.id === 'cbModal') closeCallbackForm(); };
  $('#cbClose').onclick = closeCallbackForm;
  $('#coModal').onclick = (e) => { if (e.target.id === 'coModal') closeCustomForm(); };
  $('#coClose').onclick = closeCustomForm;
  $('#coSend').onclick = async () => {
    const phone = normalizePhone($('#coPhone').value);
    if (phone.length < 10) { toast('Введите номер полностью'); return; }
    const name = $('#coName').value.trim();
    const description = $('#coDesc').value.trim();
    if (!description) { toast('Опишите, что хотите изготовить'); return; }
    const photoFile = $('#coPhoto').files[0];
    const btn = $('#coSend');
    btn.disabled = true; btn.textContent = 'Отправка…';
    await createCustomOrder({ phone, name, description, photoFile });
    btn.disabled = false; btn.textContent = 'Отправить';
    closeCustomForm();
    toast('Заявка отправлена — мы свяжемся с вами!');
    sendToTelegram({ type: 'custom_order', phone, name, text: description });
    $('#coPhone').value = ''; $('#coName').value = ''; $('#coDesc').value = ''; $('#coPhoto').value = '';
  };
  $('#cbSend').onclick = () => {
    const phone = normalizePhone($('#cbPhone').value);
    if (phone.length < 10) { toast('Введите номер полностью'); return; }
    const name = $('#cbName').value.trim();
    store.leads.push({ id: generateId(), date: new Date().toLocaleDateString('ru-RU'), phone, name });
    persist();
    closeCallbackForm();
    toast('Заявка отправлена — мы вам перезвоним!');
    createLead({ phone, name }); // пишем в общую БД — админ увидит заявку с любого устройства
    sendToTelegram({ type: 'callback', phone, name });
    $('#cbPhone').value = ''; $('#cbName').value = '';
  };
}
