const React = require('react');

const RCE = React.createElement;
const RCTE = (el, text = '') => text ? React.createElement(el, null, text.trim()) : null;

module.exports = class ApiEntry extends React.Component {
	render() {
		const { entry, source } = this.props;
		return RCE('li', { className: `api-entry api-entry-${source}` },
			RCE('strong', null, entry.name),
			RCTE('small', entry.rank),
			RCTE('small', entry.authorship),
			RCTE('small', entry.status),
			RCE('ins', { className: 'entry-copy-id' }, entry.id)
		);
	}
};
