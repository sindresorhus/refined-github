import React from 'dom-chef';
import select from 'select-dom';
import * as api from '../libs/api';
import timeAgo from '../libs/time-ago';
import features from '../libs/features';
import * as icons from '../libs/icons';
import {getRepoGQL} from '../libs/utils';

async function getRepoCreationDate(): Promise<Date> {
	const {repository} = await api.v4(`
		repository(${getRepoGQL()}) {
			createdAt
		}
	`);

	return new Date(repository.createdAt);
}

async function init(): Promise<void> {
	const date = await getRepoCreationDate();
	const {value, unit} = timeAgo(date);

	const element = (
		<li title={`Repository created on ${date.toDateString()}`} className="text-gray">
			{icons.repo()}
			<span className="num text-emphasized">{value}</span> {unit} old
		</li>
	);

	select('.numbers-summary li:last-child')!.before(element);
}

features.add({
	id: __featureName__,
	description: 'Adds the age of the repository to the stats/numbers bar',
	screenshot: 'https://user-images.githubusercontent.com/3848317/69256318-95e6af00-0bb9-11ea-84c8-c6996d39da80.png',
	include: [
		features.isRepoRoot
	],
	init
});
