// Note Graph Visualization
// Builds an interactive graph showing connections between notes

(function() {
  'use strict';

  // Only run on note pages
  if (!document.querySelector('.note')) return;

  // Get current page info
  const currentUrl = window.location.pathname;
  const currentTitle = document.querySelector('.note-title')?.textContent || 'Current Note';

  // Build graph data from all links on the page
  function buildGraphData() {
    const nodes = new Map();
    const links = [];

    // Add current page as central node
    nodes.set(currentUrl, {
      id: currentUrl,
      title: currentTitle,
      isCurrent: true
    });

    // Find all internal note links
    const noteLinks = document.querySelectorAll('.note-content a[href^="/notes/"]');

    noteLinks.forEach(link => {
      const targetUrl = link.getAttribute('href');
      const targetTitle = link.textContent;

      // Add target node if not exists
      if (!nodes.has(targetUrl)) {
        nodes.set(targetUrl, {
          id: targetUrl,
          title: targetTitle,
          isCurrent: false
        });
      }

      // Add link
      links.push({
        source: currentUrl,
        target: targetUrl
      });
    });

    return {
      nodes: Array.from(nodes.values()),
      links: links
    };
  }

  // Create graph container
  function createGraphContainer() {
    const container = document.createElement('div');
    container.id = 'note-graph-container';
    container.innerHTML = `
      <div id="note-graph-header">
        <h3>Connected Notes</h3>
        <button id="toggle-graph" aria-label="Toggle graph">▼</button>
      </div>
      <div id="note-graph" style="display: none;"></div>
    `;

    // Insert after note content
    const article = document.querySelector('.note');
    if (article) {
      article.appendChild(container);
    }

    // Add toggle functionality
    const toggleBtn = document.getElementById('toggle-graph');
    const graphDiv = document.getElementById('note-graph');

    toggleBtn.addEventListener('click', () => {
      if (graphDiv.style.display === 'none') {
        graphDiv.style.display = 'block';
        toggleBtn.textContent = '▲';
        if (!graphDiv.hasChildNodes()) {
          renderGraph();
        }
      } else {
        graphDiv.style.display = 'none';
        toggleBtn.textContent = '▼';
      }
    });
  }

  // Simple text-based graph (no D3.js dependency)
  function renderGraph() {
    const data = buildGraphData();
    const graphDiv = document.getElementById('note-graph');

    if (data.nodes.length <= 1) {
      graphDiv.innerHTML = '<p style="padding: 1em; color: #666;">No connected notes found.</p>';
      return;
    }

    // Create simple list of connected notes
    const connectedNotes = data.nodes.filter(n => !n.isCurrent);

    let html = '<div class="graph-list"><ul>';
    connectedNotes.forEach(node => {
      html += `<li><a href="${node.id}">${node.title}</a></li>`;
    });
    html += '</ul></div>';

    graphDiv.innerHTML = html;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createGraphContainer);
  } else {
    createGraphContainer();
  }

})();
