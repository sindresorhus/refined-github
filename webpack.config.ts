/// <reference types="./source/globals" />

import path from 'path';
import stripIndent from 'strip-indent';
import {readdirSync, readFileSync} from 'fs';
import webpack, {Configuration} from 'webpack';
import SizePlugin from 'size-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';

function parseFeatureDetails(id: FeatureName): FeatureMeta {
	const content = readFileSync(`source/features/${id}.tsx`, {encoding: 'utf-8'});
	const fields = ['disabled', 'description', 'screenshot'] as const;

	const feature: Partial<FeatureMeta> = {id};
	for (const field of fields) {
		const value = new RegExp(`\n\t${field}: '([^\\n]+)'`).exec(content)?.[1];
		if (value) {
			const validValue = value.trim().replace(/\\'/g, '’'); // Catch trailing spaces and incorrect apostrophes
			if (value !== validValue) {
				throw new Error(stripIndent(`
					❌ Invalid characters found in \`${id}\`. Apply this patch:

					- ${field}: '${value}'
					+ ${field}: '${validValue}'
				`));
			}

			feature[field] = value.replace(/\\\\/g, '\\');
		}
	}

	return feature as FeatureMeta;
}

function getFeatures(): FeatureName[] {
	return readdirSync(path.join(__dirname, 'source/features'))
		.filter(filename => filename.endsWith('.tsx'))
		.map(filename => filename.replace('.tsx', '') as FeatureName);
}

const config: Configuration = {
	devtool: 'source-map',
	stats: {
		all: false,
		errors: true,
		builtAt: true
	},
	entry: {
		'refined-github': './source/refined-github',
		background: './source/background',
		options: './source/options',
		'resolve-conflicts': './source/resolve-conflicts'
	},
	output: {
		path: path.join(__dirname, 'distribution'),
		filename: '[name].js'
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: [
					{
						loader: 'ts-loader',
						query: {
							compilerOptions: {
								// Enables ModuleConcatenation. It must be in here to avoid conflict with ts-node
								module: 'es2015'
							},

							// Make compilation faster with `fork-ts-checker-webpack-plugin`
							transpileOnly: true
						}
					}
				],
				exclude: /node_modules/
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader'
				]
			},
			{
				test: /\.svg$/i,
				use: [
					// Converts SVG files into a `export default () => actualDomElement`
					path.resolve(__dirname, 'octicon-svg-loader.ts')
				]
			}
		]
	},
	plugins: [
		new ForkTsCheckerWebpackPlugin(),
		new webpack.DefinePlugin({
			// Passing `true` as the second argument makes these values dynamic — so every file change will update their value.
			__featuresOptionDefaults__: webpack.DefinePlugin.runtimeValue(() => {
				return JSON.stringify(getFeatures().reduce((defaults, feature) => {
					defaults[`feature:${feature}`] = true;
					return defaults;
				}, {} as AnyObject));
				// TODO: unignore after https://github.com/DefinitelyTyped/DefinitelyTyped/pull/42036
				// @ts-ignore
			}, true),

			__featuresMeta__: webpack.DefinePlugin.runtimeValue(() => {
				return JSON.stringify(getFeatures().map(parseFeatureDetails));
				// @ts-ignore
			}, true),

			__featureName__: webpack.DefinePlugin.runtimeValue(({module}) => {
				// @ts-ignore
				return JSON.stringify(path.basename(module.resource, '.tsx'));
			})
		}),
		new MiniCssExtractPlugin({
			filename: '[name].css'
		}),
		new SizePlugin({
			writeFile: false
		}),
		new CopyWebpackPlugin([
			{
				from: '*',
				context: 'source',
				ignore: [
					'*.js',
					'*.ts',
					'*.tsx',
					'*.css'
				]
			},
			{
				from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'
			}
		])
	],
	resolve: {
		alias: {
			octicon: '@primer/octicons/build/svg'
		},
		extensions: [
			'.tsx',
			'.ts',
			'.js'
		]
	},
	optimization: {
		// Without this, function names will be garbled and enableFeature won't work
		concatenateModules: true,

		// Automatically enabled on production; keeps it somewhat readable for AMO reviewers
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {
					mangle: false,
					compress: false,
					output: {
						beautify: true,
						indent_level: 2
					}
				}
			})
		]
	}
};

export default config;
