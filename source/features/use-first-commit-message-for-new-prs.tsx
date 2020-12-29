import elementReady from 'element-ready';
import * as pageDetect from 'github-url-detection';
import * as textFieldEdit from 'text-field-edit';

import features from '.';
import looseParseInt from '../helpers/loose-parse-int';

async function init(): Promise<void | false> {
	const commitCount = (await elementReady<HTMLElement>('div.Box.mb-3 .octicon-git-commit'))?.nextElementSibling;
	if (!commitCount || looseParseInt(commitCount) < 2 || !$.exists('#new_pull_request')) {
		return false;
	}

	const [prTitle, ...prMessage] = $('#commits_bucket [data-url$="compare/commit"] a[title]')!.title.split(/\n\n/);

	textFieldEdit.set(
		$('.discussion-topic-header input')!,
		prTitle
	);
	textFieldEdit.insert(
		$('#new_pull_request textarea[aria-label="Comment body"]')!,
		prMessage.join('\n\n')
	);
}

void features.add(__filebasename, {
	include: [
		pageDetect.isCompare
	],
	awaitDomReady: false,
	init
});
