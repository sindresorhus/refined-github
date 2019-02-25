import select from 'select-dom';
import features from '../libs/features';

// When navigating with next/previous in review mode, preserve whitespace option.
function initi() : FeatureInit {
	const navLinks = select.all<HTMLAnchorElement>('.commit > .BtnGroup.float-right > a.BtnGroup-item');
	if (navLinks.length === 0) {
		return false;
	}

	const searchParams = new URLSearchParams(location.href);
	const hidingWhitespace = searchParams.get('w') === '1';

	if (hidingWhitespace) {
		for (const a of navLinks) {
			const linkUrl = new URL(a.href);
			linkUrl.searchParams.set('w', '1');
			a.href = String(linkUrl);
		}
	}
}

features.add({
	id: 'preserve-whitespace-option-in-nav',
	include: [
		features.isRepo
	],
	load: features.onAjaxedPages,
	init
});
