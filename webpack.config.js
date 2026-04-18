const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		'content-types': './src/content-types/index.js',
		'content-type-editor': './src/content-type-editor/index.js',
		'post-editor': './src/post-editor/index.js',
		editor: './src/editor/index.js',
	},
};
