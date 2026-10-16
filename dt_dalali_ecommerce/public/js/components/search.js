document.addEventListener("DOMContentLoaded", () => {
  let debounceTimer = null;
  const input = document.querySelector(".dalali-search-input") ? document.querySelector(".dalali-search-input") : document.querySelector(".dalali-catalog-search-input");
  const resultsBox = document.querySelector(".dalali-search-results");
  const searchBox = document.querySelector(".dalali-search-row") ? document.querySelector(".dalali-search-row") : document.querySelector(".dalali-catalog-search-row");
  const screenSize = window.innerWidth;
  input.addEventListener("focus", () => {
    renderRecents(); // 🔥 show history on focus
    resultsBox?.classList.add("show");
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      if (!searchBox.matches(":hover") && screenSize > 768) { // keep open on desktop if hovering results
        resultsBox?.classList.remove("show");
        searchBox?.classList.remove("open");
      }
    }, 150);
  });

  input.addEventListener("input", (e) => {
    const query = e.target.value.trim();

    clearTimeout(debounceTimer);

    if (!query) {
      renderRecents();
      return;
    }

    if (query.length < 3) return;

    debounceTimer = setTimeout(() => {
      runSearch(query);
    }, 300);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = input.value.trim();
      if (q) {
        saveRecent(q);
      }
    }
  });

  function runSearch(query) {
    frappe.call({
      method: "webshop.templates.pages.product_search.search",
      args: { query },
      callback: (res) => {
        const data = res.message || {};
        renderResults(data.product_results, data.category_results);

        if (data.product_results?.length || data.category_results?.length) {
          saveRecent(query);
        }
      }
    });
  }

  function renderResults(products = [], categories = []) {
    const container = document.querySelector(".dalali-search-results");

    let html = "";
    html += `
          <div class="close_dalali_search_results">
              <svg class="icon icon-sm">
                <use href="#icon-x"></use>
              </svg>
          </div>`

    // Categories
    if (categories.length) {
      html += `
        <div class="dt-search-section">
          <div class="dt-search-title">Categories</div>
          ${categories.map(c => `
            <a href="/${c.route}" class="dt-search-chip">
              ${c.name}
            </a>
          `).join(",")}
        </div>
      `;
    }

    // Products
    if (products.length) {
      html += `
        <div class="dt-search-section">
          <div class="dt-search-title">Products</div>
          ${products.map(p => `
            <a href="/${p.route}" data-item-code="${p.item_code}">
              <div class="dt-search-item">
                <img src="${p.thumbnail || p.website_image || '/assets/webshop/images/cart-empty-state.png'}" />
                <p>${p.web_item_name}</p>
              </div>
            </a>
          `).join("")}
        </div>
      `;
    }

    if (!html) {
      html = `<div class="dt-empty">No results</div>`;
    }

    container.innerHTML = html;

    document.querySelector(".close_dalali_search_results")?.addEventListener("click", () => {
      const resultsBox = document.querySelector(".dalali-search-results");
      const searchBox = document.querySelector(".dalali-search-row") ? document.querySelector(".dalali-search-row") : document.querySelector(".dalali-catalog-search-row");

      resultsBox?.classList.remove("show");
      searchBox?.classList.remove("open");
    });

    // 🔥 TRACK SEARCH CLICKS
    container.querySelectorAll('.dt-search-item').forEach(itemEl => {
      window.trackSearchClick(itemEl);
    });

  }

  const MAX_RECENTS = 4;

  function getRecents() {
    return JSON.parse(localStorage.getItem("recent_searches") || "[]");
  }

  function saveRecent(query) {
    let recents = getRecents();

    // remove duplicate
    recents = recents.filter(q => q !== query);

    // add latest
    recents.push(query);

    // limit
    if (recents.length > MAX_RECENTS) {
      recents.shift();
    }

    localStorage.setItem("recent_searches", JSON.stringify(recents));
  }
  function renderRecents() {
    const recents = getRecents();
    const container = document.querySelector(".dalali-search-results");

    if (!recents.length) {
      container.innerHTML = `<div class="dt-empty">No searches yet</div>`;
      return;
    }

    container.innerHTML = `
      <div class="dt-search-section">
        <div class="close_dalali_search_results">
            <svg class="icon icon-sm">
              <use href="#icon-x"></use>
            </svg>
        </div>
        <div class="dt-search-title">Recent</div>
        ${recents.map(q => `
          <div class="dt-search-item dt-recent" data-query="${q}">
            🕘 ${q}
          </div>
        `).join("")}
      </div>
    `;

    // click on recent
    container.querySelectorAll(".dt-recent").forEach(el => {
      el.addEventListener("click", () => {
        const q = el.dataset.query;
        document.querySelector(".dalali-search-input") ? document.querySelector(".dalali-search-input").value = q : document.querySelector(".dalali-catalog-search-input").value = q;
        runSearch(q);
      });
    });

    document.querySelector(".close_dalali_search_results")?.addEventListener("click", () => {
      const resultsBox = document.querySelector(".dalali-search-results");
      const searchBox = document.querySelector(".dalali-search-row") ? document.querySelector(".dalali-search-row") : document.querySelector(".dalali-catalog-search-row");

      resultsBox?.classList.remove("show");
      searchBox?.classList.remove("open");
    });

  }
})