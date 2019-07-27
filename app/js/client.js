window.onload = () => {
	document.querySelectorAll('.tabs ul li').forEach(entry => {
		entry.addEventListener('click', () => {
			const url = entry.dataset.url;
			document.getElementById('iframe-loader').style.opacity = '1';
			document.getElementById('iframe').src = url;
			document.getElementById('url').innerText = url;
			return false;
		});
	});
	document.getElementById('iframe').onload = () => {
		document.getElementById('iframe-loader').style.opacity = '0';
	}
};
