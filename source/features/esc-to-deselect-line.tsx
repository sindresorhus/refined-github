import * as pageDetect from 'github-url-detection';

import features from '.';
import {isEditable} from '../helpers/dom-utils';

function isLineSelected(): boolean {
	// Example hashes:
	// #L1
	// #L1-L7
	// #diff-1030ad175a393516333e18ea51c415caR1
	return /^#L|^#diff-[\da-f]+R\d+/.test(location.hash);
}

function listener({key, target}: KeyboardEvent): void {
	if (
		key === 'Escape' && // Catch `Esc` key
		isLineSelected() &&
		!isEditable(target) // If a field isn’t focused
	) {
		location.hash = '#no-line'; // Update UI, without `scroll-to-top` behavior
		history.replaceState({}, document.title, location.pathname); // Drop remaining # from url
	}
}

function init(): void {
	document.body.addEventListener('keyup', listener);
}

void features.add({
	id: __filebasename,
	description: 'Adds a keyboard shortcut to deselect the current line: `esc`.',
	screenshot: false
}, {
	include: [
		pageDetect.hasCode
	],
	waitForDomReady: false,
	repeatOnAjax: false,
	init
});
