import React from 'dom-chef';
import select from 'select-dom';
import cache from 'webext-storage-cache';
import * as pageDetect from 'github-url-detection';

import * as api from '../github-helpers/api';

import features from '.';

const getReadmePath = cache.function(
	async (owner: string, repository: string): Promise<string> => {
		const {name: readme} = await api.v3(
			`repos/${owner}/${repository}/readme`
		);
		return readme;
	}
);

async function init(): Promise<void> {
	const title = select(
		'#js-pjax-container > div.container-xl.px-3.px-md-4.px-lg-5 > div > div.flex-shrink-0.col-12.col-md-9.mb-4.mb-md-0 > div:nth-child(2) > div > div.Box.mt-4 > div > div > div'
	);
	if (title) {
		const {childNodes: titleNodes} = title;

		const owner = location.pathname.slice(1);
		const {innerText: repository} = titleNodes[3] as HTMLAnchorElement;

		const readme = await getReadmePath(owner, repository);

		titleNodes[5].replaceWith(
			<a
				href={`/${owner}/${repository}/blob/master/${readme.slice(
					0,
					-3
				)}.md`}
				className="no-underline link-gray-dark readme-text"
			>
				readme
			</a>
		);
		(select('.readme-text') as NonNullable<ReturnType<typeof select>>).append(
			titleNodes[6]
		);
	}
}

void features.add(
	{
		id: __filebasename,
		description:
			'Linkify the readme text on profile pages and respect the original capitalisation.',
		screenshot:
			'https://user-images.githubusercontent.com/29491356/89711998-094b7d80-d9e2-11ea-8ae8-2957960d2308.png'
	},
	{
		include: [pageDetect.isUserProfile],
		repeatOnAjax: false,
		init
	}
);
