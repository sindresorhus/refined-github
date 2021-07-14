import React from 'dom-chef';
import select from 'select-dom';
import delegate from 'delegate-it';
import * as pageDetect from 'github-url-detection';

import features from '.';

function addQuickSubmit(): void {
	select('input#commit-summary-input')!.classList.add('js-quick-submit');
}

function onKeyDown(event: delegate.Event<KeyboardEvent, HTMLInputElement>): void {
	const field = event.delegateTarget;
	const form = field.form!;
	if (
		event.key !== 'Enter'
		|| event.ctrlKey
		|| event.metaKey
		|| event.isComposing // #4323
		|| select.exists([
			'.suggester', // GitHub’s autocomplete dropdown
			'.rgh-avoid-accidental-submissions',
		], form)
	) {
		return;
	}

	if (select.exists('.btn-primary[type="submit"]:disabled', form)) {
		return;
	}

	const message = (
		<p className="rgh-avoid-accidental-submissions my-1">
			A submission via <kbd>enter</kbd> has been prevented. You can press <kbd>enter</kbd> again or use <kbd>ctrl</kbd>-<kbd>enter</kbd>.
		</p>
	);
	if (pageDetect.isNewFile() || pageDetect.isEditingFile() || pageDetect.isPRConversation()) {
		field.after(message);
	} else {
		field.parentElement!.append(message);
	}

	event.preventDefault();
}

const inputElements = [
	'form.new_issue input#issue_title',
	'input#pull_request_title',
	'input#commit-summary-input',
	'#merge_title_field',
];

function init(): void {
	delegate(document, inputElements.join(','), 'keydown', onKeyDown);
}

void features.add(__filebasename, {
	include: [
		pageDetect.isNewIssue,
		pageDetect.isCompare,
		pageDetect.isNewFile,
		pageDetect.isEditingFile,
		pageDetect.isPRConversation,
	],
	init,
}, {
	shortcuts: {
		'ctrl enter': 'Publish a new/edited file',
	},
	include: [
		pageDetect.isNewFile,
		pageDetect.isEditingFile,
	],
	init: addQuickSubmit,
});
