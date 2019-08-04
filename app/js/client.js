window.onload = () => {
	const temp = document.getElementById('temp');

	function copyToClipboard(text) {
		const textarea = document.createElement('textarea');
		temp.appendChild(textarea);
		textarea.value = text;
		textarea.select();
		document.execCommand('copy');
		temp.removeChild(textarea);
	}

	document.querySelectorAll('.entry-copy-id').forEach(entry => {
		entry.addEventListener('click', () => {
			copyToClipboard(entry.innerText);
			return false;
		});
	});

	document.querySelectorAll('.tabs ul li strong').forEach(entry => {
		entry.addEventListener('click', () => {
			const url = entry.dataset.url;
			document.getElementById('iframe-loader').style.opacity = '1';
			document.getElementById('iframe').src = url;
			document.getElementById('url').innerText = url;
			return false;
		});
	});

	document.querySelectorAll('.data .response-type').forEach(type => {
		type.addEventListener('click', () => {
			document.getElementsByClassName('response-type active')[0].classList.remove('active');
			type.classList.add('active');
			if (type.textContent === 'List') {
				document.getElementById('raw-response').style.display = 'none';
				document.getElementById('list-response').style.display = 'inline-block';
			} else {
				document.getElementById('raw-response').style.display = 'inline-block';
				document.getElementById('list-response').style.display = 'none';
			}
			return false;
		});
	});

	document.getElementById('iframe').onload = () => {
		document.getElementById('iframe-loader').style.opacity = '0';
	}
};
