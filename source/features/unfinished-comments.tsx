import delegate from 'delegate-it';

import select from 'select-dom';
import * as pageDetect from 'github-url-detection';

import features from '.';

let documentTitle: string | undefined;

function hasDraftComments(): boolean {
	return select.all('textarea').some(textarea => textarea.value.length > 0 && textarea.offsetWidth > 0);
}

function updateDocumentTitle(): void {
	resetDocumentTitle();
	if (document.visibilityState === 'hidden' && hasDraftComments()) {
		documentTitle = document.title;
		document.title = '(Draft comment) ' + document.title;
	}
}

function resetDocumentTitle(): void {
	if (documentTitle) {
		document.title = documentTitle;
		documentTitle = undefined;
	}
}

function init(): void {
	document.addEventListener('visibilitychange', updateDocumentTitle);
	delegate(document.body, 'form', 'submit', updateDocumentTitle);
}

void features.add(__filebasename, {
	include: [
		pageDetect.hasComments
	],
	init
});
