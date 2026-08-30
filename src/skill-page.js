(function initSkillPage() {
  "use strict";

  const copyButton = document.getElementById("copy-install-prompt");
  const copyLabel = document.getElementById("copy-install-label");
  const status = document.getElementById("skill-action-status");
  const packageUrl = new URL("downloads/lisn-search.zip", window.location.href).href;
  const installPrompt = `Install the complete \`lisn-search\` skill from:
${packageUrl}

Use the correct skills directory for the active coding agent. Keep the extracted top-level folder named \`lisn-search\`. Do not install only \`SKILL.md\`; the skill also requires \`scripts/\` and \`references/\`. The package includes optional \`agents/\` metadata. Validate the installed skill before reporting success. Do not run a live Sales Navigator search, scrape data, or request cookies, account data, or API keys unless I separately ask.`;
  let resetTimer;

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const fallback = document.createElement("textarea");
    fallback.value = value;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.append(fallback);
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    if (!copied) throw new Error("Clipboard copy was rejected");
  }

  function resetCopyState() {
    copyLabel.textContent = "Copy install prompt";
    status.textContent = "";
  }

  copyButton.addEventListener("click", async () => {
    window.clearTimeout(resetTimer);
    try {
      await copyText(installPrompt);
      copyLabel.textContent = "Copied";
      status.textContent = "Install prompt copied.";
    } catch {
      copyLabel.textContent = "Copy failed";
      status.textContent = "Download the ZIP instead.";
    }
    resetTimer = window.setTimeout(resetCopyState, 2200);
  });
})();
