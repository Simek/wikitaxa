const { sourcesCount, performSearch, getWikidata, getWikipedia, getWikispecies } = require('../../lib/wikitaxa');

const Helper = class {
	constructor(redis) {
		this.redis = redis;
		this.sourcesCount = sourcesCount;
	}
	clearObject = obj => JSON.parse(JSON.stringify(obj));
	uniqueKeys = results => [...new Set(results.map(r => r.data.map(r2 => r2.name)).reduce((prev, curr) => prev.concat(curr)))].filter(Boolean);
	getWikiProjectsData = (query, exact = false) => [
		getWikidata(query, exact),
		getWikipedia(query, exact),
		getWikispecies(query, exact)
	];
	fetchData = async (res, query, sendResult = true, exact = false) => {
		const data = await performSearch(query, true, exact);
		const dataString = JSON.stringify(data);
		this.redis.set(query, dataString);

		if (sendResult) {
			res.send(data);
		} else {
			return this.clearObject(data);
		}
	};
	getData = (res, query, exact) => {
		this.redis.get(query, (err, result) => {
			if (result) {
				console.log(`🗃️ Cache: '${query}'`);
				res.send(result);
			} else {
				console.log(`🔍 Searching for: '${query}'`);
				return this.fetchData(res, query, true, exact);
			}
		});
	};
	getDataList = (res, query, sendResult = true, exact = false) => {
		const list = query.split(',').filter(Boolean);
		const queue = list.map(async q => await this.fetchData(null, q, false, exact));
		Promise.all(queue).then(results => {
			if (sendResult) {
				res.send({ list, results });
			} else {
				return { list, results };
			}
		});
	}
};

module.exports = Helper;
