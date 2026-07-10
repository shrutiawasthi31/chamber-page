const chamberData = {
  cases: [
    "State V Arora",
    "State V Mehta",
    "Dowry Complaint Review",
    "Land Transfer Dispute",
    "Cyber Fraud Appeal",
    "Cheque Bounce Appeal",
    "PMLA Attachment Challenge",
    "Commercial Arbitration Petition",
    "RERA Delay Compensation"
  ],
  summaries: [
    {
      tone: "risk",
      label: "Risk",
      title: "Composer Caution",
      body: "Role-attribution language conflicts between FIR para 7 and supplementary statement.",
      meta: "dowry_prohibition_act_1961, domestic_violenc..."
    },
    {
      tone: "support",
      label: "Support",
      title: "Agent Memory Extraction",
      body: "Demand chronology remains internally consistent across complaint, witness exc...",
      meta: "dowry_prohibition_act_1961, domestic_violenc..."
    },
    {
      tone: "open",
      label: "Open",
      title: "Prompt Framing Question",
      body: "Should entrustment language for section 406 be narrowed to avoid over-breadth...",
      meta: "dowry_prohibition_act_1961, domestic_violenc..."
    }
  ],
  reviews: [
    {
      title: "Review high-impact prompt output before memory write-back.",
      metaStrong: "Case:",
      meta: " State v Arora | Domain: Dowry and domestic violence prosecution"
    },
    {
      title: "Confirm cross-case intent was resolved without context switching.",
      metaStrong: "Primary source trees:",
      meta: " dowry_prohibition_act_1961, domestic_violence_act_2005"
    },
    {
      title: "Prepare a constrained branch for bail opposition using only approved factual nodes.",
      metaStrong: "",
      meta: "Next action seeded by agent from dowry_prohibition_act_1961"
    }
  ],
  inputModes: [
    "Text, image, PDF, voice note, multi-record upload.",
    'User can explicitly ask: "save this in Digest/Ratio/Notes".',
    "Default behavior remains agent-driven classification."
  ],
  outputStatus: [
    { label: "Low-risk auto-applied", tone: "success" },
    { label: "Strategic updates reviewed", tone: "warning" }
  ],
  bottomOutput: [
    { label: "Applicable Laws", tone: "success" },
    { label: "Judgment Set", tone: "success" },
    { label: "Precedent Impact", tone: "success" },
    { label: "Draft-ready points", tone: "warning" }
  ]
};

function getStoredActiveUser() {
  const storedUser = window.localStorage.getItem("lexreasonChamberUser");
  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser && typeof parsedUser === "object") {
      return {
        name: parsedUser.name || parsedUser.email || "LexReason User",
        role: parsedUser.role || window.localStorage.getItem("lexreasonSelectedRole") || "Independent Litigator"
      };
    }
  } catch (error) {
    return {
      name: storedUser,
      role: window.localStorage.getItem("lexreasonSelectedRole") || "Independent Litigator"
    };
  }

  return null;
}

function getInitials(name) {
  const words = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "LR";
  }

  if (words.length === 1 && words[0].includes("@")) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function hydrateProfileCard() {
  const activeUser = getStoredActiveUser();
  if (!activeUser) {
    return;
  }

  const nameNode = document.querySelector("[data-profile-name]");
  const roleNode = document.querySelector("[data-profile-role]");
  const avatarNode = document.querySelector("[data-profile-avatar]");

  if (nameNode) {
    nameNode.textContent = activeUser.name;
  }

  if (roleNode) {
    roleNode.textContent = activeUser.role;
  }

  if (avatarNode) {
    avatarNode.textContent = getInitials(activeUser.name);
  }
}

function renderCaseItem(name, selected = false) {
  return `
    <a class="case-item${selected ? " case-item--selected" : ""}" href="#" ${selected ? 'aria-current="page"' : ""}>
      <span class="case-item__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6H9l1.5 2H19.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
        </svg>
      </span>
      <span class="case-item__label">${name}</span>
    </a>
  `;
}

