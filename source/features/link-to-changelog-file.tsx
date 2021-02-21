import React from 'dom-chef';
import cache from 'webext-storage-cache';
import select from 'select-dom';
import {BookIcon} from '@primer/octicons-react';
import elementReady from 'element-ready';
import * as pageDetect from 'github-url-detection';

import features from '.';
import * as api from '../github-helpers/api';
import {buildRepoURL, getRepo} from '../github-helpers';

const getCacheKey = (): string => `changelog:${getRepo()!.nameWithOwner}`;
const changelogNames = ['changelog', 'news', 'changes', 'history', 'release', 'whatsnew'];

function getChangelogName(files: string[]): string | false {
	for (const file of files) {
		if (changelogNames.includes(files.toLowerCase().split('.', 1)[0])) {
			return file.name;
		}
	}

	return false;
}

function parseFromDom(): false {
	const files = select.all('[aria-labelledby="files"] .js-navigation-open').map(file => file.title!);
	void cache.set(getCacheKey(), getChangelogName(files));
	return false;
}

const getChangelogName = cache.function(async (): Promise<string | false> => {
	const {repository} = await api.v4(`
		repository() {
			object(expression: "HEAD:") {
				...on Tree {
					entries {
						name
					}
				}
			}
		}
	`);
	const files: string[] = repository.object.entries.map(file => file.name);
	return getChangelogName(files);
}, {
	cacheKey: getCacheKey
});

async function init(): Promise<void | false> {
	const changelog = await getChangelogName();
	if (!changelog) {
		return false;
	}

	(await elementReady('.subnav div', {waitForChildren: false}))!.after(
		<a
			className="btn ml-3 tooltipped tooltipped-n"
			aria-label={`View the ${changelog} file`}
			href={buildRepoURL('blob', 'HEAD', changelog)}
			style={{padding: '6px 16px'}}
			role="button"
		>
			<BookIcon className="text-blue mr-2"/>
			<span>Changelog</span>
		</a>
	);
}

void features.add(__filebasename, {
	include: [
		pageDetect.isReleasesOrTags
	],
	awaitDomReady: false,
	init
}, {
	include: [
		pageDetect.isRepoHome
	],
	init: parseFromDom
});
