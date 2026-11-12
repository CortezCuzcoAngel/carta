(function () {
  "use strict";

  const GRUPOS = [
    { id: "bar", nombre: "Ceviches y bar" },
    { id: "casa", nombre: "El sabor de casa" },
  ];

  const CATEGORIAS = {
    Desayunos: { label: "Desayunos", grupo: "casa", emoji: "☕" },
    Platos_Tipicos: { label: "Platos típicos", grupo: "casa", emoji: "🍽️" },
    Platos_a_la_carta: {
      label: "Platos a la carta",
      grupo: "casa",
      emoji: "🍛",
    },
    Guarniciones: { label: "Guarniciones", grupo: "casa", emoji: "🍚" },
    Entradas: { label: "Entradas", grupo: "casa", emoji: "🌽" },
    Dietas: { label: "Dietas", grupo: "casa", emoji: "🥗" },
    Postres: { label: "Postres", grupo: "casa", emoji: "🍮" },
    Bebidas_frias: { label: "Bebidas frías", grupo: "casa", emoji: "🥤" },
    Bebidas_Calientes: {
      label: "Bebidas calientes",
      grupo: "casa",
      emoji: "🍵",
    },
    Caldos: { label: "Caldos", grupo: "casa", emoji: "🍲" },
    Adicionales: { label: "Adicionales", grupo: "casa", emoji: "🍳" },
    Sanduiches: { label: "Sándwiches", grupo: "casa", emoji: "🥪" },
    Batidos: { label: "Batidos", grupo: "casa", emoji: "🥛" },
    Jugos: { label: "Jugos", grupo: "casa", emoji: "🍊" },
    Ceviches: { label: "Ceviches", grupo: "bar", emoji: "🐟" },
    Chicharron: { label: "Chicharrones", grupo: "bar", emoji: "🍤" },
    Mariscos: { label: "Mariscos", grupo: "bar", emoji: "🦐" },
    Jalea: { label: "Jalea", grupo: "bar", emoji: "🍤" },
    Parihuelas: { label: "Parihuelas", grupo: "bar", emoji: "🥘" },
    Tragos: { label: "Tragos", grupo: "bar", emoji: "🍹" },
    Cervezas: { label: "Cervezas", grupo: "bar", emoji: "🍺" },
    Piscos: { label: "Piscos", grupo: "bar", emoji: "🍇" },
    Vinos: { label: "Vinos", grupo: "bar", emoji: "🍷" },
    Whisky: { label: "Whisky", grupo: "bar", emoji: "🥃" },
    Espumantes: { label: "Espumantes", grupo: "bar", emoji: "🥂" },
  };

  const $ = (s) => document.querySelector(s);
  const norm = (t) =>
    String(t)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const esc = (t) =>
    String(t == null ? "" : t).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  const lista = $("#lista"),
    barra = $("#barra"),
    arriba = $("#arriba");
  const buscador = $("#buscador"),
    limpiar = $("#limpiar"),
    pista = $("#pista");

  if (typeof PLATOS === "undefined") {
    lista.innerHTML =
      '<p class="vacio">No se pudo cargar la carta. Revisa que exista <strong>js/platos.js</strong>.</p>';
    return;
  }

  const infoCat = (k) =>
    CATEGORIAS[k] || {
      label: String(k).replace(/_/g, " "),
      grupo: "casa",
      emoji: "🍽️",
    };
  const numPrecio = (p) => parseFloat(String(p).replace(/[^0-9.]/g, "")) || 0;
  function precioTxt(p) {
    const n = parseFloat(String(p).replace(/[^0-9.]/g, ""));
    if (isNaN(n)) return p;
    return "S/ " + (Number.isInteger(n) ? n : n.toFixed(2));
  }

  const clavesUsadas = [...new Set(PLATOS.map((p) => p.categoria))];
  const ordenCats = Object.keys(CATEGORIAS)
    .filter((k) => clavesUsadas.includes(k))
    .concat(clavesUsadas.filter((k) => !CATEGORIAS[k]));

  const estado = { grupo: "todos", cat: "todos", q: "", orden: "carta" };
  let visibles = [];

  function pintarGrupos() {
    $("#filtro-grupos").innerHTML = [{ id: "todos", nombre: "Todos" }]
      .concat(GRUPOS)
      .map(
        (g) =>
          `<button type="button" class="pill pill-grupo${g.id === estado.grupo ? " activo" : ""}" data-grupo="${g.id}">${esc(g.nombre)}</button>`,
      )
      .join("");
  }
  function pintarCategorias() {
    const vis = ordenCats.filter(
      (k) => estado.grupo === "todos" || infoCat(k).grupo === estado.grupo,
    );
    $("#filtro-cats").innerHTML = [
      `<button type="button" class="pill pill-cat${estado.cat === "todos" ? " activo" : ""}" data-cat="todos">Todos</button>`,
    ]
      .concat(
        vis.map(
          (k) =>
            `<button type="button" class="pill pill-cat${estado.cat === k ? " activo" : ""}" data-cat="${esc(k)}">${esc(infoCat(k).label)}</button>`,
        ),
      )
      .join("");
    $("#filtro-cats").scrollLeft = 0;
  }

  // ---------- Lista ---------
  function itemHTML(p, i) {
    const c = infoCat(p.categoria);
    const nombre = String(p.nombre || "").trim();
    const finde = /s[áa]bados y domingos/i.test(
      (p.resumen || "") + " " + (p.descripcion || ""),
    );
    return `
      <article class="item" data-i="${i}" role="button" tabindex="0" aria-label="Ver ${esc(nombre)}">
        <div class="item-foto" data-emoji="${c.emoji}"><img src="${esc(p.imagen)}" alt="${esc(nombre)}" loading="lazy"></div>
        <div class="item-info">
          <span class="item-cat">${esc(c.label)}</span>
          <div class="item-top"><h3>${esc(nombre)}</h3><i class="punteado"></i><span class="item-precio">${esc(precioTxt(p.precio))}</span></div>
          <p>${esc(p.resumen || p.descripcion || "")}</p>
          ${finde ? '<span class="item-aviso">Solo sábados y domingos</span>' : ""}
        </div>
      </article>`;
  }

  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (es) =>
            es.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add("visible");
                io.unobserve(e.target);
              }
            }),
          { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
        )
      : null;

  function revelar() {
    lista.querySelectorAll(".item").forEach((el, i) => {
      el.style.setProperty("--d", (i % 6) * 50 + "ms");
      io ? io.observe(el) : el.classList.add("visible");
    });
  }

  function pintarLista() {
    const q = norm(estado.q.trim());
    const platos = PLATOS.filter((p) => {
      if (
        estado.grupo !== "todos" &&
        infoCat(p.categoria).grupo !== estado.grupo
      )
        return false;
      if (estado.cat !== "todos" && p.categoria !== estado.cat) return false;
      if (
        q &&
        !norm(
          p.nombre + " " + (p.resumen || "") + " " + infoCat(p.categoria).label,
        ).includes(q)
      )
        return false;
      return true;
    });
    $("#contador").textContent =
      platos.length === 1 ? "1 plato" : platos.length + " platos";
    visibles = [];
    if (!platos.length) {
      lista.innerHTML =
        '<p class="vacio">No encontramos platos con esa búsqueda. Prueba con otra palabra o cambia de categoría 🍽️</p>';
      return;
    }
    lista.innerHTML = ordenCats
      .map((k) => {
        let sub = platos.filter((p) => p.categoria === k);
        if (!sub.length) return "";
        if (estado.orden === "asc")
          sub = sub
            .slice()
            .sort((a, b) => numPrecio(a.precio) - numPrecio(b.precio));
        if (estado.orden === "desc")
          sub = sub
            .slice()
            .sort((a, b) => numPrecio(b.precio) - numPrecio(a.precio));
        return `
        <section class="lista-seccion">
          <h2 class="lista-titulo">${esc(infoCat(k).label)} <small>${sub.length}</small></h2>
          <div class="items">${sub
            .map((p) => {
              visibles.push(p);
              return itemHTML(p, visibles.length - 1);
            })
            .join("")}</div>
        </section>`;
      })
      .join("");
    revelar();
  }

  function irALista() {
    const top = lista.getBoundingClientRect().top,
      h = barra.offsetHeight;
    if (top < h)
      window.scrollTo({
        top: window.scrollY + top - h - 12,
        behavior: "smooth",
      });
  }

  $("#filtro-grupos").addEventListener("click", (e) => {
    const b = e.target.closest("[data-grupo]");
    if (!b) return;
    estado.grupo = b.dataset.grupo;
    estado.cat = "todos";
    document
      .querySelectorAll(".pill-grupo")
      .forEach((x) => x.classList.toggle("activo", x === b));
    pintarCategorias();
    pintarLista();
    irALista();
  });
  $("#filtro-cats").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    estado.cat = b.dataset.cat;
    document
      .querySelectorAll(".pill-cat")
      .forEach((x) => x.classList.toggle("activo", x === b));
    b.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
    pintarLista();
    irALista();
  });
  buscador.addEventListener("input", () => {
    estado.q = buscador.value;
    limpiar.hidden = !buscador.value;
    pintarLista();
  });
  limpiar.addEventListener("click", () => {
    buscador.value = "";
    estado.q = "";
    limpiar.hidden = true;
    pintarLista();
    buscador.focus();
  });
  $("#orden").addEventListener("change", (e) => {
    estado.orden = e.target.value;
    pintarLista();
  });
  $("#filtro-cats").addEventListener(
    "scroll",
    () => pista.classList.add("visto"),
    { once: true, passive: true },
  );

  lista.addEventListener(
    "error",
    (e) => {
      if (e.target.tagName !== "IMG") return;
      e.target.style.display = "none";
      const marco = e.target.closest(".item-foto");
      if (marco) marco.classList.add("sin-foto");
    },
    true,
  );
  let ultimo = window.scrollY;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY,
        dy = y - ultimo;
      if (Math.abs(dy) > 6) {
        const escribiendo = document.activeElement === buscador;
        barra.classList.toggle("oculta", dy > 0 && y > 260 && !escribiendo);
        ultimo = y;
      }
      arriba.classList.toggle("ver", y > 700);
    },
    { passive: true },
  );
  arriba.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );

  const visor = $("#visor"),
    vImg = $("#visor-img");
  let actual = 0;
  vImg.addEventListener("error", () => vImg.classList.add("roto"));
  vImg.addEventListener("load", () => vImg.classList.remove("roto"));

  function abrir(i) {
    const p = visibles[i];
    if (!p) return;
    actual = i;
    vImg.classList.remove("roto");
    vImg.src = p.imagen;
    vImg.alt = p.nombre;
    $("#visor-cat").textContent = infoCat(p.categoria).label;
    $("#visor-nombre").textContent = String(p.nombre).trim();
    $("#visor-precio").textContent = precioTxt(p.precio);
    $("#visor-desc").textContent = p.resumen || p.descripcion || "";
    visor.classList.add("abierto");
    document.body.classList.add("sin-scroll");
  }
  function cerrar() {
    visor.classList.remove("abierto");
    document.body.classList.remove("sin-scroll");
  }
  const mover = (d) => abrir((actual + d + visibles.length) % visibles.length);

  lista.addEventListener("click", (e) => {
    const it = e.target.closest(".item");
    if (it) abrir(+it.dataset.i);
  });
  lista.addEventListener("keydown", (e) => {
    const it = e.target.closest(".item");
    if (it && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      abrir(+it.dataset.i);
    }
  });
  visor.addEventListener("click", (e) => {
    if (e.target === visor) cerrar();
  });
  $("#visor-cerrar").addEventListener("click", cerrar);
  $("#visor-ant").addEventListener("click", () => mover(-1));
  $("#visor-sig").addEventListener("click", () => mover(1));
  document.addEventListener("keydown", (e) => {
    if (!visor.classList.contains("abierto")) return;
    if (e.key === "Escape") cerrar();
    if (e.key === "ArrowLeft") mover(-1);
    if (e.key === "ArrowRight") mover(1);
  });
  let x0 = null;
  visor.addEventListener(
    "touchstart",
    (e) => {
      x0 = e.touches[0].clientX;
    },
    { passive: true },
  );
  visor.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1);
    x0 = null;
  });

  // ---------- Inicio ----------
  pintarGrupos();
  pintarCategorias();
  pintarLista();
})();
