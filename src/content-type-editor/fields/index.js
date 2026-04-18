/**
 * Field definitions for DataForm
 */
import { __ } from '@wordpress/i18n';

/**
 * Get field definitions for the Advanced tab.
 *
 * @param {string} slug Current slug value for placeholder text.
 * @return {Array} Array of field definitions.
 */
export function getAdvancedFields( slug ) {
	return [
		// Editor field
		{
			id: 'use_block_editor',
			type: 'boolean',
			label: __( 'Use Block Editor', 'wp-content-types' ),
			description: __(
				'Enable the full block editor. When disabled, only custom fields are shown.',
				'wp-content-types'
			),
		},

		// Visibility fields
		{
			id: 'hierarchical',
			type: 'boolean',
			label: __( 'Hierarchical', 'wp-content-types' ),
			description: __(
				'Allow parent/child relationships like pages.',
				'wp-content-types'
			),
		},
		{
			id: 'publicly_queryable',
			type: 'boolean',
			label: __( 'Publicly Queryable', 'wp-content-types' ),
			description: __(
				'Allow queries on the front end.',
				'wp-content-types'
			),
			isVisible: ( item ) => item.public,
		},
		{
			id: 'exclude_from_search',
			type: 'boolean',
			label: __( 'Exclude from Search', 'wp-content-types' ),
			description: __( 'Hide from search results.', 'wp-content-types' ),
			isVisible: ( item ) => item.public,
		},

		// URLs & Permalinks fields
		{
			id: 'has_archive',
			type: 'boolean',
			label: __( 'Has Archive', 'wp-content-types' ),
			description: __(
				'Enable archive page for this content type.',
				'wp-content-types'
			),
			isVisible: ( item ) => item.public,
		},
		{
			id: 'rewrite_slug',
			type: 'text',
			label: __( 'Rewrite Slug', 'wp-content-types' ),
			description: __(
				'Custom URL slug. Leave empty to use the post type slug.',
				'wp-content-types'
			),
			placeholder:
				slug || __( 'Uses post type slug', 'wp-content-types' ),
			isVisible: ( item ) => item.public,
		},
		{
			id: 'with_front',
			type: 'boolean',
			label: __( 'With Front', 'wp-content-types' ),
			description: __(
				'Prepend the permalink structure front base.',
				'wp-content-types'
			),
			isVisible: ( item ) => item.public,
		},

		// REST API fields
		{
			id: 'rest_base',
			type: 'text',
			label: __( 'REST Base', 'wp-content-types' ),
			description: __(
				'Custom REST API base. Leave empty to use the post type slug.',
				'wp-content-types'
			),
			placeholder:
				slug || __( 'Uses post type slug', 'wp-content-types' ),
		},

		// Admin Menu fields
		{
			id: 'menu_icon',
			type: 'text',
			label: __( 'Menu Icon', 'wp-content-types' ),
			placeholder: 'dashicons-database',
		},
		{
			id: 'menu_position',
			type: 'integer',
			label: __( 'Menu Position', 'wp-content-types' ),
			isValid: { min: 0, max: 100 },
		},

		// Discussion field
		{
			id: 'supports_comments',
			type: 'boolean',
			label: __( 'Allow Comments', 'wp-content-types' ),
			description: __(
				'Enable comments for this content type.',
				'wp-content-types'
			),
		},
	];
}
