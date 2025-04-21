
function applyTranslations(lang) {
  const t = translations[lang] || translations["es"];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = t[key];
      } else {
        el.innerHTML = t[key];
      }
    }
  });
}

function setLanguage(lang) {
  localStorage.setItem("habitus_lang", lang);
  applyTranslations(lang);
}

document.addEventListener("DOMContentLoaded", () => {
  const lang = localStorage.getItem("habitus_lang") || "es";
  setLanguage(lang);
});

document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
  const key = el.getAttribute('data-i18n-placeholder');
  if (t[key]) el.placeholder = t[key];
});

if (typeof pasajes !== "undefined") {
  const elegido = pasajes[lang][Math.floor(Math.random() * pasajes[lang].length)];
  const box = document.getElementById("verseBox");
  if (box && elegido) {
    box.innerHTML = `<span class='block text-center italic text-sm text-gray-700'>“${elegido.texto}”</span><span class='block text-center text-xs text-gray-500 mt-1'>${elegido.cita}</span>`;
  }
}
