
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
