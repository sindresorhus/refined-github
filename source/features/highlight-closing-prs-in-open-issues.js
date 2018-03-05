import {h} from 'dom-chef';
import select from 'select-dom';
import observeEl from '../libs/simplified-element-observer';
import * as icons from '../libs/icons';

function add() {
	if (select.exists('.rgh-closing-pr')) {
		return;
	}
	for (const pr of select.all('[aria-label*="will close once pull request"]')) {
		const prLink = select('a', pr.nextElementSibling);
		const issueNumber = select('.issue-num', prLink).textContent;
		select('.gh-header-meta .TableObject-item').after(
			<div class="TableObject-item">
				<a href={prLink.href} class="btn btn-outline btn-sm border-blue rgh-closing-pr">
					{icons.openPullRequest()}&nbsp;{issueNumber}
				</a>
			</div>
		);
	}
}

export default function () {
	// The issue header changes when new comments are added or the issue status changes
	observeEl('.js-issues-results', add);
}
