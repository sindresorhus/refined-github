import React from 'dom-chef';
import select from 'select-dom';
import delegate from 'delegate-it';
import ClippyIcon from 'octicon/clippy.svg';
import * as pageDetect from 'github-url-detection';

import features from '.';
import {getCurrentBranch, getPRRepositoryInfo} from '../github-helpers';

const isLocalPr = (): boolean => select('.user-select-contain.head-ref a')!.childElementCount === 1;

function checkoutOption(option: string): JSX.Element {
	const {user, repository} = getPRRepositoryInfo();
	return (
		<>
			{isLocalPr() || <p className="text-gray text-small my-1">{option}</p>}
			<div className="copyable-terminal">
				<div className="copyable-terminal-button">
					<clipboard-copy
						className="btn btn-sm zeroclipboard-button"
						role="button"
						for={`rgh-checkout-pr-${option}`}
						aria-label="Copy to clipboard"
						data-copy-feedback="Copied!"
					>
						<ClippyIcon/>
					</clipboard-copy>
				</div>
				<pre
					id={`rgh-checkout-pr-${option}`}
					className="copyable-terminal-content"
				>
					<span className="user-select-contain">
						{isLocalPr() || `git remote add ${user} ${option === 'HTTPS' ? `${location.origin}/${user}` : `git@${location.hostname}:`}/${repository}.git\n`}
						git fetch {user} {getCurrentBranch()!}{'\n'}
						git switch {isLocalPr() || `--track ${user}/`}{getCurrentBranch()}
					</span>
				</pre>
			</div>
		</>
	);
}

function handleMenuOpening({delegateTarget: dropdown}: delegate.Event): void {
	dropdown.classList.add('rgh-git-checkout'); // Mark this as processed
	const tabContainer = select('[action="/users/checkout-preference"]', dropdown)!.closest<HTMLElement>('tab-container')!;
	tabContainer.style.minWidth = '370px';
	select('.UnderlineNav-body', tabContainer)!.append(
		<button
			name="type"
			type="button"
			role="tab"
			aria-selected="false"
			className="UnderlineNav-item flex-1 btn-link"
		>
			Git Checkout
		</button>
	);

	const checkoutOptions = isLocalPr() ? ['local'] : ['HTTPS', 'SSH'];
	tabContainer.append(
		<div hidden role="tabpanel" className="p-3">
			<p className="text-gray text-small">
				Run in your project repository{isLocalPr() || ', pick either one'}
			</p>
			{checkoutOptions.map(checkoutOption)}
		</div>
	);
}

function init(): void {
	// `useCapture` required to be fired before GitHub's handlers
	delegate(document, '.gh-header-actions Details:not(.rgh-git-checkout)', 'toggle', handleMenuOpening, true);
}

void features.add({
	id: __filebasename,
	description: 'Adds copy-pastable git commands to checkout a PR.',
	screenshot: 'https://user-images.githubusercontent.com/16872793/96723392-8305cd00-137c-11eb-851b-71042dc0c45d.png'
}, {
	include: [
		pageDetect.isPR
	],
	exclude: [
		() => select.exists('#partial-discussion-header [title="Status: Merged"]')
	],
	init
});