// Apply background colors to publication type badges using JavaScript
// This approach bypasses Hugo's template rendering limitations and theme CSS conflicts

document.addEventListener("DOMContentLoaded", function () {
  // Define colors for each publication type
  const pubTypeColors = {
    "pub-type-uncat": "#757575", // Gray
    "pub-type-conf": "#2196F3", // Blue
    "pub-type-journal": "#4CAF50", // Green
    "pub-type-preprint": "#FF9800", // Orange
    "pub-type-report": "#FF9800", // Orange
    "pub-type-book": "#795548", // Brown
    "pub-type-book-section": "#795548", // Brown
    "pub-type-thesis": "#1565C0", // Dark Blue
    "pub-type-patent": "#009688", // Teal
    "pub-type-software": "#9C27B0", // Purple
  };

  // Apply colors to all badges with maximum specificity
  Object.keys(pubTypeColors).forEach(function (className) {
    const badges = document.querySelectorAll(".pub-type-badge." + className);
    badges.forEach(function (badge) {
      badge.style.setProperty(
        "background-color",
        pubTypeColors[className],
        "important"
      );
      badge.style.setProperty("color", "#fff", "important");
      badge.style.setProperty("display", "inline-block", "important");
      badge.style.setProperty("padding", "0.4em 0.6em", "important");
      badge.style.setProperty("border-radius", "3px", "important");
      badge.style.setProperty("text-decoration", "none", "important");
    });
  });
});
