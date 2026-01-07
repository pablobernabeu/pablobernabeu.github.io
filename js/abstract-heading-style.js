// Style h3 elements containing "Abstract" text
(function() {
  document.addEventListener("DOMContentLoaded", function() {
    var h3Elements = document.querySelectorAll("h3");
    h3Elements.forEach(function(h3) {
      if (h3.textContent.trim() === "Abstract") {
        h3.style.marginTop = "-10%";
      }
    });
  });
})();
