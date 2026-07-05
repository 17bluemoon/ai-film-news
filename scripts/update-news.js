const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const newsDataPath = path.join(__dirname, '..', 'data', 'news.json');
const projectRoot = path.join(__dirname, '..');

function loadFavorites() {
  try {
    const data = JSON.parse(fs.readFileSync(newsDataPath, 'utf-8'));
    return data.news.filter(item => item.favorite);
  } catch (e) {
    return [];
  }
}

function updateNews(newsItems) {
  const favorites = loadFavorites();
  const favoriteIds = new Set(favorites.map(f => f.id));
  const merged = [...newsItems];
  
  for (const fav of favorites) {
    if (!favoriteIds.has(fav.id) || !merged.find(m => m.id === fav.id)) {
      merged.push(fav);
    }
  }
  
  const data = {
    lastUpdated: new Date().toISOString(),
    news: merged
  };
  
  fs.writeFileSync(newsDataPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Updated news.json with ${newsItems.length} new items, ${favorites.length} favorites preserved`);
  return data;
}

function gitPush() {
  try {
    const dateStr = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    execSync('git add -A', { cwd: projectRoot, stdio: 'pipe' });
    execSync(`git commit -m "每日新闻更新 - ${dateStr}"`, { cwd: projectRoot, stdio: 'pipe' });
    execSync('git push origin main', { cwd: projectRoot, stdio: 'pipe' });
    console.log('Pushed to GitHub successfully!');
    return true;
  } catch (e) {
    console.error('Git push failed:', e.message);
    return false;
  }
}

if (require.main === module) {
  const sampleNews = [
    {
      id: `news-${Date.now()}-1`,
      title: 'AI影视新闻更新',
      summary: '请使用 TRAE 定时任务配合 WebSearch 获取真实新闻',
      source: 'System',
      category: '系统',
      url: '#',
      publishedAt: new Date().toISOString(),
      likes: 0,
      liked: false,
      favorite: false
    }
  ];
  updateNews(sampleNews);
}

module.exports = { updateNews, gitPush, loadFavorites };
