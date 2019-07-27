const React = require('react');
const RCE = React.createElement;

const WikiEntry = require('./WikiEntry');
const WikiHeader = require('./WikiHeader');

module.exports = class WikiSection extends React.Component {
	renderEntries = (entries, className = '') => (
		entries.map(en => RCE(WikiEntry, { entry: en, className, key: en.id || en.label }))
	);
	render() {
		const { data, title, icon } = this.props;
		return data.length ? [
			RCE(WikiHeader, { icon, title }),
			RCE('ul', null, this.renderEntries(data, title.toLowerCase()))
		] : null;
	}
};
