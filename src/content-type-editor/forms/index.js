/**
 * Form layout configurations for DataForm
 */
import { __ } from '@wordpress/i18n';

/**
 * Form configuration for the Settings tab.
 */
export const SETTINGS_FORM = {
	fields: [
		{
			id: 'basic-settings',
			label: __( 'Basic Settings', 'wp-content-types' ),
			layout: { type: 'card' },
			children: [ 'title', 'slug', 'public' ],
		},
		{
			id: 'features',
			label: __( 'Features', 'wp-content-types' ),
			layout: { type: 'card' },
			children: [
				'supports_title',
				'supports_author',
				'supports_thumbnail',
				'supports_excerpt',
				'supports_comments',
				'supports_revisions',
			],
		},
	],
};

/**
 * Get form configuration for the Advanced tab.
 * Dynamically adjusts cards based on public visibility.
 *
 * @param {boolean} isPublic Whether the content type is public.
 * @return {Object} Form configuration object.
 */
export function getAdvancedForm( isPublic ) {
	const cards = [
		{
			id: 'visibility',
			label: __( 'Visibility', 'wp-content-types' ),
			layout: { type: 'card' },
			children: [
				'hierarchical',
				'publicly_queryable',
				'exclude_from_search',
			],
		},
	];

	if ( isPublic ) {
		cards.push( {
			id: 'urls',
			label: __( 'URLs & Permalinks', 'wp-content-types' ),
			layout: { type: 'card' },
			children: [ 'has_archive', 'rewrite_slug', 'with_front' ],
		} );
	}

	cards.push(
		{
			id: 'rest',
			label: __( 'REST API', 'wp-content-types' ),
			layout: { type: 'card' },
			children: [ 'show_in_rest', 'rest_base' ],
		},
		{
			id: 'menu',
			label: __( 'Admin Menu', 'wp-content-types' ),
			layout: { type: 'card' },
			children: [ 'menu_icon', 'menu_position' ],
		}
	);

	return { fields: cards };
}
