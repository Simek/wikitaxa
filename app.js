const express = require('express');
const stringifyObject = require('stringify-object');

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
		return clearObject({
			name: query,
			data: dataString === '{}' ? undefined : data
		});
	}
};

const getData = (res, query) => {
	redis.get(query, (err, result) => {
		if (result) {
			console.log(`🗃️ Cache: '${query}'`);
			res.send(result);
		} else {
			console.log(`🔍 Searching for: '${query}'`);
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
	parseEntries: entries => (Array.isArray(entries) ? entries : [entries]).filter(Boolean),
	switchEntry: url => `document.getElementById('iframe').src = '${url}';document.getElementById('url').innerText = '${url}';`,
	renderEntry: (entries, className = '') => {
		return entries.map(en => (
			`<li class="${className}" onclick="${Editor.switchEntry(en.url)}" title="${en.description}">
				<span>${en.label || 'no label'}</span>
				${en.description ? `<small>${en.description}</small>` : ''}
				${en.id ? `<small>${en.id || ''}</small>` : ''}
			</li>`
		)).join('').replace('\n', '');
	},
	renderPage: (res, data = []) => {
		const json = data[0] ? stringifyObject(data[0], {
			indent: '  '
		}) : '';

		const dataEntries = Editor.parseEntries(data[1]);
		const wikiEntries = Editor.parseEntries(data[2]);
		const speciesEntries = Editor.parseEntries(data[3]);

		const allEntries = dataEntries.concat(wikiEntries).concat(speciesEntries);
		const noResults = !allEntries.length;

		res.send(`
			<html>
				<head>
					<link rel="stylesheet" type="text/css" href="css/main.css" />
				</head>
				<body>
					<div class="data">
						<div class="response-header">📦 APIs Response</div>
						<textarea readonly id="response">${json}</textarea>
					</div>
					<div class="tabs">
						<form action="search" method="get">
							<i>🔍</i><input id="search" type="text" name="q" />
						</form>
						${dataEntries.length ? '<h2><i>🗂️</i>Wikidata</h2>' : ''}
						<ul>${Editor.renderEntry(dataEntries, 'wikidata')}</ul>
						${wikiEntries.length ? '<h2><i>📖</i>Wikipedia</h2>' : ''}
						<ul>${Editor.renderEntry(wikiEntries, 'wikipedia')}</ul>
						${speciesEntries.length ? '<h2><i>🧬</i>Wikispecies</h2>' : ''}
						<ul>${Editor.renderEntry(speciesEntries, 'wikispecies')}</ul>
						${noResults ? '<h4>No results</h4>' : ''}
					</div>
					<div class="browser">
						<div class="url-wrapper">
							<i>🌐</i><span id="url">${!noResults ? allEntries[0].url : ''}</span>
						</div>
						<iframe id="iframe" src="${!noResults ? allEntries[0].url : ''}"></iframe>
					</div>
				</body>
			</html>
		`);
	}
};

app.get('/', (req, res) => res.send({}));

app.use('/editor/css', express.static('css'));
app.get('/editor/search', async (req, res) => {
	const query = (req.query['q'] || "").trim();

	if (query) {
		Promise.all([
			fetchData(null, query, false),
			wikitaxa.getWikidata(query),
			wikitaxa.getWikipedia(query),
			wikitaxa.getWikispecies(query)
		]).then(data => {
			Editor.renderPage(res, data);
		});
	} else {
		Editor.renderPage(res);
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
