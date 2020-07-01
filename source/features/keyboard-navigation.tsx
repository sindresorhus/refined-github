import select from 'select-dom';
import * as pageDetect from 'github-url-detection';

import features from '.';
import {isEditable} from '../helpers/dom-utils';

function runShortcuts(event: KeyboardEvent): void {
	if (isEditable(event.target)) {
		return;
	}

	const focusedComment = select(':target')!;

	if (['j', 'k'].includes(event.key)) {
		event.preventDefault();

		const items = select.all('.js-targetable-element')
			.filter(comment => !comment.querySelector('.minimized-comment:not(.d-none)'));
		// `j` goes to the next comment, `k` goes back a comment
		const direction = event.key === 'j' ? 1 : -1;

		const currentIndex = items.indexOf(focusedComment);

		// Start at 0 if nothing is; clamp index
		const chosenCommentIndex = Math.min(
			Math.max(0, currentIndex + direction),
			items.length - 1
		);

		// Focus comment without pushing to history
		location.replace('#' + items[chosenCommentIndex].id);
	}
}

function init(): void {
	document.addEventListener('keypress', runShortcuts);
}

void features.add({
	id: __filebasename,
	description: 'Adds shortcuts to conversations and PR file lists: `j` focuses the comment/file below; `k` focuses the comment/file above.',
	screenshot: false,
	shortcuts: {
		j: 'Focus the comment/file below',
		k: 'Focus the comment/file above'
	}
}, {
	include: [
		pageDetect.hasComments
	],
	repeatOnAjax: false,
	init
});
