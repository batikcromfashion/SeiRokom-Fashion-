/* SeiRokom Fashion — Product Options & WhatsApp UX Fix
   Add this script AFTER the existing product-page inline script.
*/
(function(){
  function init(){
    document.querySelectorAll(".size-btn,.color-circle").forEach(function(el){
      el.style.position="relative";
      el.style.zIndex="20";
      el.style.pointerEvents="auto";
      el.style.touchAction="manipulation";
      el.style.cursor="pointer";
      if(el.classList.contains("color-circle")) el.setAttribute("role","button");
    });

    document.querySelectorAll(".size-btn").forEach(function(btn){
      btn.addEventListener("click",function(){
        document.querySelectorAll(".size-btn").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        window.selectedSize=btn.dataset.size||"";
      },{passive:true});
    });

    document.querySelectorAll(".color-circle").forEach(function(btn){
      btn.addEventListener("click",function(){
        document.querySelectorAll(".color-circle").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        window.selectedColor=btn.dataset.color||"";
      },{passive:true});
    });

    // If the page already defines orderOnWhatsApp, replace it with a confirmation
    // dialog so WhatsApp is not opened accidentally by a single tap.
    if(typeof window.orderOnWhatsApp==="function" && !window.__srfWaFixed){
      window.__srfWaFixed=true;
      var original=window.orderOnWhatsApp;
      window.orderOnWhatsApp=function(){
        var size=window.selectedSize||"";
        var color=window.selectedColor||"";
        var q=window.qty||1;
        var ok=confirm("WhatsApp-এ অর্ডার প্রস্তুত করবেন?\n\nসাইজ: "+size+"\nরং: "+color+"\nপরিমাণ: "+q+"\n\nOK চাপলে WhatsApp খুলবে।");
        if(ok) original();
      };
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();
