import cache from 'webext-storage-cache';
import select from 'select-dom';
import elementReady from 'element-ready';
import * as pageDetect from 'github-url-detection';

import features from '.';
import fetchDom from '../helpers/fetch-dom';
import getTabCount from '../github-helpers/get-tab-count';
import looseParseInt from '../helpers/loose-parse-int';
import {getWorkflows} from './next-scheduled-github-action';
import abbreviateNumber from '../helpers/abbreviate-number';
import {onlyShowInDropdown} from './more-dropdown';
import {buildRepoURL, getRepo} from '../github-helpers';

function mustKeepTab(tab: HTMLElement | undefined): boolean {
	return (
		!tab // Tab disabled 🎉
		|| tab.matches('.selected')// User is on tab 👀
		// Repo owners should see the tab. If they don't need it, they should disable the feature altogether
		|| pageDetect.canUserEditRepo()
	);
}

function setTabCounter(tab: HTMLElement, count: number): void {
	const tabCounter = select('.Counter', tab)!;
	tabCounter.textContent = abbreviateNumber(count);
	tabCounter.title = count > 999 ? String(count) : '';
}

const getWikiPageCount = cache.function(async (): Promise<number> => {
	const wikiPages = await fetchDom(buildRepoURL('wiki'), '#wiki-pages-box .Counter');
	return looseParseInt(wikiPages);
}, {
	maxAge: {hours: 1},
	staleWhileRevalidate: {days: 5},
	cacheKey: () => 'wiki-page-count:' + getRepo()!.nameWithOwner,
});

async function initWiki(): Promise<void | false> {
	const wikiTab = await elementReady('[data-hotkey="g w"]');
	if (!wikiTab) {
		return false;
	}

	const wikiPageCount = await getWikiPageCount();
	if (wikiPageCount > 0 || mustKeepTab(wikiTab)) {
		setTabCounter(wikiTab, wikiPageCount);
	} else {
		onlyShowInDropdown('wiki-tab');
	}
}

async function initActions(): Promise<void | false> {
	const actionsTab = await elementReady('[data-hotkey="g a"]');
	if (!actionsTab) {
		return false;
	}

	const actionsCount = (await getWorkflows()).length;
	if (actionsCount > 0 || mustKeepTab(actionsTab)) {
		setTabCounter(actionsTab, actionsCount);
	} else {
		onlyShowInDropdown('actions-tab');
	}
}

async function initProjects(): Promise<void | false> {
	const projectsTab = await elementReady('[data-hotkey="g b"]');
	if (await getTabCount(projectsTab!) > 0 || mustKeepTab(projectsTab)) {
		return false;
	}

	if (pageDetect.isRepo()) {
		onlyShowInDropdown('projects-tab');
		return;
	}

	if (pageDetect.canUserEditOrganization()) {
		// Leave Project tab visible to those who can create a new project
		return;
	}

	projectsTab!.remove();
}

async function init(): Promise<void> {
	const repoNavigationBar = (await elementReady('.UnderlineNav-body'))!;
	// The user may have disabled `more-dropdown` so un-hide it
	repoNavigationBar.parentElement!.classList.add('rgh-has-more-dropdown');
	onlyShowInDropdown('security-tab');
	onlyShowInDropdown('insights-tab');
}

void features.add(__filebasename, {
	include: [
		pageDetect.isRepo,
	],
	awaitDomReady: false,
	init,
}, {
	include: [
		pageDetect.isRepo,
		pageDetect.isOrganizationProfile,
	],
	awaitDomReady: false,
	init: initProjects,
}, {
	include: [
		pageDetect.isRepo,
	],
	awaitDomReady: false,
	init: initActions,
}, {
	include: [
		pageDetect.isRepo,
	],
	awaitDomReady: false,
	init: initWiki,
});
