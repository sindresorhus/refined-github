import select from 'select-dom';
import {h} from 'dom-chef';
import * as pageDetect from '../libs/page-detect';

const repoURL = pageDetect.getRepoURL();

export default function () {
	const findBranch = select('.head-ref').innerText;
	const branchName = findBranch.includes(':') ? findBranch.split(':')[1] : findBranch;

	const filesInfo = select.all('.file-info');
	const generateURL = filesInfo.map(file => 'https://github.com/' + repoURL + '/delete/' + branchName + '/' + file.children[1].title);

	const fileActionContainers = select.all('div.BtnGroup');
	fileActionContainers.map((container, index) => {
		if (index !== 0) {
			container.prepend(<a href={generateURL[index - 1]} className="btn btn-sm tooltipped tooltipped-s BtnGroup-item" aria-label="Delete this file from the pull request">Delete</a>);
		}
		return container;
	});
}
