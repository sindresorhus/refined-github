import React from 'dom-chef';
import * as pageDetect from 'github-url-detection';

import features from '.';

function init(): void {
	for (const header of $$('.js-notifications-group h6')) {
		header.append(
			<a className="text-inherit" href={'/' + header.textContent!.trim()}>
				{header.firstChild}
			</a>
		);
	}
}

void features.add(__filebasename, {
	include: [
		pageDetect.isNotifications
	],
	init
});
