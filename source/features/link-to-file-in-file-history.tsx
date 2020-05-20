import React from 'dom-chef';
import select from 'select-dom';
import FileIcon from 'octicon/file.svg';
import * as pageDetect from 'github-url-detection';

import features from '.';
import parseRoute from '../github-helpers/parse-route';
import {groupSiblings} from '../github-helpers/group-buttons';

function init(): void {
	for (const rootLink of select.all<HTMLAnchorElement>('[aria-label="Browse the repository at this point in the history"]')) {
		// `rootLink.pathname` points to /tree/ but GitHub automatically redirects to /blob/ when the path is of a file
		rootLink.before(
			<a
				href={rootLink.pathname + '/' + parseRoute(location.pathname).filePath}
				className="btn btn-outline tooltipped tooltipped-sw"
				aria-label="See object at this point in the history"
			>
				<FileIcon/>
			</a>
		);

		groupSiblings(rootLink);
	}
}

features.add({
	id: __filebasename,
	description: 'Adds links to the file itself in a file’s commit list.',
	screenshot: 'https://user-images.githubusercontent.com/22439276/57195061-b88ddf00-6f6b-11e9-8ad9-13225d09266d.png'
}, {
	include: [
		pageDetect.isRepoCommitList
	],
	exclude: [
		// Probably looking at the base /commits/<branch> page, not a subfolder or file.
		() => !select('.breadcrumb')
	],
	init
});
