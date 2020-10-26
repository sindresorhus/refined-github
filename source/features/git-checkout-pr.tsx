import React from 'dom-chef';
import select from 'select-dom';
import delegate from 'delegate-it';
import ClippyIcon from 'octicon/clippy.svg';
import * as pageDetect from 'github-url-detection';

import features from '.';
import {getCurrentBranch, getPRRepositoryInfo, getRepositoryInfo, getUsername} from '../github-helpers';

const connectionType: Record<string, string> = {
	HTTPS: `${location.origin}/`,
	SSH: `git@${location.hostname}:`
};

// Logic found on https://github.com/sindresorhus/refined-github/pull/3596#discussion_r511546864
function getRemoteName(): string | undefined {
	const author = getPRRepositoryInfo().owner;
	if (author === getUsername()) {
		return; // `origin`, don't add remote
	}

	if (author !== getRepositoryInfo().owner) {
		return author;
	}

	if (select('[aria-label="Edit Pull Request title"]')) {
		return; // It's a collaborator, it's likely to be `origin`
	}

	return 'upstream';
}

function checkoutOption(option: string): JSX.Element {
	const [, user, repository] = select<HTMLAnchorElement>('.commit-ref.head-ref a')!.pathname.split('/', 3);
	const isLocalPR = option === 'local';
	return (
		<>
			{isLocalPR || <p className="text-gray text-small my-1">{option}</p>}
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
						{isLocalPR || `git remote add ${user} ${connectionType[option]}${user}/${repository}.git\n`}
						git fetch {isLocalPR ? getRemoteName() ?? 'origin' : user} {getCurrentBranch()}{'\n'}
						git switch {isLocalPR || `--track ${user}/`}{getCurrentBranch()}
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

	tabContainer.append(
		<div hidden role="tabpanel" className="p-3">
			<p className="text-gray text-small">
				Run in your project repository{!getRemoteName() || ', pick either one'}
			</p>
			{!getRemoteName() ? checkoutOption('local') : [checkoutOption('HTTPS'), checkoutOption('SSH')]}
		</div>
	);
}

function init(): void {
	// `useCapture` required to be fired before GitHub's handlers
	delegate(document, '.gh-header-actions Details:not(.rgh-git-checkout)', 'toggle', handleMenuOpening, true);
}

void features.add(__filebasename, {
	include: [
		pageDetect.isPR
	],
	exclude: [
		() => select.exists('#partial-discussion-header [title="Status: Merged"]')
	],
	init
});
