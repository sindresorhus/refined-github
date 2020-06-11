import React from 'dom-chef';
import select from 'select-dom';
import delegate from 'delegate-it';
import AlertIcon from 'octicon/alert.svg';
import * as pageDetect from 'github-url-detection';
import * as textFieldEdit from 'text-field-edit';

import features from '.';
import {prCommitRegex} from '../github-helpers';

function handleButtonClick({delegateTarget: fixButton}: delegate.Event<MouseEvent, HTMLButtonElement>): void {
	const field = fixButton.form!.querySelector('textarea')!;
	textFieldEdit.replace(field, prCommitRegex, url => `[${url} ](${url})`);
	fixButton.parentElement!.remove();
}

function getUI(field: HTMLTextAreaElement): HTMLElement {
	return select('.rgh-fix-pr-commit-links-container', field.form!) ?? (
		<div className="flash flash-warn mb-2 rgh-fix-pr-commit-links-container">
			<AlertIcon/> Your PR Commit link may be <a target="_blank" rel="noopener noreferrer" href="https://github.com/sindresorhus/refined-github/issues/2327">misinterpreted by GitHub.</a>
			<button type="button" className="btn btn-sm primary flash-action rgh-fix-pr-commit-links">Fix link</button>
		</div>
	);
}

function updateUI({delegateTarget: field}: delegate.Event<InputEvent, HTMLTextAreaElement>): void {
	if (prCommitRegex.test(field.value)) {
		select('.form-actions', field.form!)!.prepend(getUI(field));
	} else {
		getUI(field).remove();
	}
}

function init(): void {
	delegate(document, 'form#new_issue textarea, form.js-new-comment-form textarea, textarea.comment-form-textarea', 'input', updateUI);
	delegate(document, '.rgh-fix-pr-commit-links', 'click', handleButtonClick);
}

void features.add({
	id: __filebasename,
	description: 'Suggests fixing your PR Commit links before commenting. GitHub has a bug that causes these link to appear as plain commit links, without association to the PR.',
	screenshot: 'https://user-images.githubusercontent.com/1402241/82131169-93fd5180-97d2-11ea-9695-97051c55091f.gif'
}, {
	include: [
		pageDetect.hasComments
	],
	init
});
