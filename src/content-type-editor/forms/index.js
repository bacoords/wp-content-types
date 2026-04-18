/**
 * Form layout configurations for DataForm
 */
import { __ } from '@wordpress/i18n';

/**
 * Form configuration for the sidebar settings panel.
 */
export const SIDEBAR_SETTINGS_FORM = {
	fields: [ 'title', 'slug', 'public' ],
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
			children: [ 'rest_base' ],
		},
		{
			id: 'menu',
			label: __( 'Admin Menu', 'wp-content-types' ),
			layout: { type: 'card' },
			children: [ 'menu_icon', 'menu_position' ],
		},
		{
			id: 'discussion',
			label: __( 'Discussion', 'wp-content-types' ),
			layout: { type: 'card' },
			children: [ 'supports_comments' ],
		}
	);

	return { fields: cards };
}
