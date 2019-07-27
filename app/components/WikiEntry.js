const React = require('react');
const RCE = React.createElement;

module.exports = class WikiEntry extends React.Component {
	render() {
		const { className, entry } = this.props;
		return RCE('li', {
			className: `entry-${className}`,
			'data-url': entry.url,
			title: entry.description
		},
			RCE('span', null, `${entry.label || 'no label'}`),
			entry.description ? RCE('small', null, `${entry.description}`) : null,
			entry.id ? RCE('small', null, `${entry.id || ''}`) : null
		);
	}
};
