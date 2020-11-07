import './single-diff-column-selection.css';

import select from 'select-dom';
import delegate from 'delegate-it';

import features from '.';

function disableDiffSelection(event: delegate.Event<MouseEvent, HTMLElement>): void {
	event.delegateTarget.closest('tbody')!.dataset.rghSelect = event.delegateTarget.closest('td:last-child') ? 'right' : 'left';
}

function restoreDiffSelection(): void {
	if (document.getSelection()!.isCollapsed) {
		select('[data-rgh-select]')?.removeAttribute('data-rgh-select');
	}
}

function init(): void {
	delegate(document.body, '.blob-code', 'mousedown', disableDiffSelection);
	document.body.addEventListener('selectionchange', restoreDiffSelection);
}

void features.add(__filebasename, {
	include: [
		() => select.exists('meta[name="diff-view"][content="split"]')
	],
	init
});
