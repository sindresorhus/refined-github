import React from 'dom-chef';
import select from 'select-dom';
import * as pageDetect from 'github-url-detection';
import {CheckIcon, CheckCircleIcon, XCircleIcon, IssueOpenedIcon, GitPullRequestIcon, GitPullRequestDraftIcon, GitMergeIcon, DotIcon, DotFillIcon} from '@primer/octicons-react';

import features from '.';

const filters = {
	PR: '[href*="/pull/"]',
	Issue: '[href*="/issues/"]',
	Open: ':is(.octicon-issue-opened, .octicon-git-pull-request)',
	Closed: ':is(.octicon-issue-closed, .octicon-git-pull-request-closed)',
	Draft: '.octicon-git-pull-request-draft',
	Merged: '.octicon-git-merge',
	Read: 'notification-read',
	Unread: 'notification-unread'
};

type Filter = keyof typeof filters;
type Category = 'Type' | 'Status' | 'Read';

function handleSelection({target}: Event): void {
	const activeFilters: Record<Category, string[]> = {
		Type: [],
		Status: [],
		Read: []
	};
	for (const selectedFilter of select.all('[aria-checked="true"]', target as Element)) {
		activeFilters[selectedFilter.dataset.category as Category].push(filters[selectedFilter.dataset.filter as Filter]);
	}

	for (const notification of select.all('.notifications-list-item')) {
		notification.hidden = false;
		for (const [category, categoryFilters] of Object.entries(activeFilters)) {
			if (categoryFilters.length === 0) {
				continue;
			}

			if (category === 'Read') {
				if (categoryFilters.length === 1 && !notification.classList.contains(categoryFilters[0])) {
					notification.hidden = true;
					break;
				}

				continue;
			}

			if (!select.exists(categoryFilters, notification)) {
				notification.hidden = true;
				break;
			}
		}
	}

	// Hide empty notifications groups
	for (const group of select.all('.js-notifications-group')) {
		group.hidden = !select.exists('.notifications-list-item:not([hidden])', group);
	}
}

const icons: Record<Filter, JSX.Element> = {
	PR: <GitPullRequestIcon className="color-text-secondary"/>,
	Issue: <IssueOpenedIcon className="color-text-secondary"/>,
	Open: <CheckCircleIcon className="color-text-success"/>,
	Closed: <XCircleIcon className="color-text-danger"/>,
	Draft: <GitPullRequestDraftIcon className="color-text-tertiary"/>,
	Merged: <GitMergeIcon className="text-purple"/>,
	Read: <DotIcon className="color-text-link"/>,
	Unread: <DotFillIcon className="color-text-link"/>
};

function createDropdownList(category: Category, filters: Filter[]): JSX.Element {
	return (
		<div className="SelectMenu-list">
			<header className="SelectMenu-header">
				<span className="SelectMenu-title">{category}</span>
			</header>
			{filters.map(filter => (
				<label
					className="SelectMenu-item text-normal"
					role="menuitemcheckbox"
					aria-checked="false"
					tabIndex={0}
					data-filter={filter}
					data-category={category}
				>
					<CheckIcon className="octicon octicon-check SelectMenu-icon SelectMenu-icon--check mr-2" aria-hidden="true"/>
					<div className="SelectMenu-item-text">
						<input hidden type="checkbox"/>
						{icons[filter]}
						<span className="ml-2">{filter}</span>
					</div>
				</label>
			))}
		</div>
	);
}

function createDropdown(): JSX.Element {
	return (
		<details className="details-reset details-overlay position-relative d-none d-md-block">
			<summary
				className="btn ml-3"
				data-hotkey="f"
				aria-haspopup="menu"
				role="button"
			>
				Filter by <span className="dropdown-caret ml-1"/>
			</summary>
			<details-menu
				className="SelectMenu left-0"
				aria-label="Filter by"
				role="menu"
				on-details-menu-selected={handleSelection}
			>
				<div className="SelectMenu-modal">
					{createDropdownList('Type', ['PR', 'Issue'])}
					{createDropdownList('Status', ['Open', 'Closed', 'Merged', 'Draft'])}
					{createDropdownList('Read', ['Read', 'Unread'])}
				</div>
			</details-menu>
		</details>
	);
}

function init(): false | void {
	const notificationFilterWrapper = select('notification-filter')!.parentElement!;
	notificationFilterWrapper.nextElementSibling?.classList.replace('ml-3', 'ml-2');
	notificationFilterWrapper.after(createDropdown());
}

void features.add(__filebasename, {
	shortcuts: {
		f: 'Open the "Filter by" dropdown'
	},
	include: [
		pageDetect.isNotifications
	],
	init
});
