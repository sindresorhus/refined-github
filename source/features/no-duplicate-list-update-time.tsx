import select from 'select-dom';
import * as pageDetect from 'github-url-detection';

import features from '.';

function parseTime(element: HTMLElement): number {
	return new Date(element.getAttribute('datetime')!).getTime();
}

function init(): void {
	for (const issue of select.all('.js-navigation-item[id^="issue_"]')) {
		const [stateChangeTime, updateTime] = select.all('relative-time', issue);
		console.log(issue, (parseTime(updateTime) - parseTime(stateChangeTime))/1000);

		if (parseTime(updateTime) - parseTime(stateChangeTime) < 10000) { // Hide if within 10 seconds
			updateTime.parentElement!.remove()
		}
	}
}

console.log(33);

void features.add(__filebasename, {
	include: [
		pageDetect.isConversationList
	],
	exclude: [
		() => !location.search.includes('sort%3Aupdated-desc')
	],
	init
});
