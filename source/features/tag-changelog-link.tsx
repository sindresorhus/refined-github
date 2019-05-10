/*
Adds a compare link on each releases/tags/single tag page so that you can see what has changed since the previous release.
If the tags are namespaced then it tries to get the previous release of the same namespaced tag.

See it in action at: https://github.com/parcel-bundler/parcel/releases
*/
import React from 'dom-chef';
import select from 'select-dom';
import features from '../libs/features';
import fetchDom from '../libs/fetch-dom';
import * as icons from '../libs/icons';
import {isSingleTagPage} from '../libs/page-detect';
import {getRepoPath, getRepoURL} from '../libs/utils';

type TagDetails = {
	element: HTMLElement;
	commit: string;
	tag: string;
}

async function getNextPage(): Promise<DocumentFragment> {
	const nextPageLink = select<HTMLAnchorElement>('.pagination a:last-child');
	if (nextPageLink) {
		return fetchDom(nextPageLink.href);
	}

	if (isSingleTagPage()) {
		const [, tag = ''] = getRepoPath()!.split('releases/tag/', 2); // Already URL-encoded
		return fetchDom(`/${getRepoURL()}/tags?after=${tag}`);
	}

	return new DocumentFragment();
}

function parseTags(element: HTMLElement): TagDetails {
	return {
		element,
		commit: select('[href*="/commit/"]', element)!.textContent!.trim(),
		tag: select<HTMLAnchorElement>('[href*="/releases/tag/"]', element)!.pathname.match(/\/releases\/tag\/(.*)/)![1]
	};
}

async function init(): Promise<void | false> {
	if (select.exists('.blankslate')) {
		return false;
	}

	const tagsSelectors = [
		// https://github.com/facebook/react/releases (release in releases list)
		'.release',

		// https://github.com/facebook/react/releases?after=v16.7.0 (tags in releases list)
		'.release-main-section .commit',

		// https://github.com/facebook/react/tags (tags list)
		'.Box-row .commit'
	].join();

	// Look for tags in the current page and the next page
	const pages = [document, await getNextPage()];
	const allTags = select.all(tagsSelectors, pages).map(parseTags);

	for (const [index, container] of allTags.entries()) {
		const previousTag = getPreviousTag(index, allTags);

		if (previousTag !== false) {
			// Signed releases include on mobile include a "Verified" <details> inside the `ul`. `li:last-of-type` excludes it.
			// Example: https://github.com/tensorflow/tensorflow/releases?after=v1.12.0-rc1
			for (const lastLink of select.all('.list-style-none > li:last-of-type', container.element)) {
				lastLink.after(
					<li className={lastLink.className}>
						<a
							className="muted-link tooltipped tooltipped-n"
							aria-label={'See changes since ' + decodeURIComponent(previousTag)}
							href={`/${getRepoURL()}/compare/${previousTag}...${allTags[index].tag}`}
						>
							{icons.diff()} Changelog
						</a>
					</li>
				);

				// `lastLink` is no longer the last link, so it shouldn't push our new link away.
				// Same page as before: https://github.com/tensorflow/tensorflow/releases?after=v1.12.0-rc1
				lastLink.classList.remove('flex-auto');
			}
		}
	}
}

// If tag is `@parcel/integration-tests@1.12.2` then namespace is `@parcel/integration-tests`
const getNameSpace = (tag: string): string => tag.split(/@[^@]+$/)[0];

const getPreviousTag = (index: number, allTags: TagDetails[]): string | false => {
	let previousTag: string | false = false;

	for (let i = index + 1; i < allTags.length; i++) {
		if (allTags[i].commit === allTags[index].commit) {
			continue;
		}

		// Ensure that they have the same namespace. e.g. `parcel@1.2.4` and `parcel@1.2.3`
		if (getNameSpace(allTags[i].tag) === getNameSpace(allTags[index].tag)) {
			return allTags[i].tag;
		}

		if (previousTag === false) {
			previousTag = allTags[i].tag;
		}
	}

	return previousTag;
};

features.add({
	id: 'tag-changelog-link',
	include: [
		features.isReleasesOrTags
	],
	load: features.onAjaxedPages,
	init
});
