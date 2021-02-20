import './clean-repo-sidebar.css';
import select from 'select-dom';
import elementReady from 'element-ready';
import * as pageDetect from 'github-url-detection';

import features from '.';

async function init(): Promise<void> {
	document.body.classList.add('rgh-clean-repo-sidebar');

	// Hide "Readme" link made unnecessary by toggle-files-button #3580
	(await elementReady('.repository-content .BorderGrid-row:first-child .muted-link[href="#readme"]', {waitForChildren: false}))?.parentElement!.remove();

	// Remove whitespace in license link to fix alignment of icons https://github.com/sindresorhus/refined-github/pull/3974#issuecomment-780213892
	const licenseLinkText = (await elementReady('.repository-content .BorderGrid-row:first-child [href*="/license" i]', {waitForChildren: false}))?.childNodes[2];
	if (licenseLinkText) {
		licenseLinkText.textContent = licenseLinkText.textContent!.trim();
	}

	// Clean up "Releases" section
	const sidebarReleases = await elementReady('.BorderGrid-cell a[href$="/releases"]', {waitForChildren: false});
	if (sidebarReleases) {
		const releasesSection = sidebarReleases.closest<HTMLElement>('.BorderGrid-cell')!;
		if (select.exists('.octicon-tag', releasesSection)) {
			// Collapse "Releases" section into previous section
			releasesSection.classList.add('border-0', 'pt-3');
			sidebarReleases.closest('.BorderGrid-row')!
				.previousElementSibling! // About’s .BorderGrid-row
				.firstElementChild! // About’s .BorderGrid-cell
				.classList.add('border-0', 'pb-0');

			// Hide header and footer
			for (const uselessInformation of select.all(':scope > :not(a)', releasesSection)) {
				uselessInformation.hidden = true;
			}

			// Align latest tag icon with the icons of other meta links
			const tagIcon = select('.octicon-tag:not(.text-green)', releasesSection)!;
			if (tagIcon) {
				tagIcon.classList.add('mr-2');
				// Remove whitespace node
				tagIcon.nextSibling!.remove();
			}
		} else {
			// Hide the whole section if there's no releases
			releasesSection.hidden = true;
		}
	}

	// Hide empty "Packages" section
	const packagesCounter = await elementReady('.BorderGrid-cell a[href*="/packages?"] .Counter', {waitForChildren: false})!;
	if (packagesCounter && packagesCounter.textContent === '0') {
		packagesCounter.closest<HTMLElement>('.BorderGrid-row')!.hidden = true;
	}

	// Hide empty meta if it’s not editable by the current user
	if (!pageDetect.canUserEditRepo()) {
		select('.repository-content .BorderGrid-cell > .text-italic')?.remove();
	}

	// Hide "Language" header
	const lastSidebarHeader = select('.repository-content .BorderGrid-row:last-of-type h2');
	if (lastSidebarHeader?.textContent === 'Languages') {
		lastSidebarHeader.hidden = true;
	}
}

void features.add(__filebasename, {
	include: [
		pageDetect.isRepoRoot
	],
	awaitDomReady: false,
	init
});
