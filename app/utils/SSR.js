const fs = require('node:fs');
const sass = require('sass');

const React = require('react');
const ReactDOMServer = require('react-dom/server');

const CSSPATH = 'app/css/main.css';

module.exports = {
	renderPage: (res, component, props = { data: []}) => {
		res.send(
			`<html>
				<head>
					<title>WikiTaxa :: ${component.displayName}</title>
					<link rel="stylesheet" type="text/css" href="css/main.css" />
					<script type="text/javascript" src="js/client.js"></script>
				</head>
				<body id="app">
					${ReactDOMServer.renderToStaticMarkup(React.createElement(component, { ...props }))}
				</body>
			</html>`
		);
	},
	convertSCSStoCSS: async () => {
		const compressed = sass.compile("app/styles/main.scss", {style: "compressed"})
				fs.writeFile(CSSPATH, compressed.css, err => {
					if (err){
						console.error('Cannot save SCSS file!', err);
						process.exit(1);
					}
				});
	}
};
