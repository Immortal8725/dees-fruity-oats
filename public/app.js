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

  const FRUITS = ["Raisins", "Cranberries", "Apricots", "Prunes", "Dates", "Apples"];
  const NUTS = ["Almonds", "Walnuts", "Pecans", "Cashews"];
  const SPICES = ["Cinnamon", "Allspice", "Cardamom", "Nutmeg"];
  const PRICE_TBC = "Price confirmed on WhatsApp";

  const cart = [];
  let cartId = 1;
  let orderMode = "combo";

  const $ = (sel) => document.querySelector(sel);
  const fmt = (n) => "R" + n;

  function findCombo(id) {
    return MENU.find((m) => m.id === id);
  }

  function selectedValues(name) {
    return Array.from(document.querySelectorAll('input[name="' + name + '"]:checked')).map(
      (input) => input.value
    );
  }

  function renderChips(containerId, name, options) {
    const container = document.getElementById(containerId);
    container.innerHTML = options
      .map(function (opt) {
        const id = name + "-" + opt.toLowerCase().replace(/\s+/g, "-");
        return (
          '<label class="chip-toggle" for="' +
          id +
          '">' +
          '<input type="checkbox" id="' +
          id +
          '" name="' +
          name +
          '" value="' +
          opt +
          '" />' +
          "<span>" +
          opt +
          "</span>" +
          "</label>"
        );
      })
      .join("");
  }

  function isCustomMode() {
    return orderMode === "custom";
  }

  function setMode(mode, opts) {
    orderMode = mode === "custom" ? "custom" : "combo";
    const custom = isCustomMode();
    const comboRadio = document.querySelector('input[name="order-mode"][value="combo"]');
    const customRadio = document.querySelector('input[name="order-mode"][value="custom"]');
    if (comboRadio) comboRadio.checked = !custom;
    if (customRadio) customRadio.checked = custom;

    $("#combo-fields").hidden = custom;
    $("#custom-fields").hidden = !custom;
    $("#custom-mode-hint").hidden = !custom;
    $("#combo").required = !custom;
    $("#nut-legend-note").textContent = custom ? "(optional · pick any)" : "(optional)";
    $("#custom-error").hidden = true;
    updateLineTotal();

    if (opts && opts.scroll) {
      $("#order").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function currentLinePrice() {
    if (isCustomMode()) return null;
    const combo = findCombo($("#combo").value);
    const size = $("#size").value;
    const qty = Math.max(1, parseInt($("#qty").value, 10) || 1);
    if (!combo) return 0;
    return combo.prices[size] * qty;
  }

  function updateLineTotal() {
    const price = currentLinePrice();
    $("#line-total").textContent = price === null ? PRICE_TBC : fmt(price);
  }

  function renderMenus() {
    const basic = $("#basic-menu");
    const premium = $("#premium-menu");
    const select = $("#combo");

    MENU.forEach((item) => {
      const card = document.createElement("article");
      card.className = "menu-card" + (item.tier === "premium" ? " premium" : "");
      card.innerHTML =
        "<h4>" +
        item.name +
        "</h4>" +
        '<div class="price-row">' +
        '<span class="price-tag">500g ' +
        fmt(item.prices["500g"]) +
        "</span>" +
        '<span class="price-tag alt">1kg ' +
        fmt(item.prices["1kg"]) +
        "</span>" +
        "</div>" +
        '<button type="button" class="btn btn-outline" data-add="' +
        item.id +
        '">Add to order</button>';
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

  function cartHasCustom() {
    return cart.some((item) => item.custom);
  }

  function pricedTotal() {
    return cart.reduce(function (sum, item) {
      return sum + (item.custom ? 0 : item.lineTotal);
    }, 0);
  }

  function extrasText(item) {
    const parts = [];
    if (item.fruits && item.fruits.length) parts.push("Fruits: " + item.fruits.join(", "));
    if (item.nuts && item.nuts.length) parts.push("Nuts: " + item.nuts.join(", "));
    if (item.spices && item.spices.length) parts.push("Spices: " + item.spices.join(", "));
    return parts;
  }

  function renderCart() {
    const list = $("#cart-list");
    const totalEl = $("#cart-total");
    const noteEl = $("#cart-total-note");
    const waBtn = $("#wa-order");
    const clearBtn = $("#clear-cart");

    list.innerHTML = "";
    if (!cart.length) {
      list.innerHTML =
        '<li class="empty">No items yet — add a combo or build your own mix to get started.</li>';
      totalEl.textContent = "R0";
      noteEl.hidden = true;
      waBtn.disabled = true;
      clearBtn.hidden = true;
      return;
    }

    cart.forEach((item) => {
      const li = document.createElement("li");
      li.className = "cart-item" + (item.custom ? " custom" : "");
      const meta = extrasText(item);
      const priceLabel = item.custom ? PRICE_TBC : fmt(item.lineTotal);
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
        (meta.length ? "<br />" + meta.join("<br />") : "") +
        "</div>" +
        '<div class="meta"><strong>' +
        priceLabel +
        "</strong></div>";
      list.appendChild(li);
    });

    totalEl.textContent = fmt(pricedTotal());
    noteEl.hidden = !cartHasCustom();
    waBtn.disabled = false;
    clearBtn.hidden = false;
  }

  function addCustomItem() {
    const fruits = selectedValues("fruits");
    const nuts = selectedValues("nuts");
    const spices = selectedValues("spices");
    const error = $("#custom-error");

    if (!fruits.length && !nuts.length) {
      error.hidden = false;
      const firstFruit = document.querySelector('#fruit-chips input[type="checkbox"]');
      if (firstFruit) firstFruit.focus();
      return false;
    }

    error.hidden = true;
    const size = $("#size").value;
    const qty = Math.max(1, Math.min(50, parseInt($("#qty").value, 10) || 1));
    $("#qty").value = qty;

    cart.push({
      uid: cartId++,
      id: "custom",
      custom: true,
      name: "Build your own mix",
      size,
      qty,
      fruits,
      nuts,
      spices,
      unit: null,
      lineTotal: null,
    });
    return true;
  }

  function addComboItem() {
    const combo = findCombo($("#combo").value);
    if (!combo) return false;
    const size = $("#size").value;
    const qty = Math.max(1, Math.min(50, parseInt($("#qty").value, 10) || 1));
    $("#qty").value = qty;
    const nuts = selectedValues("nuts");
    const spices = selectedValues("spices");
    const unit = combo.prices[size];
    cart.push({
      uid: cartId++,
      id: combo.id,
      name: combo.name,
      size,
      qty,
      nuts,
      spices,
      unit,
      lineTotal: unit * qty,
      premium: combo.tier === "premium",
    });
    return true;
  }

  function addItem(fromForm) {
    const added = isCustomMode() ? addCustomItem() : addComboItem();
    if (!added) return;
    renderCart();
    if (fromForm) {
      $("#order").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function buildWhatsAppMessage() {
    const lines = ["Hi Dee's Fruity Oats! I'd like to place an order:", ""];
    cart.forEach((item, i) => {
      let line = i + 1 + ". " + item.name + " — " + item.size + " × " + item.qty;
      if (item.custom) {
        line += "\n   Price: confirmed on WhatsApp";
      } else {
        line += " = " + fmt(item.lineTotal);
      }
      extrasText(item).forEach(function (part) {
        line += "\n   " + part;
      });
      lines.push(line);
    });
    lines.push("");
    if (cartHasCustom()) {
      lines.push("Total (priced items): " + fmt(pricedTotal()));
      lines.push("+ custom mix price to be confirmed");
    } else {
      lines.push("Total: " + fmt(pricedTotal()));
    }
    lines.push("");
    lines.push("Thank you!");
    return lines.join("\n");
  }

  function openWhatsApp() {
    if (!cart.length) return;
    const url =
      "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(buildWhatsAppMessage());
    window.open(url, "_blank", "noopener");
  }

  // Init
  document.getElementById("year").textContent = new Date().getFullYear();
  renderChips("fruit-chips", "fruits", FRUITS);
  renderChips("nut-chips", "nuts", NUTS);
  renderChips("spice-chips", "spices", SPICES);
  renderMenus();
  setMode("combo");
  renderCart();

  document.querySelectorAll('input[name="order-mode"]').forEach(function (input) {
    input.addEventListener("change", function () {
      setMode(input.value);
    });
  });

  $("#combo").addEventListener("change", updateLineTotal);
  $("#size").addEventListener("change", updateLineTotal);
  $("#qty").addEventListener("input", updateLineTotal);

  $("#order-form").addEventListener("submit", function (e) {
    e.preventDefault();
    addItem(true);
  });

  const startCustom = $("#start-custom-mix");
  if (startCustom) {
    startCustom.addEventListener("click", function (e) {
      e.preventDefault();
      setMode("custom", { scroll: true });
    });
  }

  document.body.addEventListener("click", function (e) {
    const add = e.target.closest("[data-add]");
    if (add) {
      setMode("combo");
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
