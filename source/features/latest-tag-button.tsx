import './latest-tag-button.css';
import React from 'dom-chef';
import cache from 'webext-storage-cache';
import alertIcon from 'octicon/alert.svg';
import tagIcon from 'octicon/tag.svg';
import elementReady from 'element-ready';
import compareVersions from 'tiny-version-compare';
import * as api from '../libs/api';
import features from '../libs/features';
import {isRepoRoot} from '../libs/page-detect';
import getDefaultBranch from '../libs/get-default-branch';
import {getRepoURL, getCurrentBranch, replaceBranch, getRepoGQL} from '../libs/utils';

interface Tag {
	name: string;
	commit: string;
}

const getLatestTag = cache.function(async (): Promise<{'name': string; 'isBehind': boolean} | false> => {
	const {repository} = await api.v4(`
		repository(${getRepoGQL()}) {
			refs(first: 20, refPrefix: "refs/tags/", orderBy: {
				field: TAG_COMMIT_DATE,
				direction: DESC
			}) {
				nodes {
					name
					tag: target {
						... on Tag {
							commit: target {
								oid
							}
						}
					}
				}
			}
			defaultBranchRef {
				target {
					oid
				}
			}
		}
	`);

	if (repository.refs.nodes.length === 0) {
		return false;
	}

	const tags: Tag[] = repository.refs.nodes.map((node: AnyObject) => ({
		name: node.name,
		commit: node.tag.commit.oid
	}));

	// Default to the first tag in the (reverse chronologically-sorted) list
	let [latestTag] = tags;

	// If all tags are plain versions, sort them as versions
	if (tags.every(tag => /^[vr]?\d/.test(tag.name))) {
		latestTag = tags.sort((tag1, tag2) => compareVersions(tag1.name, tag2.name)).pop()!;
	}

	return {
		name: latestTag.name,
		isBehind: latestTag.commit !== repository.defaultBranchRef.target.oid
	};
}, {
	expiration: 1,
	cacheKey: () => __featureName__ + ':' + getRepoURL()
});

function getTagLink(latestRelease: string, defaultBranch: string, isAhead: boolean): HTMLAnchorElement {
	const link = <a className="btn btn-sm btn-outline tooltipped tooltipped-ne ml-2">{tagIcon()}</a> as unknown as HTMLAnchorElement;

	const currentBranch = getCurrentBranch();

	if (currentBranch === latestRelease) {
		link.classList.add('disabled');
		link.setAttribute('aria-label', 'You’re on the latest release');
	} else {
		link.append(' ', <span className="css-truncate-target">{latestRelease}</span>);
		if (currentBranch === defaultBranch && isAhead) {
			link.setAttribute('aria-label', `${defaultBranch} is ahead of the latest release`);
			link.append(' ', alertIcon());
		} else {
			link.setAttribute('aria-label', 'Visit the latest release');
		}

		if (isRepoRoot()) {
			link.href = `/${getRepoURL()}/tree/${latestRelease}`;
		} else {
			link.href = replaceBranch(currentBranch, latestRelease);
		}
	}

	return link;
}

async function init(): Promise<false | void> {
	const defaultBranch = await getDefaultBranch();
	const [breadcrumbs, latestTag] = await Promise.all([
		elementReady('.breadcrumb'),
		getLatestTag()
	]);

	if (!breadcrumbs || !latestTag) {
		return false;
	}

	breadcrumbs.before(getTagLink(latestTag.name, defaultBranch, latestTag.isBehind));
}

features.add({
	id: __featureName__,
	description: 'Adds link to the latest version tag on directory listings and files.',
	screenshot: 'https://user-images.githubusercontent.com/1402241/71885167-63464500-316c-11ea-806c-5abe37281eca.png',
	include: [
		features.isRepoTree,
		features.isSingleFile
	],
	load: features.nowAndOnAjaxedPages,
	init
});
