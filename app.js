const flows = {
  local: {
    label: "Local owned route",
    title: "nStore customer selects InCred",
    summary: "nStore owns the InCred relationship. Its Edge Gateway resolves the route locally; Finequs is not in the customer-data path.",
    path: ["nStore platform", "nStore Edge", "InCred"],
    owner: "nStore",
    exchange: "Optional operational metadata only",
    callback: "InCred → nStore Edge → nStore platform",
    commercial: "nStore ↔ InCred; platform fees handled separately"
  },
  finequs: {
    label: "Finequs supplied route",
    title: "nStore customer selects CASHe",
    summary: "The nStore Edge finds no local CASHe route. It submits the canonical envelope to Finequs, which owns and operates the CASHe adapter.",
    path: ["nStore platform", "nStore Edge", "Finequs Exchange", "CASHe adapter", "CASHe"],
    owner: "Finequs",
    exchange: "Finequs validates entitlement, consent, route version and idempotency",
    callback: "CASHe → Finequs → nStore Edge → nStore platform",
    commercial: "Outcome posts to the Exchange ledger using the pinned schedule"
  },
  federated: {
    label: "Federated member route",
    title: "nStore customer selects Axis Bank",
    summary: "Finequs resolves Axis Business Loan to Fynaptic. The transaction is stored and forwarded to the Fynaptic Edge, which owns the Axis adapter and credentials.",
    path: ["nStore platform", "nStore Edge", "Finequs Exchange", "Fynaptic Edge", "Axis Bank"],
    owner: "Fynaptic",
    exchange: "Finequs routes and audits; Fynaptic transforms and submits",
    callback: "Axis → Fynaptic Edge → Finequs → nStore Edge → nStore platform",
    commercial: "Origin, supplier and network shares are versioned and reconcilable"
  }
};

const accessGate = document.getElementById("accessGate");
const accessForm = document.getElementById("accessForm");
const accessPin = document.getElementById("accessPin");
const accessError = document.getElementById("accessError");
const expectedPinHash = "afd679cd3f9a81fd9ce02e6434a24f848937f09909fabcc3b3781e06036e284c";

async function hashPin(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function unlockBlueprint() {
  sessionStorage.setItem("flocamo-blueprint-access", "granted");
  document.body.classList.remove("access-locked");
  accessGate.hidden = true;
}

document.body.classList.add("access-locked");
if (sessionStorage.getItem("flocamo-blueprint-access") === "granted") unlockBlueprint();

accessForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  accessError.textContent = "";
  if (await hashPin(accessPin.value) === expectedPinHash) {
    unlockBlueprint();
    return;
  }
  accessError.textContent = "That PIN is not recognised. Please try again.";
  accessPin.value = "";
  accessPin.focus();
});

const flowPanel = document.getElementById("flowPanel");

function renderFlow(key) {
  const flow = flows[key];
  const path = flow.path.map((step, index) => `
    <div class="path-step">
      <span>${String(index + 1).padStart(2, "0")}</span>
      <b>${step}</b>
    </div>${index < flow.path.length - 1 ? '<i class="path-arrow">→</i>' : ''}
  `).join("");

  flowPanel.innerHTML = `
    <div class="flow-heading"><div><span class="flow-label">${flow.label}</span><h3>${flow.title}</h3></div><p>${flow.summary}</p></div>
    <div class="path">${path}</div>
    <div class="flow-facts">
      <div><small>ROUTE OWNER</small><b>${flow.owner}</b></div>
      <div><small>EXCHANGE ROLE</small><b>${flow.exchange}</b></div>
      <div><small>STATUS RETURN</small><b>${flow.callback}</b></div>
      <div><small>COMMERCIAL RECORD</small><b>${flow.commercial}</b></div>
    </div>`;
}

document.querySelectorAll(".flow-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".flow-tab").forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-selected", "false");
    });
    button.classList.add("active");
    button.setAttribute("aria-selected", "true");
    renderFlow(button.dataset.flow);
  });
});

const routes = {
  "nstore:incred": { type: "Local route", path: "nStore Edge → InCred", note: "Finequs is outside the customer-data path." },
  "nstore:cashe": { type: "Finequs route", path: "nStore Edge → Finequs Exchange → CASHe", note: "Finequs owns the provider adapter." },
  "nstore:axis": { type: "Federated route", path: "nStore Edge → Finequs Exchange → Fynaptic Edge → Axis", note: "Fynaptic owns the provider adapter." },
  "fynaptic:axis": { type: "Local route", path: "Fynaptic Edge → Axis", note: "Finequs is outside the customer-data path." },
  "fynaptic:cashe": { type: "Finequs route", path: "Fynaptic Edge → Finequs Exchange → CASHe", note: "Finequs owns the provider adapter." },
  "fynaptic:incred": { type: "Federated route", path: "Fynaptic Edge → Finequs Exchange → nStore Edge → InCred", note: "nStore owns the provider adapter." }
};

function renderRoute() {
  const key = `${document.getElementById("origin").value}:${document.getElementById("programme").value}`;
  const route = routes[key];
  document.getElementById("routeResult").innerHTML = `<small>${route.type}</small><strong>${route.path}</strong><p>${route.note}</p>`;
}

document.getElementById("origin").addEventListener("change", renderRoute);
document.getElementById("programme").addEventListener("change", renderRoute);
document.getElementById("printButton").addEventListener("click", () => window.print());

window.addEventListener("scroll", () => {
  const height = document.documentElement.scrollHeight - window.innerHeight;
  document.getElementById("progress").style.width = `${height > 0 ? (window.scrollY / height) * 100 : 0}%`;
});

renderFlow("local");
renderRoute();
