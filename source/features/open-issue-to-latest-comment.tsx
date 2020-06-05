import React from 'dom-chef';
import select from 'select-dom';
import * as pageDetect from 'github-url-detection';

import {wrap} from '../helpers/dom-utils';
import features from '.';

function init(): void {
	for (const link of select.all<HTMLAnchorElement>('.js-issue-row a[aria-label*="comment"], .js-pinned-issue-list-item a[aria-label*="comment"]')) {
		link.hash = '#partial-timeline';
	}
}

function initDashboard(): void {
	for (const icon of select.all('.js-recent-activity-container :not(a) > div > .octicon-comment')) {
		const url = icon.closest('li')!.querySelector('a')!.pathname + '#partial-timeline';
		wrap(icon.parentElement!, <a className="muted-link rgh-latest-comment" href={url}/>);
	}
}

void features.add({
	id: __filebasename,
	description: 'Links the comments icon to the latest comment.',
	screenshot: 'https://user-images.githubusercontent.com/14323370/57962709-7019de00-78e8-11e9-8398-7e617ba7a96f.png'
}, {
	include: [
		pageDetect.isDiscussionList
	],
	init
}, {
	include: [
		pageDetect.isDashboard
	],
	onlyAdditionalListeners: true,
	repeatOnAjax: false,
	init: initDashboard
});
