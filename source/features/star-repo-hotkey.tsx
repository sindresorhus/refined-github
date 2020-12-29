import * as pageDetect from 'github-url-detection';

import features from '.';

function init(): void {
	// There are two buttons: unstar and star
	for (const button of $$('.js-social-form > button')) {
		button.dataset.hotkey = 'g s';
	}
}

void features.add(__filebasename, {
	shortcuts: {
		'g s': 'Star and unstar repository'
	},
	include: [
		pageDetect.isRepo
	],
	init
});
