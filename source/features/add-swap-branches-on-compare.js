import {h} from 'dom-chef';
import select from 'select-dom';
import {wrap} from '../libs/utils';
import features from '../libs/features';
import {getRepoPath, getRepoURL} from '../libs/page-detect';

function init() {
	const references = getRepoPath()
		.replace('compare/', '')
		.split('...')
		.reverse();

	// Compares against the "base" branch if the URL only has one reference
	if (references.length === 1) {
		references.unshift(select('.branch span').textContent);
	}

	const icon = select('.octicon-arrow-left');
	icon.parentNode.attributes['aria-label'].value += '.\nClick to swap.';
	wrap(icon, <a href={`/${getRepoURL()}/compare/${references.join('...')}`}></a>);
}

features.add({
	id: 'add-swap-branches-on-compare',
	dependencies: [
		features.isCompare
	],
	load: features.safeOnAjaxedPages,
	init
});
