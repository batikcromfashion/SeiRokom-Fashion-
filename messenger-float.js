(function() {
  function showFloat() {
    var isMessenger = window.location.search.includes('from=messenger') || document.referrer.includes('facebook');
    if (!isMessenger) return;

    // CSS যোগ করা
    var style = document.createElement('style');
    style.innerHTML = "#srf-float{position:fixed;top:15px;right:15px;z-index:9999999}#srf-float a{background:#0084FF;color:white;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:30px;text-decoration:none;box-shadow:0 4px 20px rgba(0,0,0,0.4);border:2px solid white;font-weight:bold}";
    document.head.appendChild(style);

    // বাটন বানানো
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
