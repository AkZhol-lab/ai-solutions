(function () {
  "use strict";

  var TG_USER = "zholic_01";
  var TG_URL = "https://t.me/" + TG_USER;
  var doc = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  doc.classList.add("js"); // also set inline in <head> to avoid a flash before this deferred script runs

  /* Header border on scroll */
  var header = document.querySelector(".header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    if (!burger || !nav) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    nav.classList.toggle("is-open", open);
  }
  if (burger && nav) {
    burger.addEventListener("click", function () {
      setMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 960) setMenu(false);
    });
  }

  /* Reveal on scroll */
  var revealEls = document.querySelectorAll(".reveal");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Hero chat: play the scenario message by message */
  var chat = document.querySelector(".chat");
  var chatBody = document.getElementById("chat");
  if (chat && chatBody && !reduceMotion) {
    var msgs = Array.prototype.slice.call(chatBody.querySelectorAll(".msg"));
    chat.classList.add("is-animated");
    var typing = document.createElement("li");
    typing.className = "typing";
    typing.setAttribute("aria-hidden", "true");
    typing.innerHTML = "<i></i><i></i><i></i>";

    var i = 0;
    function next() {
      if (i >= msgs.length) return;
      var m = msgs[i];
      var isOut = m.classList.contains("msg--out");
      if (isOut) {
        typing.className = "typing typing--out";
        chatBody.insertBefore(typing, m);
        setTimeout(function () {
          if (typing.parentNode) typing.parentNode.removeChild(typing);
          m.classList.add("is-shown");
          i++;
          setTimeout(next, 900);
        }, 1100);
      } else {
        m.classList.add("is-shown");
        i++;
        setTimeout(next, m.classList.contains("msg--sys") ? 0 : 700);
      }
    }
    setTimeout(next, 500);
  }

  /* Message composer -> Telegram */
  var form = document.getElementById("composer");
  var chips = document.querySelectorAll("#chips .chip");
  var area = document.getElementById("task");
  var hint = document.getElementById("hint");

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var on = chip.getAttribute("aria-pressed") === "true";
      chip.setAttribute("aria-pressed", String(!on));
    });
  });

  function buildMessage() {
    var picked = Array.prototype.slice.call(chips)
      .filter(function (c) { return c.getAttribute("aria-pressed") === "true"; })
      .map(function (c) { return c.textContent.trim(); });
    var lines = ["Здравствуйте! Хочу обсудить задачу для своего бизнеса."];
    if (picked.length) lines.push("Направление: " + picked.join(", ") + ".");
    var text = area ? area.value.trim() : "";
    if (text) lines.push("Как сейчас: " + text);
    return lines.join("\n");
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var message = buildMessage();
      var url = TG_URL + "?text=" + encodeURIComponent(message);
      // Open synchronously to stay within the user gesture (popup blockers).
      var win = window.open(url, "_blank");
      if (win) { try { win.opener = null; } catch (err) { /* ignore */ } }
      copyText(message).then(function (copied) {
        if (!hint) return;
        hint.classList.add("is-ok");
        hint.textContent = copied
          ? "Готово: чат открыт, текст скопирован. Если поле в Telegram пустое — вставьте его (Ctrl+V или долгое нажатие)."
          : "Чат открыт. Если текст не подставился, опишите задачу в нескольких словах — этого достаточно.";
      });
      if (!win) window.location.href = url;
    });
  }
})();
