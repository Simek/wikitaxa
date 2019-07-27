const wikitaxa = require('../lib/wikitaxa');

const args = process.argv.slice(2);
const argsQ = args.length === 1 ? args[0] : args.join(" ");

const getData = async q => await wikitaxa.performSearch(q);
const clearObject = obj => JSON.parse(JSON.stringify(obj));

if (argsQ.indexOf(',') > 0) {
	Promise.all(argsQ.split(',').map(getData)).then(result => console.log(clearObject(result)));
} else {
	Promise.resolve(getData(argsQ)).then(result => console.log(clearObject(result)));
}
