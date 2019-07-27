const wikitaxa = require('../../lib/wikitaxa');

const Helper = class {
	constructor(redis) {
		this.redis = redis;
		this.sourcesCount = wikitaxa.sourcesCount;
	}
	clearObject = obj => JSON.parse(JSON.stringify(obj));
	uniqueKeys = results => [...new Set(results.map(r => Object.keys(this.clearObject(r.data))).reduce((prev, curr) => prev.concat(curr)))];
	getWikiProjectsData = query => [
		wikitaxa.getWikidata(query),
		wikitaxa.getWikipedia(query),
		wikitaxa.getWikispecies(query)
	];
	fetchData = async (res, query, sendResult = true) => {
		const data = await wikitaxa.performSearch(query);
		const dataString = JSON.stringify(data);
		this.redis.set(query, dataString);

		if (sendResult) {
			res.send(data);
		} else {
			return this.clearObject({
				name: query,
				data: dataString === '{}' ? undefined : data
			});
		}
	};
	getData = (res, query) => {
		this.redis.get(query, (err, result) => {
			if (result) {
				console.log(`🗃️ Cache: '${query}'`);
				res.send(result);
			} else {
				console.log(`🔍 Searching for: '${query}'`);
				return this.fetchData(res, query);
			}
		});
	};
	getDataList = (res, query, sendResult = true) => {
		const list = query.split(',').filter(Boolean);
		const queue = list.map(async q => await this.fetchData(null, q, false));
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
