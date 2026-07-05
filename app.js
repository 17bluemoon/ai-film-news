let currentTab = 'today';
let newsData = [];
let isLoading = false;

const STORAGE_KEY_LIKES = 'ai-film-news-likes';
const STORAGE_KEY_FAVORITES = 'ai-film-news-favorites';

function getLikes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_LIKES) || '{}');
  } catch (e) {
    return {};
  }
}

function saveLikes(likes) {
  localStorage.setItem(STORAGE_KEY_LIKES, JSON.stringify(likes));
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_FAVORITES) || '[]');
  } catch (e) {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
}

function isLiked(id) {
  const likes = getLikes();
  return likes[id] === true;
}

function toggleLike(id) {
  const likes = getLikes();
  likes[id] = !likes[id];
  saveLikes(likes);
  
  const news = newsData.find(n => n.id === id);
  if (news) {
    news.liked = likes[id];
    if (likes[id]) {
      news.likes = (news.likes || 0) + 1;
    } else {
      news.likes = Math.max(0, (news.likes || 0) - 1);
    }
  }
  
  renderNewsList();
  showToast(likes[id] ? '已点赞' : '已取消点赞', 'success');
}

function isFavorited(id) {
  const favorites = getFavorites();
  return favorites.includes(id);
}

function toggleFavorite(id) {
  let favorites = getFavorites();
  const index = favorites.indexOf(id);
  
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(id);
  }
  
  saveFavorites(favorites);
  
  const news = newsData.find(n => n.id === id);
  if (news) {
    news.favorited = index === -1;
  }
  
  renderNewsList();
  updateBadges();
  showToast(index === -1 ? '已收藏' : '已取消收藏', 'success');
}

async function loadNewsData() {
  try {
    const response = await fetch('data/news.json?t=' + Date.now());
    const data = await response.json();
    return data.news || [];
  } catch (error) {
    console.error('加载新闻失败:', error);
    return [];
  }
}

function mergeWithLocalData(newsList) {
  const likes = getLikes();
  const favorites = getFavorites();
  
  return newsList.map(news => ({
    ...news,
    liked: likes[news.id] === true,
    favorited: favorites.includes(news.id),
    likes: news.likes || Math.floor(Math.random() * 50) + 10
  }));
}

async function fetchNews() {
  try {
    const rawNews = await loadNewsData();
    newsData = mergeWithLocalData(rawNews);
    return newsData;
  } catch (error) {
    console.error('获取新闻失败:', error);
    showToast('获取新闻失败', 'error');
    return [];
  }
}

function getLastUpdate() {
  try {
    const data = require('./data/news.json');
    return data.lastUpdated;
  } catch (e) {
    return null;
  }
}

function updateLastUpdate(timestamp) {
  const el = document.getElementById('lastUpdate');
  if (!timestamp) {
    el.textContent = '暂无更新';
    return;
  }
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) {
    el.textContent = '刚刚更新';
  } else if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    el.textContent = `${mins} 分钟前更新`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    el.textContent = `${hours} 小时前更新`;
  } else {
    el.textContent = date.toLocaleDateString('zh-CN');
  }
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins}分钟前`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
}

function renderNewsList() {
  const listEl = document.getElementById('newsList');
  const emptyEl = document.getElementById('emptyState');
  const emptyText = document.getElementById('emptyText');
  
  let displayNews = [];
  
  if (currentTab === 'today') {
    displayNews = newsData;
  } else {
    displayNews = newsData.filter(n => n.favorited);
  }
  
  if (displayNews.length === 0 && !isLoading) {
    listEl.style.display = 'none';
    emptyEl.style.display = 'flex';
    emptyText.textContent = currentTab === 'today' ? '暂无今日新闻' : '还没有收藏任何内容';
    return;
  }
  
  listEl.style.display = 'flex';
  emptyEl.style.display = 'none';
  
  listEl.innerHTML = displayNews.map((news, index) => `
    <article class="news-card" style="animation-delay: ${index * 0.05}s">
      <span class="news-category ${news.category}">${news.category || '资讯'}</span>
      <h2 class="news-title">${escapeHtml(news.title)}</h2>
      <p class="news-summary">${escapeHtml(news.summary)}</p>
      <div class="news-meta">
        <div class="news-source">
          <span class="news-source-icon">📰</span>
          <span>${escapeHtml(news.source || '未知来源')}</span>
          <span class="news-time">· ${formatTime(news.publishedAt)}</span>
        </div>
        <div class="news-actions">
          <button class="action-btn like-btn ${news.liked ? 'active' : ''}" onclick="toggleLike('${news.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>${news.likes || 0}</span>
          </button>
          <button class="action-btn favorite-btn ${news.favorited ? 'active' : ''}" onclick="toggleFavorite('${news.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span>收藏</span>
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

function updateBadges() {
  const todayCount = document.getElementById('todayCount');
  const favCount = document.getElementById('favCount');
  
  todayCount.textContent = newsData.length;
  favCount.textContent = newsData.filter(n => n.favorited).length;
}

function switchTab(tab) {
  currentTab = tab;
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  renderNewsList();
}

async function refreshNews() {
  if (isLoading) return;
  
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('spinning');
  isLoading = true;
  
  renderNewsList();
  
  try {
    await fetchNews();
    renderNewsList();
    updateBadges();
    
    const lastUpdated = newsData.length > 0 ? newsData[0].publishedAt : null;
    updateLastUpdate(lastUpdated);
    
    showToast('刷新成功', 'success');
  } catch (error) {
    console.error('刷新失败:', error);
    showToast('刷新失败', 'error');
  } finally {
    btn.classList.remove('spinning');
    isLoading = false;
  }
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function init() {
  isLoading = true;
  renderNewsList();
  
  await fetchNews();
  renderNewsList();
  updateBadges();
  
  if (newsData.length > 0) {
    updateLastUpdate(newsData[0].publishedAt);
  }
  
  isLoading = false;
}

document.addEventListener('DOMContentLoaded', init);
