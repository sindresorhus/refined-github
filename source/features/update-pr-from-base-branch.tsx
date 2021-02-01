import React from 'dom-chef';
import select from 'select-dom';
import onetime from 'onetime';
import {AlertIcon} from '@primer/octicons-react';
import * as pageDetect from 'github-url-detection';
import {observe, Observer} from 'selector-observer';

import features from '.';
import * as api from '../github-helpers/api';
import {getConversationNumber} from '../github-helpers';

const selectorForPushablePRNotice = '.merge-pr > .text-gray:first-child:not(.rgh-update-pr)';
let observer: Observer;

function getBranches(): {base: string; head: string} {
	return {
		base: select('.base-ref')!.textContent!.trim(),
		head: select('.head-ref')!.textContent!.trim()
	};
}

async function mergeBranches(): Promise<AnyObject> {
	return api.v3(`pulls/${getConversationNumber()!}/update-branch`, {
		method: 'PUT',
		headers: {
			Accept: 'application/vnd.github.lydian-preview+json'
		},
		ignoreHTTPStatus: true
	});
}

async function handler({currentTarget}: React.MouseEvent): Promise<void> {
	const {base, head} = getBranches();
	if (!confirm(`Merge the ${base} branch into ${head}?`)) {
		return;
	}

	const statusMeta = currentTarget.parentElement!;
	statusMeta.textContent = 'Updating branch…';
	observer.abort();

	const response = await mergeBranches();
	if (response.ok) {
		statusMeta.remove();
	} else {
		statusMeta.textContent = response.message ?? 'Error';
		statusMeta.prepend(<AlertIcon/>, ' ');
		throw new api.RefinedGitHubAPIError('update-pr-from-base-branch: ' + JSON.stringify(response));
	}
}

async function addButton(position: Element): Promise<void> {
	const {base, head} = getBranches();
	const {status} = await api.v3(`compare/${base}...${head}`);

	if (status === 'diverged') {
		position.append(' ', (
			<span className="status-meta d-inline-block rgh-update-pr-from-base-branch">
				You can <button type="button" className="btn-link" onClick={handler}>update the PR</button>.
			</span>
		));
	}
}

const waitForText = onetime(() => {
	observer = observe(selectorForPushablePRNotice, {
		add(position) {
			position.classList.add('rgh-update-pr');
			void addButton(position);
		}
	});
});

async function init(): Promise<void | false> {
	await api.expectToken();

	// "Resolve conflicts" is the native button to update the PR
	if (select.exists('.js-merge-pr a[href$="/conflicts"]')) {
		return false;
	}

	// Quick check before using selector-observer on it
	if (!select.exists(selectorForPushablePRNotice)) {
		return false;
	}

	waitForText();
}

void features.add(__filebasename, {
	include: [
		pageDetect.isPRConversation
	],
	init
});
