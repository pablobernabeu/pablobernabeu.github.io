// Long tables open as a preview.
//
// A table with dozens of rows can run to many screens, which buries the prose after it.
// On a page whose front matter sets `table_preview: true`, each table in the article
// with more than SHOWN + MARGIN body rows shows only its first SHOWN rows, the last of
// them fading out, and a button in the table's foot shows the rest or hides it again.
// A table only a little over the limit is left whole, as hiding two or three rows
// behind a button would cost more than it saves. The rows stay in the page, so the
// table prints whole (custom.scss) and a reader's own search can be run after showing
// them.
(function () {
  "use strict";

  var SHOWN = 10;
  var MARGIN = 5;

  function preview(table, index) {
    var body = table.tBodies[0];
    if (!body) return;
    var rows = Array.prototype.slice.call(body.rows);
    if (rows.length <= SHOWN + MARGIN) return;

    if (!table.id) table.id = "table-preview-" + (index + 1);
    table.classList.add("table-preview");

    var foot = table.createTFoot();
    var cell = foot.insertRow().insertCell();
    cell.colSpan = rows[0].cells.length;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "table-preview-toggle";
    button.setAttribute("aria-controls", table.id);
    cell.appendChild(button);

    function show(all) {
      rows.forEach(function (row, i) {
        row.classList.toggle("table-preview-hidden", !all && i >= SHOWN);
        row.classList.toggle("table-preview-edge", !all && i === SHOWN - 1);
      });
      button.setAttribute("aria-expanded", String(all));
      button.textContent = all ? "Show fewer rows" : "Show all " + rows.length + " rows";
    }

    show(false);
    button.addEventListener("click", function () {
      var all = button.getAttribute("aria-expanded") !== "true";
      show(all);
      // Hiding the rows again pulls the page up past the reader, who was at the foot of
      // the full table, so the button is brought back into view.
      if (!all) button.scrollIntoView({ block: "nearest" });
    });
  }

  function run() {
    Array.prototype.forEach.call(document.querySelectorAll(".article-style table"), preview);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
