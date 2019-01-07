import select from 'select-dom';
import features from '../libs/features';

function init() {
	for (const a of select.all('a[href$="/milestones"], a[href*="/milestones?"]')) {
		const url = new URL(a.href);
		// Only if they aren't explicitly sorted differently
		if (!url.searchParams.get('direction') && !url.searchParams.get('sort')) {
			url.searchParams.set('direction', 'asc');
			url.searchParams.set('sort', 'due_date');
			a.href = url;
		}
	}
}

features.add({
	id: 'sort-milestones-by-closest-due-date',
	dependencies: [
		features.isRepo
	],
	load: features.safeOnAjaxedPages,
	init
});
