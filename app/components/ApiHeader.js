const React = require('react');
const RCE = React.createElement;

module.exports = class ApiHeader extends React.Component {
	render() {
		const { icon, title } = this.props;
		return RCE('h2', null,
			icon ? RCE('i', null, icon) : null,
			RCE('span', null, title)
		);
	}
};
