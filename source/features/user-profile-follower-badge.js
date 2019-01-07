import {h} from 'dom-chef';
import select from 'select-dom';
import * as api from '../libs/api';
import features from '../libs/features';
import {getUsername} from '../libs/utils';
import {getCleanPathname} from '../libs/page-detect';

async function init() {
	const {status} = await api.v3(
		`users/${getCleanPathname()}/following/${getUsername()}`,
		{accept404: true}
	);

	if (status === 204) {
		select('.vcard-names-container.py-3.js-sticky.js-user-profile-sticky-fields').after(
			<div class="follower-badge">Follows you</div>
		);
	}
}

features.add({
	id: 'user-profile-follower-badge',
	dependencies: [
		features.and(
			features.isUserProfile,
			features.not(features.isOwnUserProfile)
		)
	],
	load: features.safeOnAjaxedPages,
	init
});
