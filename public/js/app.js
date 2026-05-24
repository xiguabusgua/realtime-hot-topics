const API_BASE = '/api';

const CATEGORY_LABELS = {
  tech: '🖥️ 科技热点',
  finance: '💰 金融热点',
  society: '🌍 社会热点'
};

let currentCategory = 'all';
let isLoading = false;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

async function fetchTopics(category) {
  const url = category === 'all'
    ? `${API_BASE}/topics`
    : `${API_BASE}/topics/${category}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const result = await response.json();
  if (result.code !== 0) {
    throw new Error(result.message || 'Unknown error');
  }
  return result.data;
}

function createTopicItem(topic) {
  const rankClass = topic.rank <= 3 ? `top-${topic.rank}` : '';
  const hotHtml = topic.hotValue ? `<span class="topic-hot">${topic.hotValue}</span>` : '';
  const excerptHtml = topic.excerpt ? `<span class="topic-excerpt">${escapeHtml(topic.excerpt)}</span>` : '';

  return `
    <li class="topic-item">
      <span class="topic-rank ${rankClass}">${topic.rank}</span>
      <div class="topic-content">
        <a class="topic-title" href="${escapeHtml(topic.url)}" target="_blank" rel="noopener">${escapeHtml(topic.title)}</a>
        <div class="topic-meta">${hotHtml}</div>
        ${excerptHtml}
      </div>
    </li>
  `;
}

function createSourceCard(source, category) {
  const topicCount = source.topics?.length || 0;
  const topicsHtml = topicCount > 0
    ? source.topics.map(createTopicItem).join('')
    : '<li class="empty-state">暂无数据</li>';

  return `
    <div class="source-card">
      <div class="source-header">
        <span class="source-name">${escapeHtml(source.sourceName)}</span>
        <span class="source-badge">${topicCount} 条</span>
      </div>
      <ul class="topic-list">${topicsHtml}</ul>
    </div>
  `;
}

function renderAllCategories(data) {
  const container = $('#content');
  let html = '';

  const categories = data.categories || {};
  for (const [cat, catData] of Object.entries(categories)) {
    const sources = catData.sources || [];
    if (sources.length === 0) continue;

    html += `
      <section class="category-section">
        <h2 class="category-title ${cat}">${CATEGORY_LABELS[cat] || cat}</h2>
        <div class="source-grid">
          ${sources.map(s => createSourceCard(s, cat)).join('')}
        </div>
      </section>
    `;
  }

  container.innerHTML = html || '<div class="empty-state">暂无数据，请稍后重试</div>';
}

function renderSingleCategory(data) {
  const container = $('#content');
  const sources = data.sources || [];
  const cat = data.category;

  if (sources.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无数据，请稍后重试</div>';
    return;
  }

  const html = `
    <section class="category-section">
      <h2 class="category-title ${cat}">${CATEGORY_LABELS[cat] || cat}</h2>
      <div class="source-grid">
        ${sources.map(s => createSourceCard(s, cat)).join('')}
      </div>
    </section>
  `;

  container.innerHTML = html;
}

function updateTimestamp(isoString) {
  const el = $('#lastUpdate');
  if (!isoString) {
    el.textContent = '';
    return;
  }
  const date = new Date(isoString);
  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  el.textContent = `更新于 ${timeStr}`;
}

function showLoading() {
  $('#loading').style.display = 'block';
  $('#content').style.display = 'none';
  $('#error').style.display = 'none';
}

function showContent() {
  $('#loading').style.display = 'none';
  $('#content').style.display = 'grid';
  $('#error').style.display = 'none';
}

function showError(message) {
  $('#loading').style.display = 'none';
  $('#content').style.display = 'none';
  const errorEl = $('#error');
  errorEl.style.display = 'block';
  errorEl.textContent = `加载失败: ${message}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

async function loadTopics() {
  if (isLoading) return;
  isLoading = true;

  const refreshBtn = $('#refreshBtn');
  refreshBtn.classList.add('spinning');
  showLoading();

  try {
    const data = await fetchTopics(currentCategory);

    if (currentCategory === 'all') {
      renderAllCategories(data);
    } else {
      renderSingleCategory(data);
    }

    updateTimestamp(data.updatedAt);
    showContent();
  } catch (error) {
    showError(error.message);
  } finally {
    isLoading = false;
    refreshBtn.classList.remove('spinning');
  }
}

function initTabs() {
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      loadTopics();
    });
  });
}

function initRefresh() {
  $('#refreshBtn').addEventListener('click', async () => {
    try {
      await fetch(`${API_BASE}/cache/clear`, { method: 'POST' });
    } catch (e) {
      // ignore cache clear failure
    }
    loadTopics();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initRefresh();
  loadTopics();
});
