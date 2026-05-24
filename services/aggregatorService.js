const BaseService = require('./baseService');
const CacheManager = require('../utils/cache');
const logger = require('../utils/logger');
const { SOURCES, CACHE_TTL } = require('../config/sources');

class AggregatorService {
  constructor() {
    this.cache = new CacheManager(CACHE_TTL);
    this.services = this._initServices();
  }

  _initServices() {
    const serviceMap = {};
    for (const [category, sources] of Object.entries(SOURCES)) {
      serviceMap[category] = sources.map(source => new BaseService(source));
    }
    return serviceMap;
  }

  async getCategoryTopics(category) {
    const cacheKey = `category:${category}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for category: ${category}`);
      return cached;
    }

    const services = this.services[category];
    if (!services || services.length === 0) {
      return { category, sources: [], updatedAt: new Date().toISOString() };
    }

    const results = await Promise.allSettled(
      services.map(service => service.getTopics())
    );

    const sources = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const response = {
      category,
      sources,
      updatedAt: new Date().toISOString()
    };

    this.cache.set(cacheKey, response);
    return response;
  }

  async getAllTopics() {
    const cacheKey = 'all-topics';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit for all topics');
      return cached;
    }

    const categories = Object.keys(this.services);
    const results = await Promise.allSettled(
      categories.map(cat => this.getCategoryTopics(cat))
    );

    const categoryData = {};
    results.forEach((result, index) => {
      const cat = categories[index];
      if (result.status === 'fulfilled') {
        categoryData[cat] = result.value;
      } else {
        categoryData[cat] = { category: cat, sources: [], updatedAt: new Date().toISOString() };
      }
    });

    const response = {
      categories: categoryData,
      updatedAt: new Date().toISOString()
    };

    this.cache.set(cacheKey, response);
    return response;
  }

  getCategories() {
    return Object.keys(this.services).map(cat => ({
      id: cat,
      name: AggregatorService.CATEGORY_NAMES[cat] || cat,
      sourceCount: this.services[cat].length
    }));
  }

  clearCache() {
    this.cache.clear();
    logger.info('Cache cleared');
  }
}

AggregatorService.CATEGORY_NAMES = {
  tech: '科技',
  finance: '金融',
  society: '社会'
};

module.exports = new AggregatorService();
