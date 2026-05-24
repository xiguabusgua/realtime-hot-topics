const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class BaseService {
  constructor(sourceConfig) {
    this.config = sourceConfig;
    this.timeout = sourceConfig.timeout || 10000;
  }

  async fetchRawData() {
    try {
      const response = await axios.get(this.config.url, {
        headers: this.config.headers || {},
        timeout: this.timeout,
        responseType: this.config.type === 'html' ? 'text' : 'json'
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch data from ${this.config.name}`, {
        url: this.config.url,
        error: error.message
      });
      return null;
    }
  }

  parseData(rawData) {
    if (!rawData) return [];

    const parserName = this.config.parser;
    const parser = BaseService.parsers[parserName];

    if (!parser) {
      logger.warn(`No parser found for: ${parserName}`);
      return [];
    }

    try {
      return parser(rawData);
    } catch (error) {
      logger.error(`Parse error for ${this.config.name}`, { error: error.message });
      return [];
    }
  }

  async getTopics() {
    const rawData = await this.fetchRawData();
    const topics = this.parseData(rawData);
    return {
      sourceId: this.config.id,
      sourceName: this.config.name,
      topics,
      updatedAt: new Date().toISOString()
    };
  }
}

BaseService.parsers = {
  ithome(data) {
    if (!data?.Result) return [];
    return data.Result.map((item, index) => ({
      rank: index + 1,
      title: item.title || '',
      url: `https://www.ithome.com/0/${item.newsid || ''}.htm`,
      hotValue: item.commentcount ? `${item.commentcount} 评论` : '',
      excerpt: item.description || item.digest || ''
    })).filter(item => item.title).slice(0, 20);
  },

  '36kr'(data) {
    if (!data?.data?.items) return [];
    return data.data.items.map((item, index) => ({
      rank: index + 1,
      title: item.title || '',
      url: item.news_url || `https://36kr.com/newsflashes/${item.id}`,
      hotValue: '',
      excerpt: item.description || ''
    })).filter(item => item.title).slice(0, 20);
  },

  github(rawHtml) {
    const $ = cheerio.load(rawHtml);
    const topics = [];
    $('article.Box-row').each((index, el) => {
      const repoPath = $(el).find('h2 a').attr('href')?.trim();
      const description = $(el).find('p').text().trim();
      const stars = $(el).find('[href$="stargazers"]').text().trim();
      if (repoPath) {
        topics.push({
          rank: index + 1,
          title: repoPath.replace(/^\//, ''),
          url: `https://github.com${repoPath}`,
          hotValue: `${stars} stars`,
          excerpt: description
        });
      }
    });
    return topics.slice(0, 20);
  },

  wallstreetcn(data) {
    if (!data?.data?.items) return [];
    return data.data.items.map((item, index) => ({
      rank: index + 1,
      title: item.title || item.content_text?.slice(0, 60) || '',
      url: item.uri || '',
      hotValue: '',
      excerpt: item.content_text?.slice(0, 100) || ''
    })).filter(item => item.title).slice(0, 20);
  },

  jin10(data) {
    if (!data?.data) return [];
    return data.data.map((item, index) => ({
      rank: index + 1,
      title: item.data?.content?.replace(/<[^>]+>/g, '')?.slice(0, 80) || '',
      url: item.data?.url || '',
      hotValue: item.data?.pic ? '图文' : '文字',
      excerpt: item.data?.content?.replace(/<[^>]+>/g, '')?.slice(0, 120) || ''
    })).filter(item => item.title).slice(0, 20);
  },

  weibo(data) {
    if (!data?.data?.band_list) return [];
    return data.data.band_list.map((item, index) => ({
      rank: index + 1,
      title: item.word || '',
      url: item.word_scheme || `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word || '')}`,
      hotValue: item.num ? `${(item.num / 10000).toFixed(1)}万` : `热度 ${item.raw_hot || ''}`,
      excerpt: item.category_name || item.label_name || ''
    })).filter(item => item.title).slice(0, 20);
  },

  baidu(rawHtml) {
    const $ = cheerio.load(rawHtml);
    const topics = [];
    const wordMatches = rawHtml.match(/"word"\s*:\s*"([^"]+)"/g) || [];
    const urlMatches = rawHtml.match(/"url"\s*:\s*"([^"]+)"/g) || [];
    const hotMatches = rawHtml.match(/"hotScore"\s*:\s*(\d+)/g) || [];
    const descMatches = rawHtml.match(/"desc"\s*:\s*"([^"]*)"/g) || [];

    const extractValue = (match) => {
      if (!match) return '';
      const m = match.match(/:\s*"?(.+?)"?$/);
      return m ? m[1].replace(/[",}]/g, '') : '';
    };

    for (let i = 0; i < Math.min(wordMatches.length, 30); i++) {
      const word = extractValue(wordMatches[i]);
      const url = extractValue(urlMatches[i]);
      const hotScore = extractValue(hotMatches[i]);
      const desc = extractValue(descMatches[i]);
      if (word && !topics.find(t => t.title === word)) {
        topics.push({
          rank: topics.length + 1,
          title: word,
          url: url || `https://www.baidu.com/s?wd=${encodeURIComponent(word)}`,
          hotValue: hotScore ? `${(parseInt(hotScore) / 10000).toFixed(1)}万` : '',
          excerpt: desc || ''
        });
      }
    }
    return topics.slice(0, 20);
  },

  toutiao(data) {
    if (!data?.data) return [];
    return data.data.map((item, index) => ({
      rank: index + 1,
      title: item.Title || '',
      url: item.Url || '',
      hotValue: item.HotValue ? `${(item.HotValue / 10000).toFixed(1)}万` : '',
      excerpt: item.abstract || ''
    })).filter(item => item.title).slice(0, 20);
  }
};

module.exports = BaseService;
