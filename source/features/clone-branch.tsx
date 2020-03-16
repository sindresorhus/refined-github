import gitBranch from 'octicon/git-branch.svg';
import React from 'dom-chef';
import select from 'select-dom';
import delegate, {DelegateEvent} from 'delegate-it';
import * as api from '../libs/api';
import features from '../libs/features';
import {getRepoURL} from '../libs/utils';

async function cloneBranch(event: DelegateEvent<MouseEvent, HTMLAnchorElement>): Promise<void|false> {
	const currentTarget = event.delegateTarget;
	const branchElement = (currentTarget.closest('[data-branch-name]') as HTMLAnchorElement);
	const newBranchName = prompt('Enter the new branch name')?.trim();
	if (!newBranchName) {
		return false;
	}

	// eslint-disable-next-line no-control-regex
	const invalidBranchName = new RegExp(/^[./]|\.\.|@{|[/.]$|^@$|[~^:\u0000-\u0020\u007F\s?*]/);
	if (invalidBranchName.test(newBranchName)) {
		alert(`'${newBranchName}' contains an invalid branch name character \n see https://git-scm.com/docs/git-check-ref-format for more details`);
		return false;
	}

	const spinner = select('.js-loading-spinner', branchElement)!;
	spinner.hidden = false;
	currentTarget.hidden = true;

	try {
		const getBranchInfo = await api.v3(`repos/${getRepoURL()}/git/refs/heads/${branchElement.dataset.branchName!}`);
		await api.v3(`repos/${getRepoURL()}/git/refs`, {
			method: 'POST',
			body: {
				sha: String(getBranchInfo.object.sha),
				ref: 'refs/heads/' + newBranchName
			}
		});
		location.reload();
	} catch (error) {
		console.error(error);
		alert('Creating branch failed. See console for details');
	}

	spinner.hidden = true;
	currentTarget.hidden = false;
}

function init(): void|false {
	// Is the user does not have rights to create a branch
	if (!select.exists('[aria-label="Delete this branch"]')) {
		return false;
	}

	for (const branch of select.all('[aria-label="Delete this branch"]')) {
		branch.closest('.Details-content--shown')!.after(
			<a
				aria-label="Clone Branch"
				className="no-underline tooltipped tooltipped-e d-inline-block ml-3 rgh-clone-branch"
			>
				{gitBranch()}
			</a>
		);
	}

	delegate('.rgh-clone-branch', 'click', cloneBranch);
}

features.add({
	id: __featureName__,
	screenshot: 'https://user-images.githubusercontent.com/16872793/76714763-6d059f00-66ff-11ea-976f-7305def964b2.png',
	include: [
		features.isBranches
	],
	load: features.onAjaxedPages,
	init
});
