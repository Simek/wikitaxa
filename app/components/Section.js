const React = require('react');
const RCE = React.createElement;

module.exports = class Section extends React.Component {
	renderEntries = (entries, className = '') => {
		const { title, childComponent } = this.props;
		return entries.map(en => RCE(childComponent, {
			entry: en,
			source: title,
			className,
			key: en.id || en.label || en.name
		}))
	};
	render() {
		const { data, title, icon, headerComponent } = this.props;
		return data.length ? [
			RCE(headerComponent, { icon, title }),
			RCE('ul', null, this.renderEntries(data, title.toLowerCase()))
		] : null;
	}
};
