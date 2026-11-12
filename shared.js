import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyAL1iu7Thu1-NMYHjv6Zy1oZvKjSq_TgpY",
  authDomain: "geoceria-a929b.firebaseapp.com",
  projectId: "geoceria-a929b",
  storageBucket: "geoceria-a929b.firebasestorage.app",
  messagingSenderId: "220003216678",
  appId: "1:220003216678:web:307b2fc463968d050365e7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Fungsi pembantu untuk kirim data online ke Firebase
window.simpanDataOnline = async function(namaKoleksi, dataObjek) {
  try {
    dataObjek.waktuKirim = new Date().toLocaleString('id-ID');
    const docRef = await addDoc(collection(db, namaKoleksi), dataObjek);
    console.log("Berhasil kirim ke Firebase:", docRef.id);
  } catch (e) {
    console.error("Gagal kirim ke Firebase:", e);
  }
};

function getModuleId() {
  return document.body.dataset.module || 'default';
}

function loadState() {
  var raw = localStorage.getItem('pbl_' + getModuleId());
  return raw ? JSON.parse(raw) : { step: 1, attempts: 0, journal: '', hintsOpened: [], completed: false, wrongAttempts: {} };
}

function saveState(state) {
  localStorage.setItem('pbl_' + getModuleId(), JSON.stringify(state));
}

var state = loadState();
window.state = state;
window.saveState = saveState;

