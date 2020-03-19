import delegate, {DelegateEvent} from 'delegate-it';
import gitBranch from 'octicon/git-branch.svg';
import insertTextTextarea from 'insert-text-textarea';
import React from 'dom-chef';
import select from 'select-dom';
import * as api from '../libs/api';
import features from '../libs/features';
import {getRepoURL, getRepoGQL} from '../libs/utils';

const getBranchBaseSha = async (branchName: string): Promise<string> => {
	const {repository} = await api.v4(`
		repository(${getRepoGQL()}) {
			ref(qualifiedName: "${branchName}") {
				target {
					oid
				}
			}
		}
	`);

	return repository.ref.target.oid;
};

async function cloneBranch(event: DelegateEvent<MouseEvent, HTMLButtonElement>): Promise<void> {
	const currentTarget = event.delegateTarget;
	const branchElement = currentTarget.closest<HTMLElement>('[data-branch-name]');

	const currentBranch = getBranchBaseSha(branchElement!.dataset.branchName!);
	let newBranchName = prompt('Enter the new branch name')?.trim();
	if (!newBranchName) {
		return;
	}

	let result = await createBranch(newBranchName, await currentBranch, currentTarget);

	while (result !== true) {
		newBranchName = prompt(result + '\n Enter the new branch name', newBranchName)?.trim();
		if (!newBranchName) {
			return;
		}

		result = await createBranch(newBranchName, await currentBranch, currentTarget); // eslint-disable-line no-await-in-loop
	}

	if (!newBranchName) {
		return;
	}

	const searchField = select<HTMLInputElement>('.js-branch-search-field')!;
	searchField.select();
	insertTextTextarea(searchField, newBranchName);
}

async function createBranch(newBranchName: string, baseSha: string, currentTarget: HTMLElement): Promise<true | string> {
	const spinner = select('.js-loading-spinner', currentTarget.closest<HTMLElement>('[data-branch-name]')!)!;
	spinner.hidden = false;
	currentTarget.hidden = true;
	return api.v3(`repos/${getRepoURL()}/git/refs`, {
		method: 'POST',
		body: {
			sha: baseSha,
			ref: 'refs/heads/' + newBranchName
		},
		ignoreHTTPStatus: true
	}).then(response => {
		spinner.hidden = true;
		currentTarget.hidden = false;
		if (response.ok) {
			return true;
		}

		return response.message;
	});
}

function init(): void | false {
	const deleteIcons = select.all('[aria-label="Delete this branch"]');
	// Is the user does not have rights to create a branch
	if (deleteIcons.length === 0) {
		return false;
	}

	for (const branch of deleteIcons) {
		branch.closest('.js-branch-destroy')!.before(
			<button
				type="button"
				aria-label="Clone this branch"
				className="link-gray btn-link tooltipped tooltipped-nw ml-3 rgh-clone-branch"
			>
				{gitBranch()}
			</button>
		);
	}

	delegate('.rgh-clone-branch', 'click', cloneBranch);
}

features.add({
	id: __featureName__,
	description: 'Clone a branch from the branches list.',
	screenshot: 'https://user-images.githubusercontent.com/16872793/76802029-2a020500-67ad-11ea-95dc-bee1b1352976.png',
	include: [
		features.isBranches
	],
	load: features.onAjaxedPages,
	init
});
