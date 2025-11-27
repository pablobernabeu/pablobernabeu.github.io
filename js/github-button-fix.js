// Force GitHub button styling via JavaScript to override all theme CSS
document.addEventListener("DOMContentLoaded", function () {
  const button = document.querySelector(".github-workflow-button");
  console.log("GitHub button found:", button);
  if (button) {
    // Apply styles with maximum priority - remove any inherited/conflicting styles first
    button.style.setProperty("background", "none", "important");
    button.style.setProperty("background-image", "none", "important");

    // Now apply our styles
    button.style.setProperty("display", "inline-block", "important");
    button.style.setProperty("padding", "0.75em 1.5em", "important");
    button.style.setProperty("background-color", "#1565C0", "important");
    button.style.setProperty("color", "#ffffff", "important");
    button.style.setProperty("text-decoration", "none", "important");
    button.style.setProperty("border-radius", "6px", "important");
    button.style.setProperty("font-weight", "600", "important");
    button.style.setProperty("transition", "all 0.3s", "important");
    button.style.setProperty(
      "box-shadow",
      "0 3px 6px rgba(0, 0, 0, 0.3)",
      "important"
    );
    button.style.setProperty("border", "2px solid #0d47a1", "important");

    console.log(
      "Button styles applied. Background color:",
      button.style.backgroundColor
    );

    // Add hover event listeners
    button.addEventListener("mouseenter", function () {
      this.style.setProperty("background-color", "#0d47a1", "important");
      this.style.setProperty("color", "#ffffff", "important");
      this.style.setProperty(
        "box-shadow",
        "0 5px 10px rgba(0, 0, 0, 0.4)",
        "important"
      );
      this.style.setProperty("transform", "translateY(-2px)", "important");
    });

    button.addEventListener("mouseleave", function () {
      this.style.setProperty("background-color", "#1565C0", "important");
      this.style.setProperty("color", "#ffffff", "important");
      this.style.setProperty(
        "box-shadow",
        "0 3px 6px rgba(0, 0, 0, 0.3)",
        "important"
      );
      this.style.setProperty("transform", "translateY(0)", "important");
    });
  } else {
    console.error("GitHub button NOT found!");
  }
});
