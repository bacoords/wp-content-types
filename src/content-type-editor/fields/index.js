/**
 * Field definitions for DataForm
 */
import { __ } from '@wordpress/i18n';

/**
 * Individual support feature field IDs.
 */
export const SUPPORT_FIELD_IDS = [
	'supports_title',
	'supports_author',
	'supports_thumbnail',
	'supports_excerpt',
	'supports_comments',
	'supports_revisions',
];

/**
 * Get field definitions for the Settings tab.
 *
 * @param {string} slug Current slug value for placeholder text.
 * @return {Array} Array of field definitions.
 */
export function getSettingsFields( slug ) {
	return [
		{
			id: 'title',
			type: 'text',
			label: __( 'Name', 'wp-content-types' ),
			description: __(
				'The singular name for this content type.',
				'wp-content-types'
			),
			placeholder: __( 'e.g. Book', 'wp-content-types' ),
			isValid: { required: true },
		},
		{
			id: 'slug',
			type: 'text',
			label: __( 'Slug', 'wp-content-types' ),
			description: __(
				'Max 20 characters, lowercase letters, numbers, underscores.',
				'wp-content-types'
			),
			placeholder: __( 'e.g. book', 'wp-content-types' ),
			isValid: {
				required: true,
				maxLength: 20,
				pattern: '^[a-z0-9_]+$',
			},
		},
		{
			id: 'public',
			type: 'boolean',
			label: __( 'Public', 'wp-content-types' ),
			description: __(
				'Makes this content type visible on the front end.',
				'wp-content-types'
			),
		},
		{
			id: 'supports_title',
			type: 'boolean',
			label: __( 'Title', 'wp-content-types' ),
		},
		{
			id: 'supports_author',
			type: 'boolean',
			label: __( 'Author', 'wp-content-types' ),
		},
		{
			id: 'supports_thumbnail',
			type: 'boolean',
			label: __( 'Featured Image', 'wp-content-types' ),
		},
		{
			id: 'supports_excerpt',
			type: 'boolean',
			label: __( 'Excerpt', 'wp-content-types' ),
		},
		{
			id: 'supports_comments',
			type: 'boolean',
			label: __( 'Comments', 'wp-content-types' ),
		},
		{
			id: 'supports_revisions',
			type: 'boolean',
			label: __( 'Revisions', 'wp-content-types' ),
		},
	];
}

/**
 * Get field definitions for the Advanced tab.
 *
 * @param {string} slug Current slug value for placeholder text.
 * @return {Array} Array of field definitions.
 */
export function getAdvancedFields( slug ) {
	return [
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
			id: 'show_in_rest',
			type: 'boolean',
			label: __( 'Show in REST API', 'wp-content-types' ),
			description: __(
				'Required for block editor support.',
				'wp-content-types'
			),
		},
		{
			id: 'rest_base',
			type: 'text',
			label: __( 'REST Base', 'wp-content-types' ),
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
	];
}
