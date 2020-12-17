import './clean-pinned-issues.css';
import * as pageDetect from 'github-url-detection';

import features from '.';

void features.addCssFeature(__filebasename, {
	include: [
		pageDetect.isRepoIssueList
	]
});
