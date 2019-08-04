const React = require('react');
const stringifyObject = require('stringify-object');
const RCE = React.createElement;

const Section = require('./Section');
const ApiHeader = require('./ApiHeader');
const ApiEntry = require('./ApiEntry');
const WikiHeader = require('./WikiHeader');
const WikiEntry = require('./WikiEntry');

module.exports = class Editor extends React.Component {
	static displayName = 'Editor';

	constructor(props) {
		super(props);
		const { data, query, isExact = false } = props;

		const json = data && data[0] ? stringifyObject(data[0], { indent: '  ' }) : '';
		const rawJson = data && data[0] ? data[0].data : undefined;

		const dataEntries = Editor.parseData(data[1]);
		const wikiEntries = Editor.parseData(data[2]);
		const speciesEntries = Editor.parseData(data[3]);

		const allEntries = dataEntries.concat(wikiEntries).concat(speciesEntries);
		const noResults = !allEntries.length;
		const url = noResults ? '' : allEntries[0].url;

		this.state = {
			json,
			rawJson,
			query,
			isExact,
			dataEntries,
			wikiEntries,
			speciesEntries,
			noResults,
			url
		};
	}

	static parseData = entries => (Array.isArray(entries) ? entries : [entries]).filter(Boolean);

	render() {
		const { json, rawJson, query, isExact, dataEntries, wikiEntries, speciesEntries, noResults, url } = this.state;
		return [
			RCE('div', { className: 'data' },
				RCE('form', { action: 'search', method: 'get', className: 'search-form' },
					RCE('i', null, '🔍'),
					RCE('input', { type: 'text', name: 'q', id: 'search', placeholder: query }),
					RCE('input', { type: 'checkbox', name: 'exact', id: 'exact', defaultChecked: isExact, title: 'Only exact matches' })
				),
				RCE('div', { className: 'response-header' },
					RCE('i', null, '📦'),
					RCE('span', null, 'API response')
				),
				RCE('div', { className: 'response-type-select' },
					RCE('div', { className: 'response-type-wrapper' },
						RCE('div', { className: 'response-type active' }, 'List'),
						RCE('div', { className: 'response-type' }, 'JSON')
					)
				),
				RCE('textarea', { readOnly: true, id: 'raw-response', className: 'response', defaultValue: json }),
				RCE('div', { className: 'response', id: 'list-response' },
					rawJson ? rawJson.map(source => RCE(Section, {
						title: source.name,
						key: `response-${source.name}`,
						data: Array.isArray(source.data) ? source.data : [source.data],
						headerComponent: ApiHeader,
						childComponent: ApiEntry
					})) : RCE('h4', null, 'No results')
				)
			),
			RCE('div', { className: 'tabs' },
				RCE(Section, { icon: '🗂️', title: 'Wikidata', data: dataEntries, headerComponent: WikiHeader, childComponent: WikiEntry }),
				RCE(Section, { icon: '📖️', title: 'Wikipedia', data: wikiEntries, headerComponent: WikiHeader, childComponent: WikiEntry }),
				RCE(Section, { icon: '🧬', title: 'Wikispecies', data: speciesEntries, headerComponent: WikiHeader, childComponent: WikiEntry }),
				noResults ? RCE('h4', null, 'No results') : null
			),
			RCE('div', { className: 'browser' },
				RCE('div', { className: 'url-wrapper' },
					RCE('i', null, '🌐'),
					RCE('span', { id: 'url' }, url)
				),
				RCE('iframe', { readOnly: true, src: url, id: 'iframe' }),
				RCE('div', { id: 'iframe-loader' })
			),
			RCE('div', { id: 'temp' })
		];
	}
};
