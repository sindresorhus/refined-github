import {h} from 'dom-chef';
import select from 'select-dom';
import {getRepoURL} from '../libs/page-detect';

export default function () {
	const repoURL = getRepoURL();
	const branchName = select('.head-ref').textContent.split(':').pop();

	for (const file of select.all('.file-header')) {
		const fileName = select('.file-info a', file).title;
		const url = `/${repoURL}/delete/${branchName}/${fileName}`;
		select('.BtnGroup', file).prepend(
			<a
				href={url}
				className="btn btn-sm tooltipped tooltipped-s BtnGroup-item"
				aria-label="Delete this file from the pull request">
				Delete
			</a>
		);
	}
}
