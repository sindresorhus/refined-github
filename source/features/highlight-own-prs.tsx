import select from 'select-dom';
import features from '../libs/features';
import {getUsername} from '../libs/utils';

function init() {
	for (const openedByEl of select.all(`.opened-by a[href*="${CSS.escape(getUsername())}"]`)) {
		openedByEl.style.fontWeight = 'bold';
	}
}

features.add({
	id: 'highlight-own-prs',
	include: [
		features.isPRList
	],
	load: features.onAjaxedPages,
	init
});
