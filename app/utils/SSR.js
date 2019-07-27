const React = require('react');
const ReactDOMServer = require('react-dom/server');

module.exports = {
	renderPage: (res, component, props = { data: []}) => {
		res.send(
			`<html>
				<head>
					<link rel="stylesheet" type="text/css" href="css/main.css" />
					<script type="text/javascript" src="js/client.js"></script>
				</head>
				<body id="app">
					${ReactDOMServer.renderToStaticMarkup(React.createElement(component, { ...props }))}
				</body>
			</html>`
		);
	}
};
