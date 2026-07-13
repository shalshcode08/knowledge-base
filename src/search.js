(function () {
  var root = document.body.dataset.root || "";
  var modal = document.getElementById("searchModal");
  var input = document.getElementById("searchInput");
  var results = document.getElementById("searchResults");
  var empty = document.getElementById("searchEmpty");
  var openBtn = document.getElementById("searchOpen");
  if (!modal || !input || !results) return;

  var index = [];
  var loaded = false;
  var rows = [];
  var active = -1;

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function load() {
    if (loaded) return Promise.resolve();
    return fetch(root + "search-index.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        index = data;
        loaded = true;
      })
      .catch(function () {
        index = [];
        loaded = true;
      });
  }

  function render(q) {
    q = q.trim().toLowerCase();
    rows = [];
    index.forEach(function (page) {
      var hay = (page.title + " " + page.topic).toLowerCase();
      if (!q || hay.indexOf(q) >= 0) {
        rows.push({ label: page.title, sub: page.topic, href: root + page.path + ".html" });
      }
      (page.sections || []).forEach(function (s) {
        if (q && s.text.toLowerCase().indexOf(q) >= 0) {
          rows.push({
            label: s.text,
            sub: page.topic + " › " + page.title,
            href: root + page.path + ".html#" + s.id,
          });
        }
      });
    });
    rows = rows.slice(0, 40);
    results.innerHTML = rows
      .map(function (r, i) {
        return (
          '<li><a href="' +
          r.href +
          '" data-i="' +
          i +
          '"><span class="r-label">' +
          esc(r.label) +
          '</span><span class="r-sub">' +
          esc(r.sub) +
          "</span></a></li>"
        );
      })
      .join("");
    empty.hidden = rows.length > 0;
    active = -1;
  }

  function highlight() {
    var links = results.querySelectorAll("a");
    links.forEach(function (a, i) {
      a.classList.toggle("active", i === active);
    });
    if (active >= 0 && links[active]) links[active].scrollIntoView({ block: "nearest" });
  }

  function open() {
    load().then(function () {
      modal.hidden = false;
      document.body.classList.add("search-open");
      input.value = "";
      render("");
      input.focus();
    });
  }

  function close() {
    modal.hidden = true;
    document.body.classList.remove("search-open");
    active = -1;
  }

  if (openBtn) openBtn.addEventListener("click", open);

  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      modal.hidden ? open() : close();
      return;
    }
    if (modal.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      active = Math.min(active + 1, rows.length - 1);
      highlight();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      active = Math.max(active - 1, 0);
      highlight();
    } else if (e.key === "Enter" && active >= 0 && rows[active]) {
      window.location.href = rows[active].href;
    }
  });

  input.addEventListener("input", function () {
    render(input.value);
  });

  modal.addEventListener("click", function (e) {
    if (e.target === modal) close();
  });
})();
