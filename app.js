const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const store = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(`seo8u:${key}`)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(`seo8u:${key}`, JSON.stringify(value)); },
};

const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const input = document.createElement("textarea");
  input.value = text; input.style.position = "fixed"; input.style.opacity = "0";
  document.body.appendChild(input); input.select(); document.execCommand("copy"); input.remove();
};

$$('[data-year]').forEach((node) => node.textContent = new Date().getFullYear());

const duplicatedTicker = $('[data-ticker]');
if (duplicatedTicker) duplicatedTicker.innerHTML += duplicatedTicker.innerHTML;

const authForm = $('[data-auth-form]');
if (authForm) {
  authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const type = authForm.dataset.authForm;
    const data = Object.fromEntries(new FormData(authForm).entries());
    if (type === 'signup') {
      store.set('user', { name: data.name, email: data.email, username: data.username });
      store.set('session', true);
      location.href = 'dashboard.html';
    } else if (type === 'login') {
      store.set('session', true);
      if (!store.get('user')) store.set('user', { name: 'SEO8U Member', email: data.login, username: data.login });
      location.href = 'dashboard.html';
    } else {
      const alert = $('[data-alert]');
      alert.textContent = 'ส่งคำแนะนำสำหรับตั้งรหัสผ่านใหม่แล้ว กรุณาตรวจสอบอีเมล';
      alert.classList.add('show');
    }
  });
}

const dashboard = $('[data-dashboard]');
if (dashboard) {
  const user = store.get('user', { name: 'SEO8U Member', username: 'member' });
  $$('[data-user-name]').forEach((node) => node.textContent = user.name || user.username);
  $('[data-avatar]').textContent = (user.name || user.username || 'S').slice(0, 1).toUpperCase();

  const showPage = (id) => {
    $$('.page').forEach((page) => page.classList.toggle('active', page.id === id));
    $$('.side-nav a').forEach((link) => link.classList.toggle('active', link.dataset.page === id));
    history.replaceState(null, '', `#${id}`);
    $('.sidebar').classList.remove('open');
  };
  $$('[data-page]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    showPage(link.dataset.page);
  }));
  const requestedPage = location.hash.slice(1);
  const defaultPage = dashboard.dataset.defaultPage || 'overview';
  showPage(document.getElementById(requestedPage) ? requestedPage : defaultPage);
  $('[data-menu]')?.addEventListener('click', () => $('.sidebar').classList.toggle('open'));
  $('[data-logout]')?.addEventListener('click', () => { store.set('session', false); location.href = 'login.html'; });

  const paymentState = $('[data-payment-state]');
  $('[data-copy-account]')?.addEventListener('click', async () => {
    await copyText('8680273724');
    paymentState.textContent = 'คัดลอกเลขบัญชี 868-0-27372-4 แล้ว';
    setTimeout(() => paymentState.textContent = '', 2200);
  });
  const paymentQr = $('[data-payment-qr]');
  if (paymentQr) {
    paymentQr.addEventListener('error', () => {
      paymentQr.hidden = true;
      $('[data-qr-placeholder]').hidden = false;
      $('[data-save-qr]').disabled = true;
    });
  }
  $('[data-save-qr]')?.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = 'assets/payment-qr.png';
    link.download = 'SEO8U-Payment-QR.png';
    link.click();
    paymentState.textContent = 'กำลังบันทึก QR Code';
  });
  $('[data-slip-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    paymentState.textContent = 'รับข้อมูลแจ้งโอนแล้ว รอเจ้าหน้าที่ตรวจสอบ';
  });

  const apiKey = store.get('apiKey', '');
  if ($('[data-api-key]')) $('[data-api-key]').value = apiKey;
  $('[data-save-api]')?.addEventListener('click', () => {
    store.set('apiKey', $('[data-api-key]').value.trim());
    $('[data-api-state]').textContent = 'บันทึก API Key แล้ว';
    setTimeout(() => $('[data-api-state]').textContent = '', 1800);
  });

  const serviceSelect = $('[data-service]');
  const services = [
    { id: 101, name: 'Instagram Followers | HQ Global', rate: 39, min: 100, max: 100000 },
    { id: 202, name: 'Facebook Page Likes | Thailand', rate: 85, min: 100, max: 50000 },
    { id: 303, name: 'TikTok Views | Fast Start', rate: 4.5, min: 1000, max: 10000000 },
    { id: 404, name: 'YouTube Watch Hours | Premium', rate: 460, min: 100, max: 5000 },
    { id: 505, name: 'X Followers | Real Mix', rate: 120, min: 100, max: 50000 },
  ];
  if (serviceSelect) {
    serviceSelect.innerHTML = services.map((s) => `<option value="${s.id}">${s.id} - ${s.name} (${s.rate} ฿ / 1K)</option>`).join('');
    const update = () => {
      const service = services.find((s) => String(s.id) === serviceSelect.value) || services[0];
      const quantity = Number($('[data-quantity]').value || 0);
      $('[data-rate]').textContent = `${service.rate.toLocaleString('th-TH')} ฿`;
      $('[data-limits]').textContent = `${service.min.toLocaleString()} - ${service.max.toLocaleString()}`;
      $('[data-charge]').textContent = `${((service.rate * quantity) / 1000).toFixed(2)} ฿`;
    };
    serviceSelect.addEventListener('change', update);
    $('[data-quantity]').addEventListener('input', update);
    update();
  }
  $('[data-order-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const key = store.get('apiKey', '');
    const status = $('[data-order-state]');
    if (!key) {
      status.textContent = 'กรุณาใส่ API Key ในหน้า API ก่อนส่งออเดอร์จริง';
      return;
    }
    status.textContent = 'พร้อมเชื่อมต่อ API ผ่าน server proxy';
  });
}