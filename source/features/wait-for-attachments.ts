import select from 'select-dom';
import * as pageDetect from 'github-url-detection';

import features from '.';

// `data-required-trimmed` overrides the `disabled` state of the form
const attribute = 'data-required-trimmed';
const attributeBackup = 'data-rgh-required-trimmed';

function toggleSubmitButtons({target, type}: Event): void {
	const form = target as HTMLFormElement;
	const textarea = select(`[${attribute}], [${attributeBackup}]`, form)!;
	if (type === 'upload:setup') {
		textarea.setAttribute(attributeBackup, textarea.getAttribute(attribute)!);
		textarea.removeAttribute(attribute);
	} else {
		textarea.setAttribute(attribute, textarea.getAttribute(attributeBackup)!);
		textarea.removeAttribute(attributeBackup);
	}
}

function init(): void {
	document.addEventListener('upload:setup', toggleSubmitButtons, true);
	document.addEventListener('upload:complete', toggleSubmitButtons);
	document.addEventListener('upload:error', toggleSubmitButtons);
	document.addEventListener('upload:invalid', toggleSubmitButtons);
}

void features.add(__filebasename, {
	include: [
		pageDetect.hasRichTextEditor
	],
	exclude: [
		pageDetect.isNewIssue
	],
	init
});