function renderSummaryIcon(tone) {
  if (tone === "support") {
    return `
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M8 11.5 5.5 9A2.12 2.12 0 0 0 2 10.5 2.12 2.12 0 0 0 4 12.6L8 16l4.4-4.3a2.35 2.35 0 0 1 3.2-.1l.4.4a2.36 2.36 0 0 0 3.2 0L22 9.2" />
      </svg>
    `;
  }

  if (tone === "open") {
    return `
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M9.1 9a3 3 0 1 1 5.8 1c-.5 1.4-2.4 2-2.9 3.6M12 17h.01" />
        <path d="M12 22s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11z" />
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M12 3 2 21h20L12 3zm0 6v5m0 4h.01" />
    </svg>
  `;
}

function renderSummaryCard(card) {
  return `
    <article class="summary-card">
      <div class="summary-card__header">
        <div class="summary-card__icon summary-card__icon--${card.tone}" aria-hidden="true">
          ${renderSummaryIcon(card.tone)}
        </div>
        <div class="summary-card__title-group">
          <p class="summary-card__eyebrow">${card.label}</p>
          <h2>${card.title}</h2>
        </div>
      </div>
      <div class="summary-card__body">
        <p class="summary-card__copy">${card.body}</p>
        <p class="summary-card__meta">${card.meta}</p>
        <a href="#" class="summary-card__more">
          <span>More</span>
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </a>
      </div>
    </article>
  `;
}

function renderReviewItem(item) {
  return `
    <article class="review-row">
      <div class="review-row__content">
        <p class="review-row__title">${item.title}</p>
        <p class="review-row__meta">${item.metaStrong ? `<strong>${item.metaStrong}</strong>` : ""}${item.meta}</p>
      </div>
      <button class="review-row__button" type="button">Review</button>
    </article>
  `;
}

function renderInputMode(mode) {
  return `
    <div class="input-mode-row">
      <span class="input-mode-row__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </span>
      <p>${mode}</p>
    </div>
  `;
}

function renderStatusPill(item) {
  return `<span class="status-pill status-pill--${item.tone}">${item.label}</span>`;
}

function setupProfileMenu() {
  const toggle = document.querySelector("[data-profile-toggle]");
  const menu = document.querySelector("[data-profile-actions]");

  if (!toggle || !menu) {
    return;
  }

  const setExpanded = (expanded) => {
    toggle.setAttribute("aria-expanded", String(expanded));
    menu.hidden = !expanded;
  };

  toggle.addEventListener("click", () => {
    setExpanded(menu.hidden);
  });

  toggle.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setExpanded(menu.hidden);
    }
  });

  document.addEventListener("click", (event) => {
    if (!menu.hidden && !toggle.contains(event.target) && !menu.contains(event.target)) {
      setExpanded(false);
    }
  });
}

function setupSidebarControls() {
  const sidebar = document.querySelector("[data-sidebar]");
  const overlay = document.querySelector("[data-sidebar-overlay]");
  const toggle = document.getElementById("sidebarToggle");
  const collapseToggle = document.getElementById("caseListToggle");
  const caseList = document.getElementById("case-list");

  if (!sidebar || !overlay || !toggle || !collapseToggle || !caseList) {
    return;
  }

  const closeSidebar = () => {
    sidebar.classList.remove("is-open");
    overlay.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const willOpen = !sidebar.classList.contains("is-open");
    sidebar.classList.toggle("is-open", willOpen);
    overlay.hidden = !willOpen;
    toggle.setAttribute("aria-expanded", String(willOpen));
  });

  overlay.addEventListener("click", closeSidebar);

  collapseToggle.addEventListener("click", () => {
    const isExpanded = collapseToggle.getAttribute("aria-expanded") !== "false";
    collapseToggle.setAttribute("aria-expanded", String(!isExpanded));
    caseList.hidden = isExpanded;
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) {
      closeSidebar();
    }
  });
}

function setupCaseSearch() {
  const searchInput = document.getElementById("caseSearch");
  const caseList = document.getElementById("case-list");

  if (!searchInput || !caseList) {
    return;
  }

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    const filteredCases = chamberData.cases.filter((name) => name.toLowerCase().includes(query));
    caseList.innerHTML = filteredCases
      .map((name) => renderCaseItem(name, name === "State V Arora"))
      .join("");
  });
}

function renderChamberPage() {
  const caseList = document.getElementById("case-list");
  const summaryGrid = document.getElementById("summaryGrid");
  const reviewList = document.getElementById("reviewList");
  const inputModesList = document.getElementById("inputModesList");
  const outputStatusPills = document.getElementById("outputStatusPills");
  const bottomOutputPills = document.getElementById("bottomOutputPills");

  if (!caseList || !summaryGrid || !reviewList || !inputModesList || !outputStatusPills || !bottomOutputPills) {
    return;
  }

  caseList.innerHTML = chamberData.cases.map((name) => renderCaseItem(name, name === "State V Arora")).join("");
  summaryGrid.innerHTML = chamberData.summaries.map(renderSummaryCard).join("");
  reviewList.innerHTML = chamberData.reviews.map(renderReviewItem).join("");
  inputModesList.innerHTML = chamberData.inputModes.map(renderInputMode).join("");
  outputStatusPills.innerHTML = chamberData.outputStatus.map(renderStatusPill).join("");
  bottomOutputPills.innerHTML = chamberData.bottomOutput.map(renderStatusPill).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.classList.contains("chamber-body")) {
    return;
  }

  renderChamberPage();
  hydrateProfileCard();
  setupProfileMenu();
  setupSidebarControls();
  setupCaseSearch();
});
