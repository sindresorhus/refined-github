import React from 'dom-chef';
import select from 'select-dom';
import features from '../libs/features';

const count = (str:String, re:RegExp) => {
  return ((str || '').match(re) || []).length
}

function createMergeLink():HTMLAnchorElement {
	const linkMergedSearchParams = new URLSearchParams(location.search)//.get('q')// ?? select('#js-issues-search').value;
	const linkIsMerged:HTMLAnchorElement = <a href="" className="btn-link">
		Merged
	</a>
	const regexp_query_total = /is:open|is:closed|is:issue/g
	const regexp_query = /is:open|is:closed|is:issue/

	var linkMergedSearchString = new URLSearchParams(location.search).get('q') ?? select<HTMLInputElement>('#js-issues-search').value;

	while (count(linkMergedSearchString, regexp_query_total) > 1) {
		linkMergedSearchString = linkMergedSearchString.replace(regexp_query, '').trim()
	}

	if (count(linkMergedSearchString, /is:merged/) == 1) {
		linkMergedSearchParams.set('q', linkMergedSearchString.replace(/is:merged/, 'is:issue').trim())
		linkIsMerged.classList.add("selected")
	} else if (count(linkMergedSearchString, regexp_query_total) == 1) {
		linkMergedSearchParams.set('q', linkMergedSearchString.replace(regexp_query, 'is:merged').trim())
	}
	linkIsMerged.search = String(linkMergedSearchParams) // "/sindresorhus/refined-github/issues?q=is%3Amerged"

	return linkIsMerged;
}

function init(): void {
	const currentQuery = new URLSearchParams(location.search).get('q') ?? select<HTMLInputElement>('#js-issues-search').value;

	const mergeLink = createMergeLink();

	const container_target_buttons = select('div.table-list-filters').children[0].children[0];
	const target_buttons = container_target_buttons.children;
	for (const link of target_buttons) {
		link.firstElementChild.remove();
		if (link.classList.contains('selected')) {
			link.prepend(<svg className="octicon octicon-check" viewBox="0 0 12 16" version="1.1" width="12" height="16" aria-hidden="true">
				<path fill-rule="evenodd" d="M12 5l-8 8-4-4 1.5-1.5L4 10l6.5-6.5L12 5z"/>
			</svg>);
			const linkSearchParameters = new URLSearchParams(link.search);
			const linkQuery = linkSearchParameters.get('q');
			linkSearchParameters.set('q', linkQuery.replace(/is:open|is:closed/, '').trim());
			link.search = String(linkSearchParameters);
		}
	}

	container_target_buttons.append(mergeLink);
}

features.add({
	id: __featureName__,
	description: 'Remove is:open/is:closed issue search query with a click, add Merged link button next to them.',
	screenshot: 'https://user-images.githubusercontent.com/3003032/73557979-02d7ba00-4431-11ea-90da-5e9e37688d61.png',
	include: [
		features.isRepo
	],
	exclude: [
		features.isOwnUserProfile
	],
	load: features.onDomReady, // Wait for DOM ready
	init
});
