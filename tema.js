/* tema.js — tombol tema terang/gelap GeoCeria. Aktif hanya pada halaman yang memakai <html data-tema-siap>. */
(function () {
  var html = document.documentElement;
  if (!html.hasAttribute('data-tema-siap')) return;          // halaman belum siap: tetap terang, tanpa tombol
  var KUNCI = 'geoceria_tema';

  function baca() { try { return localStorage.getItem(KUNCI) === 'gelap' ? 'gelap' : 'terang'; } catch (e) { return 'terang'; } }
  function simpan(v) { try { localStorage.setItem(KUNCI, v); } catch (e) {} }

  var css =
    'html[data-tema="gelap"]{color-scheme:dark;--bg:#0F1722;--surface:#172231;--border:#2E3E55;--ink:#E8EEF5;--muted:#AEBBCB;--success-bg:#12332F;--warn-bg:#3B2A10;}' +
    'html[data-tema="gelap"] .feedback-success{color:#86E6DB;}' +
    'html[data-tema="gelap"] .feedback-retry{color:#FFCB80;}' +
    'html[data-tema="gelap"] .btn-hint:hover{background:#4A3513;}' +
    'html[data-tema="gelap"] .phase{box-shadow:0 10px 30px rgba(0,0,0,.35);}' +
    'html[data-tema="gelap"] input[type="text"],html[data-tema="gelap"] input[type="number"],html[data-tema="gelap"] textarea,html[data-tema="gelap"] select{background:#0F1722;color:#E8EEF5;border-color:#2E3E55;}' +
    '.tombol-tema{margin-left:14px;width:44px;height:44px;padding:0;border-radius:50%;border:2px solid #fff;background:rgba(255,255,255,.18);color:#fff;font-size:20px;line-height:1;cursor:pointer;vertical-align:middle;}' +
    '.tombol-tema.melayang{position:fixed;right:14px;bottom:14px;z-index:1000;margin:0;background:#fff;border-color:#2EC4B6;box-shadow:0 4px 12px rgba(0,0,0,.2);}';
  var st = document.createElement('style'); st.id = 'tema-css'; st.textContent = css; document.head.appendChild(st);

  function terapkan(v) {
    html.setAttribute('data-tema', v);
    var b = document.getElementById('tombol-tema');
    if (b) {
      b.textContent = v === 'gelap' ? '☀️' : '🌙';
      b.setAttribute('aria-pressed', v === 'gelap' ? 'true' : 'false');
      b.setAttribute('aria-label', v === 'gelap' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap');
      b.title = v === 'gelap' ? 'Tema terang' : 'Tema gelap';
    }
  }

  terapkan(baca());                                           // diterapkan sebelum halaman tampil, supaya tidak berkedip

  document.addEventListener('DOMContentLoaded', function () {
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'tombol-tema'; b.className = 'tombol-tema';
    var host = document.querySelector('header.topbar nav') || document.querySelector('body > nav');
    if (host) host.appendChild(b); else { b.className += ' melayang'; document.body.appendChild(b); }
    b.addEventListener('click', function () {
      var baru = html.getAttribute('data-tema') === 'gelap' ? 'terang' : 'gelap';
      simpan(baru); terapkan(baru);
    });
    terapkan(html.getAttribute('data-tema'));
  });
})();