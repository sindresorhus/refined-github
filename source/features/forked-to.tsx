import './forked-to.css';
import React from 'dom-chef';
import cache from 'webext-storage-cache';
import select from 'select-dom';
import elementReady from 'element-ready';
import * as pageDetect from 'github-url-detection';
import {CheckIcon, LinkExternalIcon, RepoForkedIcon} from '@primer/octicons-react';

import features from '.';
import fetchDom from '../helpers/fetch-dom';
import GitHubURL from '../github-helpers/github-url';
import {getUsername, getForkedRepo, getRepo} from '../github-helpers';

const getForkSourceRepo = (): string => getForkedRepo() ?? getRepo()!.nameWithOwner;
const getCacheKey = (): string => `forked-to:${getForkSourceRepo()}@${getUsername()}`;

const updateCache = cache.function(async (): Promise<string[] | undefined> => {
	const document = await fetchDom(`/${getForkSourceRepo()}/fork?fragment=1`);
	const forks = select
		.all('.octicon-repo-forked', document)
		.map(({nextSibling}) => nextSibling!.textContent!.trim());

	return forks.length > 0 ? forks : undefined;
}, {
	maxAge: {hours: 1},
	staleWhileRevalidate: {days: 5},
	cacheKey: getCacheKey
});

function createLink(baseRepo: string): string {
	if (pageDetect.isSingleFile() || pageDetect.isRepoTree() || pageDetect.isEditingFile()) {
		const [user, repository] = baseRepo.split('/', 2);
		const url = new GitHubURL(location.href).assign({
			user,
			repository
		});
		return url.pathname;
	}

	return '/' + baseRepo;
}

async function updateUI(forks: string[]): Promise<void> {
	// Don't add button if you're visiting the only fork available
	if (forks.length === 1 && forks[0] === getRepo()!.nameWithOwner) {
		return;
	}

	document.body.classList.add('rgh-forked-to');
	const forkCounter = await elementReady('.social-count[href$="/network/members"]', {waitForChildren: false});
	if (forks.length === 1) {
		forkCounter!.before(
			<a
				href={createLink(forks[0])}
				className="btn btn-sm float-left rgh-forked-button"
				title={`Open your fork at ${forks[0]}`}
			>
				<LinkExternalIcon/>
			</a>
		);
	} else {
		forkCounter!.before(
			<details className="details-reset details-overlay select-menu float-left">
				<summary
					className="select-menu-button float-left btn btn-sm btn-with-count rgh-forked-button"
					aria-haspopup="menu"
					title="Open any of your forks"/>
				<details-menu
					style={{zIndex: 99}}
					className="select-menu-modal position-absolute right-0 mt-5"
				>
					<div className="select-menu-header">
						<span className="select-menu-title">Your forks</span>
					</div>
					{forks.map(fork => (
						<a
							href={createLink(fork)}
							className={`select-menu-item ${fork === getRepo()!.nameWithOwner ? 'selected' : ''}`}
							title={`Open your fork at ${fork}`}
						>
							<span className="select-menu-item-icon rgh-forked-to-icon">
								{fork === getRepo()!.nameWithOwner ? <CheckIcon/> : <RepoForkedIcon/>}
							</span>
							{fork}
						</a>
					))}
				</details-menu>
			</details>
		);
	}
}

async function init(): Promise<void | false> {
	const forks = await cache.get<string[]>(getCacheKey());
	if (forks) {
		await updateUI(forks);
	}

	// This feature only applies to users that have multiple organizations, because that makes a fork picker modal appear when clicking on "Fork"
	const hasOrganizations = await elementReady('details-dialog[src*="/fork"] include-fragment');

	// Only fetch/update forks when we see a fork (on the current page or in the cache).
	// This avoids having to `updateCache` for every single repo you visit.
	if (forks || (hasOrganizations && pageDetect.isForkedRepo())) {
		await updateCache();
	} else {
		return false;
	}
}

void features.add(__filebasename, {
	include: [
		pageDetect.isRepo
	],
	awaitDomReady: false,
	init
});