// Navigasi antar fase
function goToStep(stepNumber) {
  document.querySelectorAll('.phase').forEach(function (el) {
    el.hidden = Number(el.dataset.step) !== stepNumber;
  });
  document.querySelectorAll('.rail-step').forEach(function (el) {
    var n = Number(el.dataset.step);
    el.classList.toggle('active', n === stepNumber);
    el.classList.toggle('done', n < stepNumber);
  });
  state.step = stepNumber;
  saveState(state);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep(current) { goToStep(current + 1); }
function prevStep(current) { goToStep(current - 1); }

function revealHint(hintId, level) {
  var el = document.getElementById(hintId + '-level-' + level);
  if (el) el.hidden = false;
  var key = hintId + '-' + level;
  if (state.hintsOpened.indexOf(key) === -1) {
    state.hintsOpened.push(key);
    saveState(state);
  }
}

function checkAnswer(inputId, correctValues, feedbackId, hintId, reasoningBoxId, wrongMessage) {
  var input = document.getElementById(inputId);
  var feedback = document.getElementById(feedbackId);
  var userAnswer = input.value.trim().toLowerCase();
  var isCorrect = correctValues.map(function (v) { return v.toLowerCase(); }).indexOf(userAnswer) !== -1;

  state.attempts += 1;

  if (!state.wrongAttempts) state.wrongAttempts = {};
  if (isCorrect && hintId) {
    state.wrongAttempts[hintId] = 0;
  } else if (!isCorrect && hintId) {
    state.wrongAttempts[hintId] = (state.wrongAttempts[hintId] || 0) + 1;
    var salah = state.wrongAttempts[hintId];
    if (salah === 2) {
      revealHint(hintId, 1);
    } else if (salah >= 4) {
      revealHint(hintId, 1);
      revealHint(hintId, 2);
    }
  }

  saveState(state);
  updateEffortNote();

  feedback.hidden = false;
  if (isCorrect) {
    feedback.className = 'feedback feedback-success';
    feedback.textContent = 'Tepat! Pemahamanmu tentang bagian ini sudah kuat.';
    if (reasoningBoxId) {
      var rb = document.getElementById(reasoningBoxId);
      if (rb) rb.hidden = false;
    }
  } else {
    feedback.className = 'feedback feedback-retry';
    feedback.textContent = wrongMessage || 'Belum tepat — dan itu bagian biasa dari proses belajar. Coba amati lagi bentuknya di kotak putar 3D di atas, atau buka petunjuk di bawah.';
  }
}

function updateEffortNote() {
  var el = document.getElementById('effort-note');
  if (el) el.textContent = 'Percobaan sejauh ini: ' + state.attempts + ' — bukan ukuran gagal, tapi bukti kamu terus mencoba.';
}

function simpanAlasan(fieldId, textareaId, statusId) {
  var el = document.getElementById(textareaId);
  if (!state.reasoning) state.reasoning = {};
  state.reasoning[fieldId] = el.value;
  saveState(state);
  var status = document.getElementById(statusId);
  if (status) {
    status.hidden = false;
    status.textContent = 'Alasan tersimpan.';
  }
}

function simpanPrediksi(fieldId, textareaId) {
  var el = document.getElementById(textareaId);
  if (!state.predictions) state.predictions = {};
  state.predictions[fieldId] = el.value.trim();
  saveState(state);
}

function tampilkanCallback(fieldId, targetId) {
  var target = document.getElementById(targetId);
  if (!target) return;
  var prediksi = state.predictions && state.predictions[fieldId];
  if (!prediksi && fieldId === 'unsur-elemen') prediksi = localStorage.getItem('kubus_prediksi');
  if (prediksi) {
    target.textContent = 'Tadi kamu menebak: "' + prediksi + '" — sekarang amati baik-baik, apakah dugaanmu tepat?';
  } else {
    target.textContent = 'Amati baik-baik bentuknya sekarang.';
  }
}

function isModuleCompleted(moduleId) {
  var raw = localStorage.getItem('pbl_' + moduleId);
  if (!raw) return false;
  var s = JSON.parse(raw);
  return !!s.completed;
}

document.addEventListener('DOMContentLoaded', function () {
  state.wrongAttempts = {};
  goToStep(state.step || 1);
  var journalEl = document.getElementById('journal-text');
  if (journalEl && state.journal) journalEl.value = state.journal;
  updateEffortNote();
  tampilkanCallback('unsur-elemen', 'callback-prediksi-unsur');
  tampilkanCallback('luasjaring-bentuk', 'callback-prediksi-luasjaring');
  tampilkanCallback('volume-isi', 'callback-prediksi-volume');
  // aksesibilitas global
  document.querySelectorAll('.feedback').forEach(function (el) {
    el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  });
  var navEl = document.querySelector('header nav'); if (navEl) navEl.setAttribute('aria-label', 'Navigasi utama');
  var wrapEl = document.querySelector('.wrap');
  if (wrapEl) { wrapEl.id = wrapEl.id || 'konten'; wrapEl.setAttribute('role', 'main'); }
  if (!document.querySelector('.skip-link')) {
    var sl = document.createElement('a');
    sl.className = 'skip-link'; sl.href = '#konten'; sl.textContent = 'Lewati ke konten';
    document.body.insertBefore(sl, document.body.firstChild);
  }
  document.querySelectorAll('input[id^="label-titik-"]').forEach(function (el) {
    el.setAttribute('aria-label', 'Label titik ' + el.id.replace('label-titik-', ''));
  });
});


function toggleAudio(audioId, btnId) {
  var audio = document.getElementById(audioId);
  var btn = document.getElementById(btnId);
  var textSpan = btn.querySelectorAll('span')[1];

  if (audio.paused) {
    audio.play();
    textSpan.textContent = 'Jeda Cerita';
    btn.style.backgroundColor = 'var(--warn-bg)';
  } else {
    audio.pause();
    textSpan.textContent = 'Dengarkan Cerita';
    btn.style.backgroundColor = 'transparent';
  }
  audio.onended = function() {
    textSpan.textContent = 'Dengarkan Ulang';
    btn.style.backgroundColor = 'transparent';
  };
}

function unduhJurnalKubus() {
  var unsur = JSON.parse(localStorage.getItem('pbl_kubus-unsur') || '{}');
  var luas = JSON.parse(localStorage.getItem('pbl_kubus-luas-jaring') || '{}');
  var vol = JSON.parse(localStorage.getItem('pbl_kubus-volume') || '{}');

  var teks = "JURNAL BELAJAR BANGUN RUANG: KUBUS\n";
  teks += "===================================\n\n";
  teks += "MODUL 1: UNSUR-UNSUR KUBUS\nTotal Percobaan: " + (unsur.attempts || 0) + "\n\n";
  
  var blob = new Blob([teks], { type: "text/plain;charset=utf-8" });
  var link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Jurnal_Kubus_Saya.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function resetModulKubus() {
  var konfirmasi = confirm("Apakah kamu yakin ingin menghapus semua progres modul kubus?");
  if (konfirmasi) {
    localStorage.removeItem('pbl_kubus-utama');
    localStorage.removeItem('pbl_kubus-penyelidikan');
    localStorage.removeItem('pbl_kubus-hasil');
    localStorage.removeItem('pbl_kubus-kuis');
    window.location.reload();
  }
}

function konfirmasiRumus(fieldId, benar, feedbackId, pesan, revealId) {
  if (!state.rumus) state.rumus = {};
  if (benar) state.rumus[fieldId] = true;
  else if (!state.rumus[fieldId]) state.rumus[fieldId] = false;
  state.attempts += 1;
  saveState(state);
  updateEffortNote();

  var feedback = document.getElementById(feedbackId);
  feedback.hidden = false;
  feedback.className = benar ? 'feedback feedback-success' : 'feedback feedback-retry';
  feedback.textContent = pesan;

  if (benar && revealId) {
    var rv = document.getElementById(revealId);
    if (rv) rv.hidden = false;
  }
}

function prosesLanjutPenyelidikan() {
  var kodeKelompok = document.getElementById('input-kelompok-kode');
  var prediksi = document.getElementById('input-prediksi-utama');
  
  var dataKelompok = {
    kodeKelompok: kodeKelompok ? kodeKelompok.value.trim() : '',
    prediksiAwal: prediksi ? prediksi.value.trim() : ''
  };

  if (dataKelompok.kodeKelompok || dataKelompok.prediksiAwal) {
    if (typeof window.simpanDataOnline === 'function') {
      window.simpanDataOnline('data_kelompok', dataKelompok);
    }
  }

  if (kodeKelompok) localStorage.setItem('kubus_kelompok', dataKelompok.kodeKelompok);
  if (prediksi) localStorage.setItem('kubus_prediksi', dataKelompok.prediksiAwal);

  try {
    if (typeof simpanPrediksi === 'function') simpanPrediksi('unsur-elemen', 'input-prediksi-utama');
  } catch (e) {
    console.warn("Fungsi opsional tidak ditemukan:", e);
  }

    window.location.href = document.body.dataset.next || 'kubus-penyelidikan.html';
}

// Fungsi Simpan Kelompok & Prediksi (Fase 2)
function simpanKelompok() {
  var kodeKelompok = document.getElementById('input-kelompok-kode');
  var prediksi = document.getElementById('input-prediksi-utama');
  
  var dataKelompok = {
    kodeKelompok: kodeKelompok ? kodeKelompok.value.trim() : '',
    prediksiAwal: prediksi ? prediksi.value.trim() : ''
  };

  if (typeof window.simpanDataOnline === 'function') {
    window.simpanDataOnline('data_kelompok', dataKelompok);
  }

  if (kodeKelompok) localStorage.setItem('kubus_kelompok', dataKelompok.kodeKelompok);
  if (prediksi) localStorage.setItem('kubus_prediksi', dataKelompok.prediksiAwal);
}

// Fungsi Simpan Jurnal Refleksi Akhir (Hanya satu, tidak duplikat)
function saveJournal(textareaId) {
  var el = document.getElementById(textareaId);
  state.journal = el ? el.value : '';
  state.completed = true;
  saveState(state);

  var dataRefleksi = {
    kodeKelompok: localStorage.getItem('kubus_kelompok') || 'Tanpa Kelompok',
    refleksiSiswa: el ? el.value : ''
  };

  if (typeof window.simpanDataOnline === 'function') {
    window.simpanDataOnline('jurnal_refleksi', dataRefleksi);
  }

  var status = document.getElementById('journal-status');
  if (status) {
    status.hidden = false;
    status.textContent = 'Refleksi berhasil disimpan secara online dan lokal!';
  }
}

function cekAktivitas1() {
  // Cek 8 Label Titik
  var inputIds = ['label-titik-1', 'label-titik-2', 'label-titik-3', 'label-titik-4', 'label-titik-5', 'label-titik-6', 'label-titik-7', 'label-titik-8'];
  var values = [];
  var isFilled = true;
  for (var i = 0; i < inputIds.length; i++) {
    var el = document.getElementById(inputIds[i]);
    var val = el ? el.value.trim().toUpperCase() : '';
    if (!val) isFilled = false;
    values.push(val);
  }

  // Cek Hitungan Sisi & Rusuk
  var sisi = document.getElementById('ans-sisi') ? document.getElementById('ans-sisi').value : '';
  var rusuk = document.getElementById('ans-rusuk') ? document.getElementById('ans-rusuk').value : '';

  var fb = document.getElementById('feedback-aktivitas1');
  fb.hidden = false;

  if (!isFilled || !sisi || !rusuk) {
    fb.className = 'feedback feedback-retry';
    fb.textContent = 'Isi dulu kedelapan kolom huruf (A-H), serta total angka sisi dan rusuknya ya!';
    return;
  }

  var validLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  var isValidChars = values.every(function(v) { return validLetters.indexOf(v) !== -1; });
  if (!isValidChars) {
    fb.className = 'feedback feedback-retry';
    fb.textContent = 'Gunakan huruf A sampai H saja untuk melabeli ke-8 titik sudut.';
    return;
  }

  var uniqueSet = new Set(values);
  var titikBenar = (uniqueSet.size === 8);
  var sisiBenar = (sisi === '6');
  var rusukBenar = (rusuk === '12');

  if (titikBenar && sisiBenar && rusukBenar) {
    fb.className = 'feedback feedback-success';
    fb.innerHTML = '✅ <strong>SEMPURNA!</strong> Kedelapan titik sudut dilabeli unik, serta kamu berhasil mengidentifikasi <strong>6 sisi</strong> dan <strong>12 rusuk</strong> dengan tepat. Rangka Pak Tono aman!';
  } else {
    fb.className = 'feedback feedback-retry';
    if (!titikBenar) {
      fb.textContent = 'Ada huruf yang kembar pada titik sudut. Tiap titik harus punya 1 huruf unik (A-H)!';
    } else if (!sisiBenar || !rusukBenar) {
      fb.textContent = 'Penamaan titik sudah benar, tapi hitungan SISI atau RUSUK masih keliru. Coba amati lagi bentuk kotak di atas!';
    }
  }
}
/* ==========================================================================
   Eksport Fungsi ke Global Window (Wajib agar tombol HTML bisa membacanya)
   ========================================================================== */
window.goToStep = goToStep;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.simpanKelompok = simpanKelompok;
window.saveJournal = saveJournal;
window.prosesLanjutPenyelidikan = prosesLanjutPenyelidikan;
window.checkAnswer = checkAnswer;
window.revealHint = revealHint;
window.toggleAudio = toggleAudio;
window.unduhJurnalKubus = unduhJurnalKubus;
window.resetModulKubus = resetModulKubus;
window.konfirmasiRumus = konfirmasiRumus;
window.simpanAlasan = simpanAlasan;
window.simpanPrediksi = simpanPrediksi;