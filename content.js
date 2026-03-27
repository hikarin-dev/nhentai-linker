let observer;

function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .sdh-icon {
      width: 0.8em;
      height: 0.8em;
      display: block;
      cursor: pointer;
      border: 1px solid #838383;
      border-radius: 1.5px;
      box-sizing: border-box;
    }
  `;
  document.head.appendChild(style);
}

function highlightSixDigitCodes(root = document.body) {
  if (!root) return;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    nodes.push(node);
  }

  for (const node of nodes) {
    try {
      if (!node.parentNode || node.parentNode.closest("[data-highlighted]")) continue;

      if (node.parentNode.closest("a")) continue;

      const text = node.nodeValue;
      const regex = /(?<!\d)(\d{6})(?!\d)/g;
      let match;
      let lastIndex = 0;
      const frag = document.createDocumentFragment();
      let found = false;

      while ((match = regex.exec(text)) !== null) {
        found = true;
        if (match.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }

        const wrapper = document.createElement("span");
        wrapper.dataset.highlighted = "true";
        wrapper.style.cssText = `
          display: inline-flex;
          align-items: baseline;
          gap: 3px;
          vertical-align: baseline;
        `;

        const a = document.createElement("a");
        a.href = `https://nhentai.net/g/${match[0]}/`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.title = `Open ${match[0]}`;
        a.style.cssText = `
          display: inline-flex;
          align-items: center;
          transform: translateY(0.05em);
        `;

        const img = document.createElement("img");
        img.src = chrome.runtime.getURL("favicon.ico");
        img.className = "sdh-icon";
        img.alt = "";

        a.appendChild(img);

        const span = document.createElement("span");
        span.textContent = match[0];

        wrapper.appendChild(a);
        wrapper.appendChild(span);
        frag.appendChild(wrapper);

        lastIndex = regex.lastIndex;
      }

      if (found && lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      if (found) {
        node.parentNode.replaceChild(frag, node);
      }
    } catch (e) {
      console.warn("Error processing node:", node, e);
    }
  }
}

function init() {
  injectStyles();
  highlightSixDigitCodes();

  observer = new MutationObserver((mutations) => {
    observer.disconnect();

    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          highlightSixDigitCodes(node);
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}