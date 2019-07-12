import React from 'dom-chef';
import select from 'select-dom';
import compareVersions from 'tiny-version-compare';
import * as api from '../libs/api';
import * as icons from '../libs/icons';
import features from '../libs/features';
import {isRepoRoot} from '../libs/page-detect';
import {groupSiblings} from '../libs/group-buttons';
import getDefaultBranch from '../libs/get-default-branch';
import {getRepoURL, getOwnerAndRepo} from '../libs/utils';

function getCurrentBranch(): string {
	const commitLink = select('link[rel="alternate"]')!;
	// Will be something like https://github.com/sindresorhus/refined-github/commits/master.atom
	const href = commitLink.getAttribute('href')!;
	const group = /\/commits\/(.+)\.atom$/.exec(href)!;
	return group[1];
}

async function getTagLink(): Promise<'' | HTMLAnchorElement> {
	const {ownerName, repoName} = getOwnerAndRepo();
	const {repository} = await api.v4(`{
		repository(owner: "${ownerName}", name: "${repoName}") {
			refs(first: 20, refPrefix: "refs/tags/", orderBy: {
				field: TAG_COMMIT_DATE,
				direction: DESC
			}) {
				nodes {
					name
				}
			}
		}
	}`);

	const tags: string[] = repository.refs.nodes.map((tag: {name: string}) => tag.name);
	if (tags.length === 0) {
		return '';
	}

	// If all tags are plain versions, parse them,
	// otherwise just use the latest.
	let latestRelease: string;
	if (tags.every(tag => /^[vr]?\d/.test(tag))) {
		latestRelease = tags.sort(compareVersions).pop()!;
	} else {
		latestRelease = tags[0];
	}

	const link = <a className="btn btn-sm btn-outline tooltipped tooltipped-ne">{icons.tag()}</a> as unknown as HTMLAnchorElement;

	const currentBranch = getCurrentBranch();

	if (currentBranch === latestRelease) {
		link.classList.add('disabled');
		link.setAttribute('aria-label', 'You’re on the latest release');
	} else {
		if (isRepoRoot()) {
			link.href = `/${getRepoURL()}/tree/${latestRelease}`;
		} else {
			link.href = location.pathname.replace(currentBranch, latestRelease);
		}

		link.setAttribute('aria-label', 'Visit the latest release');
		link.append(' ', <span className="css-truncate-target">{latestRelease}</span>);
	}

	return link;
}

async function getDefaultBranchLink(): Promise<HTMLElement | undefined> {
	const defaultBranch = await getDefaultBranch();
	const currentBranch = getCurrentBranch();

	// Don't show the button if we’re already on the default branch
	if (defaultBranch === undefined || defaultBranch === currentBranch) {
		return;
	}

	let url;
	if (isRepoRoot()) {
		url = `/${getRepoURL()}`;
	} else {
		url = location.pathname.replace(currentBranch, defaultBranch);
	}

	return (
		<a
			className="btn btn-sm btn-outline tooltipped tooltipped-ne"
			href={url}
			aria-label="Visit the default branch">
			{icons.branch()}
			{' '}
			{defaultBranch}
		</a>
	);
}

async function init(): Promise<false | void> {
	const breadcrumbs = select('.breadcrumb');
	if (!breadcrumbs) {
		return false;
	}

	const [defaultLink = '', tagLink = ''] = await Promise.all([
		getDefaultBranchLink(),
		getTagLink()
	]);

	const wrapper = (
		<div className="rgh-branch-buttons">
			{defaultLink}
			{tagLink}
		</div>
	);

	if (wrapper.children.length > 0) {
		breadcrumbs.before(wrapper);
	}

	if (wrapper.children.length > 1) {
		groupSiblings(wrapper.firstElementChild!);
	}
}

features.add({
	id: 'branch-buttons',
	include: [
		features.isRepoTree,
		features.isSingleFile
	],
	load: features.onAjaxedPages,
	init
});
