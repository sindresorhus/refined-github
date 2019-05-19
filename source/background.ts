import OptionsSync from 'webext-options-sync';
import {addContextMenu} from 'webext-domain-permission-toggle';
import {addToFutureTabs} from 'webext-dynamic-content-scripts';
import './libs/cache';

const defaults: AnyObject = {
	customCSS: '',
	personalToken: '',
	logging: false
};


for (const feature of window.collectFeatures.keys()) {
	defaults[`feature:${feature}`] = true;
}

new OptionsSync().define({
	defaults,
	migrations: [
		// Drop this migration after June 20
		options => {
			if (typeof options.disabledFeatures !== 'string') {
				return;
			}

			for (const feature of options.disabledFeatures.split(/s+/)) {
				options[`feature:${feature}`] = false;
			}
		},

		// To rename another feature, duplicate this line or replace it when it's older than 1 month
		featureWasRenamed.bind(null, 'fix-squash-and-merge-title', 'sync-pr-commit-title'), // Merged on April 22

		// Removed features will be automatically removed from the options as well
		OptionsSync.migrations.removeUnused
	]
});

browser.runtime.onMessage.addListener(async message => {
	if (!message || message.action !== 'openAllInTabs') {
		return;
	}

	const [currentTab] = await browser.tabs.query({currentWindow: true, active: true});
	for (const [i, url] of message.urls.entries()) {
		browser.tabs.create({
			url,
			index: currentTab.index + i + 1,
			active: false
		});
	}
});

// Give the browserAction a reason to exist other than "Enable RGH on this domain"
browser.browserAction.onClicked.addListener(() => {
	browser.tabs.create({
		url: 'https://github.com'
	});
});

browser.runtime.onInstalled.addListener(async ({reason}) => {
	// Only notify on install
	if (reason === 'install') {
		const self = await browser.management.getSelf();
		if (self && self.installType === 'development') {
			return;
		}

		browser.tabs.create({
			url: 'https://github.com/sindresorhus/refined-github/issues/1137',
			active: false
		});
	}
});

// GitHub Enterprise support
addToFutureTabs();
addContextMenu();

function featureWasRenamed(from: string, to: string, options: typeof defaults) {
	if (typeof options[`feature:${from}`] === 'boolean') {
		options[`feature:${to}`] = options[`feature:${from}`];
	}
}
