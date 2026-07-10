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
      tone: "review",
      label: "For Review",
      title: "Priority Review",
      chips: ["State v Arora", "Dowry Complaint Review", "Cyber Fraud Appeal have strategic upda..."]
    },
    {
      tone: "support",
      label: "Support",
      title: "Fastest Positive Momentum",
      body: "Land Transfer Dispute gained a stronger possession narrative from mutation an...",
      meta: "transfer_of_property_act_1882, specific_reli..."
    },
    {
      tone: "open",
      label: "Open",
      title: "Portfolio Open Question",
      body: "Should cyber-evidence admissibility and matrimonial-risk calibration be revie...",
      meta: "it_act, limitation_act_1963 | Anvar (2014)"
    }
  ],
  today: [
    "State v Arora: 2 strategic items pending review.",
    "Land Transfer Dispute: 3 new propositions extracted.",
    "Cyber Fraud Appeal: brief update queued from evidence analysis."
  ],
  forReview: [
    "3 strategic updates waiting for lawyer decision.",
    "4 low-risk updates auto-applied with undo available.",
    "1 cross-case intent held for confirmation."
  ],
  reviews: [
    {
      title: "Resolve highest-impact review items before opening draft-generation for tomorrow's filing batch.",
      metaStrong: "Case:",
      meta: " Portfolio review - 3 cases pending"
    },
    {
      title: "Validate cross-case context guard so counsel chats never auto-switch between active matters.",
      metaStrong: "Safety review",
      meta: " - cross-case intent policy"
    }
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
      <path d="M4 13.5V7a2 2 0 0 1 2-2h9.5a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2H10l-4 3v-3H6a2 2 0 0 1-2-2Z" />
      <path d="m17 3 1 2 2 .5-1.5 1.4.4 2.1L17 8l-1.9 1 .4-2.1L14 5.5l2-.5 1-2Z" />
    </svg>
  `;
}

function renderSummaryCard(card) {
  const bodyContent = card.chips
    ? `<div class="summary-card__chips">${card.chips.map((chip) => `<span>${chip}</span>`).join("")}</div>`
    : `<p class="summary-card__copy">${card.body}</p><p class="summary-card__meta">${card.meta}</p>`;

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
        ${bodyContent}
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

function renderActivityItem(item) {
  return `
    <div class="activity-row">
      <span class="activity-row__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </span>
      <p>${item}</p>
    </div>
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
  const todayList = document.getElementById("todayList");
  const forReviewList = document.getElementById("forReviewList");

  if (!caseList || !summaryGrid || !reviewList || !todayList || !forReviewList) {
    return;
  }

  caseList.innerHTML = chamberData.cases.map((name) => renderCaseItem(name, name === "State V Arora")).join("");
  summaryGrid.innerHTML = chamberData.summaries.map(renderSummaryCard).join("");
  todayList.innerHTML = chamberData.today.map(renderActivityItem).join("");
  forReviewList.innerHTML = chamberData.forReview.map(renderActivityItem).join("");
  reviewList.innerHTML = chamberData.reviews.map(renderReviewItem).join("");
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
