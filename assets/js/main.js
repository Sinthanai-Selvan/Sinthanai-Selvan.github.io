// ============================================================
// Site-wide behaviour: nav, footer year, tabs & sub-tabs
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav toggle
  var burger = document.getElementById("navBurger");
  var links = document.getElementById("navLinks");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var isOpen = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    // Close menu after clicking a link (mobile)
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Top-level tool tabs (data-tabgroup / data-tab)
  document.querySelectorAll(".tool-tabs").forEach(function (group) {
    var buttons = group.querySelectorAll(".tool-tab");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");

        var targetId = btn.getAttribute("data-tab");
        // Panels live as siblings within the same section as the tab group
        var section = group.closest("section");
        section.querySelectorAll(".tool-panel").forEach(function (p) {
          p.classList.remove("active");
        });
        var target = document.getElementById(targetId);
        if (target) target.classList.add("active");
      });
    });
  });

  // Sub-tabs within a tool panel (data-subgroup / data-mode)
  document.querySelectorAll(".sub-tabs").forEach(function (group) {
    var buttons = group.querySelectorAll(".sub-tab");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");

        var targetId = btn.getAttribute("data-mode");
        var panel = group.closest(".tool-panel");
        panel.querySelectorAll(".calc-mode").forEach(function (p) {
          p.classList.remove("active");
        });
        var target = document.getElementById(targetId);
        if (target) target.classList.add("active");
      });
    });
  });
});
