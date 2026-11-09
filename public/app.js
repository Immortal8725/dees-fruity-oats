(function () {
  const WHATSAPP = "27663562279";
  const WHATSAPP_DISPLAY = "066 356 2279";

  const MENU = [
    { id: "raisins", name: "Oats + Raisins", tier: "basic", prices: { "500g": 35, "1kg": 70 } },
    { id: "cranberries", name: "Oats + Cranberries", tier: "basic", prices: { "500g": 45, "1kg": 90 } },
    { id: "prunes", name: "Oats + Prunes", tier: "basic", prices: { "500g": 50, "1kg": 100 } },
    { id: "dates", name: "Oats + Dates", tier: "basic", prices: { "500g": 45, "1kg": 90 } },
    { id: "apples", name: "Oats + Apples", tier: "basic", prices: { "500g": 60, "1kg": 120 } },
    { id: "apricots", name: "Oats + Apricots", tier: "basic", prices: { "500g": 60, "1kg": 120 } },
    { id: "raisins-nuts", name: "Oats + Raisins + Nuts", tier: "premium", prices: { "500g": 50, "1kg": 95 } },
    { id: "cranberries-nuts", name: "Oats + Cranberries + Nuts", tier: "premium", prices: { "500g": 60, "1kg": 115 } },
    { id: "prunes-nuts", name: "Oats + Prunes + Nuts", tier: "premium", prices: { "500g": 65, "1kg": 125 } },
    { id: "dates-nuts", name: "Oats + Dates + Nuts", tier: "premium", prices: { "500g": 60, "1kg": 115 } },
    { id: "apples-nuts", name: "Oats + Apples + Nuts", tier: "premium", prices: { "500g": 75, "1kg": 150 } },
    { id: "apricots-nuts", name: "Oats + Apricots + Nuts", tier: "premium", prices: { "500g": 75, "1kg": 150 } },
  ];

  const cart = [];
  let cartId = 1;

  const $ = (sel) => document.querySelector(sel);
  const fmt = (n) => "R" + n;

  function findCombo(id) {
    return MENU.find((m) => m.id === id);
  }

  function currentLinePrice() {
    const combo = findCombo($("#combo").value);
    const size = $("#size").value;
    const qty = Math.max(1, parseInt($("#qty").value, 10) || 1);
    if (!combo) return 0;
    return combo.prices[size] * qty;
  }

  function updateLineTotal() {
    $("#line-total").textContent = fmt(currentLinePrice());
  }

  function renderMenus() {
    const basic = $("#basic-menu");
    const premium = $("#premium-menu");
    const select = $("#combo");

    MENU.forEach((item) => {
      const card = document.createElement("article");
      card.className = "menu-card" + (item.tier === "premium" ? " premium" : "");
      card.innerHTML =
        "<h4>" + item.name + "</h4>" +
        '<div class="price-row">' +
        '<span class="price-tag">500g ' + fmt(item.prices["500g"]) + "</span>" +
        '<span class="price-tag alt">1kg ' + fmt(item.prices["1kg"]) + "</span>" +
        "</div>" +
        '<button type="button" class="btn btn-outline" data-add="' + item.id + '">Add to order</button>';
      (item.tier === "basic" ? basic : premium).appendChild(card);

      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent =
        item.name +
        " — 500g " +
        fmt(item.prices["500g"]) +
        " / 1kg " +
        fmt(item.prices["1kg"]);
      select.appendChild(opt);
    });
  }

  function renderCart() {
    const list = $("#cart-list");
    const totalEl = $("#cart-total");
    const waBtn = $("#wa-order");
    const clearBtn = $("#clear-cart");

    list.innerHTML = "";
    if (!cart.length) {
      list.innerHTML = '<li class="empty">No items yet — add a combo to get started.</li>';
      totalEl.textContent = "R0";
      waBtn.disabled = true;
      clearBtn.hidden = true;
      return;
    }

    let total = 0;
    cart.forEach((item) => {
      total += item.lineTotal;
      const li = document.createElement("li");
      li.className = "cart-item";
      const extras = [];
      if (item.nut) extras.push(item.nut);
      if (item.spice) extras.push(item.spice);
      li.innerHTML =
        '<div class="row"><strong>' +
        item.name +
        '</strong><button type="button" data-remove="' +
        item.uid +
        '">Remove</button></div>' +
        '<div class="meta">' +
        item.size +
        " × " +
        item.qty +
        (extras.length ? " · " + extras.join(", ") : "") +
        "</div>" +
        '<div class="meta"><strong>' +
        fmt(item.lineTotal) +
        "</strong></div>";
      list.appendChild(li);
    });

    totalEl.textContent = fmt(total);
    waBtn.disabled = false;
    clearBtn.hidden = false;
  }

  function addItem(fromForm) {
    const combo = findCombo($("#combo").value);
    if (!combo) return;
    const size = $("#size").value;
    const qty = Math.max(1, Math.min(50, parseInt($("#qty").value, 10) || 1));
    $("#qty").value = qty;
    const nut = $("#nut").value;
    const spice = $("#spice").value;
    const unit = combo.prices[size];
    cart.push({
      uid: cartId++,
      id: combo.id,
      name: combo.name,
      size,
      qty,
      nut: combo.tier === "premium" ? nut : nut && combo.tier === "basic" ? nut : "",
      spice,
      unit,
      lineTotal: unit * qty,
      premium: combo.tier === "premium",
    });
    // For basic, still allow optional nut note if user picked one
    if (combo.tier === "basic" && nut) {
      cart[cart.length - 1].nut = nut;
    }
    renderCart();
    if (fromForm) {
      $("#order").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function buildWhatsAppMessage() {
    const lines = [
      "Hi Dee's Fruity Oats! I'd like to place an order:",
      "",
    ];
    let total = 0;
    cart.forEach((item, i) => {
      total += item.lineTotal;
      let line =
        i +
        1 +
        ". " +
        item.name +
        " — " +
        item.size +
        " × " +
        item.qty +
        " = " +
        fmt(item.lineTotal);
      if (item.nut) line += "\n   Nut preference: " + item.nut;
      if (item.spice) line += "\n   Spice: " + item.spice;
      lines.push(line);
    });
    lines.push("");
    lines.push("Total: " + fmt(total));
    lines.push("");
    lines.push("Thank you!");
    return lines.join("\n");
  }

  function openWhatsApp() {
    if (!cart.length) return;
    const url =
      "https://wa.me/" +
      WHATSAPP +
      "?text=" +
      encodeURIComponent(buildWhatsAppMessage());
    window.open(url, "_blank", "noopener");
  }

  // Init
  document.getElementById("year").textContent = new Date().getFullYear();
  renderMenus();
  updateLineTotal();
  renderCart();

  $("#combo").addEventListener("change", updateLineTotal);
  $("#size").addEventListener("change", updateLineTotal);
  $("#qty").addEventListener("input", updateLineTotal);

  $("#order-form").addEventListener("submit", function (e) {
    e.preventDefault();
    addItem(true);
  });

  document.body.addEventListener("click", function (e) {
    const add = e.target.closest("[data-add]");
    if (add) {
      $("#combo").value = add.getAttribute("data-add");
      updateLineTotal();
      addItem(true);
      return;
    }
    const remove = e.target.closest("[data-remove]");
    if (remove) {
      const uid = Number(remove.getAttribute("data-remove"));
      const idx = cart.findIndex((c) => c.uid === uid);
      if (idx >= 0) cart.splice(idx, 1);
      renderCart();
    }
  });

  $("#wa-order").addEventListener("click", openWhatsApp);
  $("#clear-cart").addEventListener("click", function () {
    cart.length = 0;
    renderCart();
  });

  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  toggle.addEventListener("click", function () {
    const open = mobileNav.hasAttribute("hidden");
    if (open) {
      mobileNav.removeAttribute("hidden");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    } else {
      mobileNav.setAttribute("hidden", "");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }
  });
  mobileNav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", function () {
      mobileNav.setAttribute("hidden", "");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
})();
