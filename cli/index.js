const util = require('util');
const wikitaxa = require('../lib/wikitaxa');

const args = process.argv.slice(2);
const argsQ = args.length === 1 ? args[0] : args.join(' ');

const getData = async q => await wikitaxa.performSearch(q);
const clearObject = obj => JSON.parse(JSON.stringify(obj));

const data = argsQ.indexOf(',') > 0 ? argsQ.split(',').map(getData) : [getData(argsQ)];

Promise.all(data).then(result => {
	if (result) {
		console.log(util.inspect(clearObject(result), false, null, true));
	}
});
