const React = require('react');

const RCE = React.createElement;
const RCTE = (el, text) => text ? React.createElement(el, null, text) : null;

module.exports = class WikiEntry extends React.Component {
	render() {
		const { className, entry } = this.props;
		return RCE('li', {
			className: `entry-${className}`,
			'data-url': entry.url,
			title: entry.description
		},
			RCE('span', null, `${entry.label || 'no label'}`),
			RCTE('small', `${entry.description}`),
			RCTE('small', `${entry.id || ''}`)
		);
	}
};
