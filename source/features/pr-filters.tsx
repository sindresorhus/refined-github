import React from 'dom-chef';
import select from 'select-dom';
import delegate, {DelegateEvent} from 'delegate-it';
import cache from 'webext-storage-cache';
import checkIcon from 'octicon/check.svg';
import features from '../libs/features';
import {getRepoURL} from '../libs/utils';
import {getIcon as fetchCIStatus} from './ci-link';

const reviewsFilterSelector = '#reviews-select-menu';

function addDropdownItem(dropdown: HTMLElement, title: string, filterCategory: string, filterValue: string): void {
	const filterQuery = `${filterCategory}:${filterValue}`;

	const searchParameter = new URLSearchParams(location.search);
	const currentQuerySegments = searchParameter.get('q')?.split(/\s+/) ?? [];
	const isSelected = currentQuerySegments.some(
		segment => segment.toLowerCase() === filterQuery
	);

	const query = currentQuerySegments.filter(
		segment => !segment.startsWith(`${filterCategory}:`)
	).join(' ');

	const search = new URLSearchParams({
		q: query + (isSelected ? '' : ` ${filterQuery}`)
	});

	const icon = checkIcon();
	icon.classList.add('SelectMenu-icon', 'SelectMenu-icon--check');

	dropdown.append(
		<a
			href={`?${String(search)}`}
			className="SelectMenu-item"
			aria-checked={isSelected ? 'true' : 'false'}
			role="menuitemradio"
		>
			{icon}
			<span>{title}</span>
		</a>
	);
}

const hasDraftFilter = new WeakSet();
function addDraftFilter({delegateTarget: reviewsFilter}: DelegateEvent): void {
	if (hasDraftFilter.has(reviewsFilter)) {
		return;
	}

	hasDraftFilter.add(reviewsFilter);

	const dropdown = select('.SelectMenu-list', reviewsFilter)!;

	dropdown.append(
		<div className="SelectMenu-divider">
			Filter by draft pull requests
		</div>
	);

	addDropdownItem(dropdown, 'Ready for review', 'draft', 'false');
	addDropdownItem(dropdown, 'Not ready for review (Draft PR)', 'draft', 'true');
}

const cachedChecksStatus = cache.function(async () => {
	// TODO: replace this with an API call
	const statusIcon = await fetchCIStatus();
	return statusIcon !== undefined;
}, {
	expiration: 3,
	cacheKey: () => __featureName__ + ':' + getRepoURL()
});

async function addChecksFilter(): Promise<void> {
	const reviewsFilter = select(reviewsFilterSelector);
	if (!reviewsFilter) {
		return;
	}

	const hasCI = await cachedChecksStatus();
	if (!hasCI) {
		return;
	}

	// Copy existing element and adapt its content
	const checksFilter = reviewsFilter.cloneNode(true);
	checksFilter.id = '';

	select('summary', checksFilter)!.firstChild!.textContent = 'Checks\u00A0'; // Only replace text node, keep caret
	select('.SelectMenu-title', checksFilter)!.textContent = 'Filter by checks status';

	const dropdown = select('.SelectMenu-list', checksFilter)!;
	dropdown.textContent = ''; // Drop previous filters

	for (const status of ['Success', 'Failure', 'Pending']) {
		addDropdownItem(dropdown, status, 'status', status.toLowerCase());
	}

	reviewsFilter.after(' ', checksFilter);
}

function init(): void {
	delegate(reviewsFilterSelector, 'toggle', addDraftFilter, true);
	addChecksFilter();
}

features.add({
	id: __featureName__,
	description: 'Adds Checks and draft PR dropdown filters in PR lists.',
	screenshot: 'https://user-images.githubusercontent.com/22439276/56372372-7733ca80-621c-11e9-8b60-a0b95aa4cd4f.png',
	include: [
		features.isPRList
	],
	load: features.onAjaxedPages,
	init
});
