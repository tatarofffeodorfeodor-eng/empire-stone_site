import { $, generateId } from './ui/dom.js';
import { toast } from './ui/toast.js';
import { store, persist } from './state/store.js';
import { normalizePhone } from './views/login-view.js';

function openCallbackForm() { $('#cbModal').classList.add('on'); }
function closeCallbackForm() { $('#cbModal').classList.remove('on'); }

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
  $('#cbModal').onclick = (e) => { if (e.target.id === 'cbModal') closeCallbackForm(); };
  $('#cbClose').onclick = closeCallbackForm;
  $('#cbSend').onclick = () => {
    const phone = normalizePhone($('#cbPhone').value);
    if (phone.length < 10) { toast('Введите номер полностью'); return; }
    const name = $('#cbName').value.trim();
    store.leads.push({ id: generateId(), date: new Date().toLocaleDateString('ru-RU'), phone, name });
    persist();
    closeCallbackForm();
    toast('Заявка отправлена — мы вам перезвоним!');
    sendToTelegram({ type: 'callback', phone, name });
    $('#cbPhone').value = ''; $('#cbName').value = '';
  };
}
