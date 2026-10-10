(function() {
  function showFloat() {
    var isMessenger = window.location.search.includes('from=messenger') || document.referrer.includes('facebook');
    if (!isMessenger) return;
    if (document.getElementById('srf-float')) return; // ডাবল বাটন আটকাবে

    var style = document.createElement('style');
    style.innerHTML = "#srf-float{position:fixed;top:12px;right:12px;z-index:9999999}#srf-float a{display:flex;align-items:center;justify-content:center;width:38px;height:38px;background:#0084FF;color:#fff;border-radius:50%;text-decoration:none;font-size:22px;box-shadow:0 4px 12px rgba(0,0,0,0.3)}";
    document.head.appendChild(style);

    var div = document.createElement('div');
    div.id = 'srf-float';
    div.innerHTML = '<a href="https://m.me/61577173659001" title="Messenger">×</a>';
    document.body.appendChild(div);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showFloat);
  } else {
    showFloat();
  }
})();
