let snippets = JSON.parse(localStorage.getItem("devstash-snippets") || "[]");
let currentView = "add";

function toggleView() {
  const addView = document.getElementById("addSnippetView");
  const listView = document.getElementById("snippetListView");
  const title = document.getElementById("currentPageTitle");
  const toggleBtn = document.getElementById("toggleViewBtn");

  if (currentView === "add") {
    addView.classList.add("hidden");
    listView.classList.remove("hidden");
    title.textContent = "View Snippets";
    toggleBtn.innerHTML = '<i class="fas fa-plus"></i> Add Snippet';
    currentView = "list";
    displaySnippets();
  } else {
    listView.classList.add("hidden");
    addView.classList.remove("hidden");
    title.textContent = "Add New Snippet";
    toggleBtn.innerHTML = '<i class="fas fa-list"></i> View Snippets';
    currentView = "add";
  }
}

function saveSnippet(event) {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const code = document.getElementById("code").value.trim();
  const problem = document.getElementById("problem").value.trim();

  if (!title || !code) {
    showToast("Please fill in both title and code fields", "error");
    return;
  }

  const snippet = {
    id: Date.now().toString(),
    title: title,
    code: code,
    problem: problem,
    createdAt: new Date().toISOString(),
  };

  snippets.unshift(snippet);
  localStorage.setItem("devstash-snippets", JSON.stringify(snippets));

  document.getElementById("snippetForm").reset();

  showToast("Snippet saved successfully!", "success");

  setTimeout(() => {
    toggleView();
  }, 1000);
}

function displaySnippets(filteredSnippets = null) {
  const container = document.getElementById("snippetList");
  const emptyState = document.getElementById("emptyState");
  const count = document.getElementById("snippetCount");
  const lastUpdated = document.getElementById("lastUpdated");
  const downloadBtn = document.getElementById("downloadBtn");

  const displaySnippets = filteredSnippets || snippets;
  count.textContent = snippets.length;

  if (snippets.length > 0) {
    const latest = new Date(snippets[0].createdAt);
    lastUpdated.textContent =
      latest.toLocaleDateString() + " " + latest.toLocaleTimeString();
    downloadBtn.style.display = "flex";
  } else {
    lastUpdated.textContent = "Never";
    downloadBtn.style.display = "none";
  }

  if (displaySnippets.length === 0) {
    container.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  container.innerHTML = displaySnippets
    .map(
      (snippet) => `
                <div class="snippet-card" data-id="${snippet.id}">
                    <div class="snippet-header">
                        <div>
                            <div class="snippet-title">${escapeHtml(
                              snippet.title
                            )}</div>
                            <div class="snippet-meta">
                                <i class="fas fa-calendar"></i>
                                Created: ${new Date(
                                  snippet.createdAt
                                ).toLocaleDateString()}
                            </div>
                        </div>
                        <div class="snippet-actions">
                            <button class="action-btn" onclick="copySnippet('${
                              snippet.id
                            }')" title="Copy code">
                                <i class="fas fa-copy" id="copy-icon-${
                                  snippet.id
                                }"></i>
                            </button>
                            <button class="action-btn" onclick="deleteSnippet('${
                              snippet.id
                            }')" title="Delete snippet" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1);">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="snippet-code">${escapeHtml(snippet.code)}</div>
                    
                    ${
                      snippet.problem
                        ? `
                        <div class="snippet-problem">
                            <div class="problem-label">
                                <i class="fas fa-lightbulb"></i>
                                Problem Solved:
                            </div>
                            ${escapeHtml(snippet.problem)}
                        </div>
                    `
                        : ""
                    }
                </div>
            `
    )
    .join("");
}

function searchSnippets() {
  const searchTerm = document.getElementById("searchBox").value.toLowerCase();

  if (!searchTerm) {
    displaySnippets();
    return;
  }

  const filtered = snippets.filter(
    (snippet) =>
      snippet.title.toLowerCase().includes(searchTerm) ||
      snippet.code.toLowerCase().includes(searchTerm) ||
      (snippet.problem && snippet.problem.toLowerCase().includes(searchTerm))
  );

  displaySnippets(filtered);
}

function copySnippet(id) {
  const snippet = snippets.find((s) => s.id === id);
  if (!snippet) return;

  navigator.clipboard
    .writeText(snippet.code)
    .then(() => {
      const icon = document.getElementById(`copy-icon-${id}`);
      const btn = icon.parentElement;

      icon.className = "fas fa-check";
      btn.classList.add("success");

      showToast("Code copied to clipboard!", "success");

      setTimeout(() => {
        icon.className = "fas fa-copy";
        btn.classList.remove("success");
      }, 2000);
    })
    .catch(() => {
      showToast("Failed to copy code", "error");
    });
}

function deleteSnippet(id) {
  if (!confirm("Are you sure you want to delete this snippet?")) return;

  snippets = snippets.filter((s) => s.id !== id);
  localStorage.setItem("devstash-snippets", JSON.stringify(snippets));
  displaySnippets();
  showToast("Snippet deleted successfully", "success");
}

function downloadAllSnippets() {
  if (snippets.length === 0) {
    showToast("No snippets to download", "error");
    return;
  }

  const content = snippets
    .map((snippet) => {
      let text = `TITLE: ${snippet.title}\n`;
      text += `CREATED: ${new Date(snippet.createdAt).toLocaleString()}\n`;
      text += `CODE:\n${snippet.code}\n`;
      if (snippet.problem) {
        text += `PROBLEM SOLVED:\n${snippet.problem}\n`;
      }
      text += "\n" + "=".repeat(80) + "\n\n";
      return text;
    })
    .join("");

  const finalContent = `DevStash Code Snippets Export\n`;
  const header = `Exported on: ${new Date().toLocaleString()}\n`;
  const summary = `Total Snippets: ${snippets.length}\n\n`;
  const separator = "=".repeat(80) + "\n\n";

  const blob = new Blob(
    [finalContent + header + summary + separator + content],
    {
      type: "text/plain",
    }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `devstash-snippets-${
    new Date().toISOString().split("T")[0]
  }.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Snippets downloaded successfully!", "success");
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
                <i class="fas fa-${
                  type === "success" ? "check-circle" : "exclamation-circle"
                }"></i>
                ${message}
            `;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById("snippetForm").addEventListener("submit", saveSnippet);

if (currentView === "list") {
  displaySnippets();
}
