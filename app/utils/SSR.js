const sass = require('sass');
const fs = require('fs');

const React = require('react');
const ReactDOMServer = require('react-dom/server');

const SCSSPATH = 'app/styles/main.scss';
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
		await sass.render({
			file: SCSSPATH,
			outFile: CSSPATH,
			indentWidth: 0
		}, (error, result) => {
			if (!error){
				fs.writeFile(CSSPATH, result.css.toString().replace(/\n/g, ''), err => {
					if (err){
						console.error('Cannot save SCSS file!', err);
						process.exit(1);
					}
				});
			} else {
				console.error('Cannot compile SCSS file!', error);
				process.exit(1);
			}
		});
	}
};
