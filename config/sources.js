const SOURCES = {
  tech: [
    {
      id: 'ithome-hot',
      name: 'IT之家',
      type: 'api',
      url: 'https://m.ithome.com/api/news/newslistpageget?type=0&page=1',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      parser: 'ithome'
    },
    {
      id: '36kr-hot',
      name: '36氪热榜',
      type: 'api',
      url: 'https://36kr.com/api/newsflash',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      parser: '36kr'
    },
    {
      id: 'github-trending',
      name: 'GitHub Trending',
      type: 'html',
      url: 'https://github.com/trending',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html'
      },
      timeout: 20000,
      parser: 'github'
    }
  ],
  finance: [
    {
      id: 'wallstreetcn',
      name: '华尔街见闻',
      type: 'api',
      url: 'https://api-one.wallstcn.com/apiv1/content/lives?channel=global-channel&limit=20',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      parser: 'wallstreetcn'
    },
    {
      id: 'jin10',
      name: '金十数据',
      type: 'api',
      url: 'https://flash-api.jin10.com/get_flash_list',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'x-app-id': 'bVBF4FyRTn5NJF5n',
        'x-version': '1.0.0'
      },
      parser: 'jin10'
    }
  ],
  society: [
    {
      id: 'weibo-hot',
      name: '微博热搜',
      type: 'api',
      url: 'https://weibo.com/ajax/statuses/hot_band',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://weibo.com/'
      },
      parser: 'weibo'
    },
    {
      id: 'baidu-hot',
      name: '百度热搜',
      type: 'html',
      url: 'https://top.baidu.com/board?tab=realtime',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      parser: 'baidu'
    },
    {
      id: 'toutiao-hot',
      name: '头条热榜',
      type: 'api',
      url: 'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      parser: 'toutiao'
    }
  ]
};

const CACHE_TTL = 5 * 60 * 1000;

const SERVER_CONFIG = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost'
};

module.exports = { SOURCES, CACHE_TTL, SERVER_CONFIG };
