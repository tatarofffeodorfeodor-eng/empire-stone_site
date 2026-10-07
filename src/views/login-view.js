import { $ } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { store, persist } from '../state/store.js';

export function normalizePhone(value) {
  return value.replace(/\D/g, '');
}

export function loginViewHtml() {
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

export function bindLoginView({ goTo }) {
  $('#doLogin').onclick = () => {
    const value = normalizePhone($('#phone').value);
    if (value.length < 10) { toast('Введите номер полностью'); return; }
    store.user = { phone: value };
    persist();
    toast('Добро пожаловать!');
    goTo('cab');
  };
}
