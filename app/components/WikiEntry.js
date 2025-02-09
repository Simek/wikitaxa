const React = require('react');

const RCE = React.createElement;
const RCTE = (el, text = '') => text ? React.createElement(el, null, text.trim()) : null;

module.exports = class WikiEntry extends React.Component {
	render() {
		const { className, entry } = this.props;
		return RCE('li', {
			className: `entry-${className}`,
			title: entry.description,
			key: `entry-${entry.url}`
		},
			RCE('strong', { 'data-url': entry.url }, entry.label || 'no label'),
			RCTE('small', entry.description),
			className === 'wikidata' ? RCE('ins', { className: 'entry-copy-id' }, entry.id) : null
		);
	}
};
