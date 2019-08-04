const express = require('express');

const Helper = require('./utils/Helper');
const SSR = require('./utils/SSR');

const Editor = require('./components/Editor');

const DEV_PORT = 5000;
const port = process.env.PORT;
const isDevelopment = port === null || port === "" || port == DEV_PORT;

const initRedis = () => {
	if (isDevelopment) {
		// simple Redis mock
		return {
			get: (q, callback) => callback(),
			set: () => undefined,
			del: () => undefined,
			keys: () => [],
		}
	} else {
		const Redis = require('ioredis');
		return new Redis(process.env.REDIS_URL);
	}
};

SSR.convertSCSStoCSS();

const app = express();
const redis = initRedis();
const AppHelper = new Helper(redis);

app.get('/', (req, res) => res.send({}));

//#region Editor
app.use('/editor/js', express.static('app/js'));
app.use('/editor/css', express.static('app/css'));
app.get('/editor/search', async (req, res) => {
	const { q = '', exact = 'false' } = req.query;
	const query = q.trim();
	const isExact = exact === 'true' || exact === 'on';

	if (query) {
		Promise.all([
			AppHelper.fetchData(null, query, false, isExact),
			...AppHelper.getWikiProjectsData(query, isExact)
		]).then(data => {
			SSR.renderPage(res, Editor, { data, query, isExact });
		});
	} else {
		SSR.renderPage(res, Editor);
	}
});
//#endregion

//#region REST API
const STATUS_QUERIES = ['Boronia serrulata', 'Echinops', 'Haliaeetus leucocephalus'];

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

app.get('/api/status', async (req, res) => {
	const queue = STATUS_QUERIES.map(async q => await AppHelper.fetchData(null, q, false));
	Promise.all(queue).then(results => {
		const status = AppHelper.uniqueKeys(results);
		const { sourcesCount } = AppHelper;
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
		if (query.includes(",")) {
			AppHelper.getDataList(res, query);
		} else {
			AppHelper.getData(res, query);
		}
	} else {
		res.send({});
	}
});
//#endregion

app.listen(isDevelopment ? DEV_PORT : port);
