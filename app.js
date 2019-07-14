const express = require('express');

const wikitaxa = require('./lib');

const app = express();

const DEV_PORT = 5000;
const port = process.env.PORT;
const isDevelopment = port === null || port === "" || port == DEV_PORT;

let redis;

if (isDevelopment) {
	// simple Redis mock
	redis = {
		get: (q, callback) => callback(),
		set: () => undefined,
		del: () => undefined,
	}
} else {
	const Redis = require('ioredis');
	redis = new Redis(process.env.REDIS_URL);
}

const clearObject = obj => JSON.parse(JSON.stringify(obj));

const fetchData = async (res, query, sendResult = true) => {
	const data = await wikitaxa.performSearch(query);
	const dataString = JSON.stringify(data);
	redis.set(query, dataString);

	if (sendResult) {
		res.send(data);
	} else {
		return {
			name: query,
			data: dataString === '{}' ? undefined : data
		};
	}
};

const getData = (res, query) => {
	redis.get(query, (err, result) => {
		if (result) {
			console.warn(`🗃️ Cache: '${query}'`);
			res.send(result);
		} else {
			console.warn(`🔍 Searching for: '${query}'`);
			return fetchData(res, query);
		}
	});
};

const getDataList = (res, query, sendResult = true) => {
	const list = query.split(',').filter(Boolean);
	const queue = list.map(async q => await fetchData(null, q, false));
	Promise.all(queue).then(results => {
		if (sendResult) {
			res.send({ list, results });
		} else {
			return { list, results };
		}
	});
};

const Editor = {
	switchEntry: url => {
		return (
			`document.getElementById('url').innerText = '${url}'; document.getElementById('iframe').src = '${url}';`
		).replace('\n', '');
	},
	renderEntry: (entries, className = '') => {
		return entries.map(en => (
			`<li class="${className}" onclick="${Editor.switchEntry(en.url)}">
				${en.label}<small>${en.description ? en.description + '</br>' : ''}${en.id || ''}</small>
			</li>`
		)).join('').replace('\n', '');
	}
};

app.get('/', (req, res) => res.send({}));

app.use('/editor/css', express.static('css'));
app.get('/editor/search', async (req, res) => {
	const query = req.query['q'];

	if (!query) {
		res.send(undefined);
	} else {
		Promise.all([
			fetchData(null, query, false),
			wikitaxa.getWikidata(query),
			wikitaxa.getWikipedia(query),
			wikitaxa.getWikispecies(query)
		]).then(data => {
			const json = JSON.stringify(data[0], null, 2);

			const dataEntries = (Array.isArray(data[1]) ? data[1] : [data[1]]).filter(Boolean);
			const wikiEntries = (Array.isArray(data[2]) ? data[2] : [data[2]]).filter(Boolean);
			const speciesEntries = (Array.isArray(data[3]) ? data[3] : [data[3]]).filter(Boolean);

			const allEntries = dataEntries.concat(wikiEntries).concat(speciesEntries);

			if (allEntries.length) {
				res.send(`
					<html>
						<head>
							<link rel="stylesheet" type="text/css" href="css/main.css" />
						</head>
						<body>
							<textarea readonly >${json}</textarea>
							<ul class="tabs">
								<h1>Search</h1>
								<form action="search" method="get">
									<input id="search" type="text" name="q" />
								</form>
								${dataEntries.length ? '<h2 class="wikidata">Wikidata</h2>' : ''}
								${Editor.renderEntry(dataEntries, 'wikidata-entry')}
								${wikiEntries.length ? '<h2 class="wikipedia">Wikipedia</h2>' : ''}
								${Editor.renderEntry(wikiEntries, 'wikipedia-entry')}
								${speciesEntries.length ? '<h2 class="wikispecies">Wikispecies</h2>' : ''}
								${Editor.renderEntry(speciesEntries, 'wikispecies-entry')}
							</ul>
							<div id="url">${allEntries[0].url}</div>
							<iframe id="iframe" src="${allEntries[0].url}" />
						</body>
					</html>
				`);
			} else {
				res.send({});
			}
		});
	}
});

app.get('/api/list', async (req, res) => {
	const keys = await redis.keys('*');
	const data = keys.map(async k => ({
		name: k,
		data: JSON.parse(await redis.get(k, (err, data) => data || '{}'))
	}));
	Promise.all(data).then(results => {
		res.send({ keys, results });
	});
});

app.get('/api/purge/:q', (req, res) => {
	const query = req.params.q;
	redis.del(query);
	res.send({ result: `'${query}' deleted!` });
});

const STATUS_QUERIES = ['Boronia serrulata', 'Echinops', 'Haliaeetus leucocephalus'];

app.get('/api/status', async (req, res) => {
	const queue = STATUS_QUERIES.map(async q => await fetchData(null, q, false));
	Promise.all(queue).then(results => {
		const status = [...new Set(results.map(r => Object.keys(clearObject(r.data))).reduce((prev, curr) => prev.concat(curr)))];
		const { sourcesCount } = wikitaxa;
		res.send({
			ok: status,
			total: status.length,
			sourcesCount,
			percent: `${(status.length * 100 / sourcesCount).toFixed(2)}%`
		});
	});
});

app.get('/api/search/:q', async (req, res) => {
	const query = req.params.q;
	if (!query.includes(".") && !query.includes("/")) {
		if (!query.includes(",")) {
			getData(res, query);
		} else {
			getDataList(res, query);
		}
	} else {
		res.send({});
	}
});

app.listen(isDevelopment ? DEV_PORT : port);
