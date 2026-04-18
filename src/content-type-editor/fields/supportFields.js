/**
 * Support Fields Configuration
 *
 * Defines post type support features as pseudo-fields for display in the Fields tab.
 */
import { __ } from '@wordpress/i18n';

/**
 * Support fields displayed as pseudo-fields in the Fields tab.
 * These represent WordPress post type supports.
 */
export const SUPPORT_FIELDS = [
	{
		_id: '__support_title',
		key: 'title',
		label: __( 'Title', 'wp-content-types' ),
		supportKey: 'title',
		icon: 'heading',
		isBuiltIn: true,
	},
	{
		_id: '__support_author',
		key: 'author',
		label: __( 'Author', 'wp-content-types' ),
		supportKey: 'author',
		icon: 'admin-users',
		isBuiltIn: true,
	},
	{
		_id: '__support_thumbnail',
		key: 'thumbnail',
		label: __( 'Featured Image', 'wp-content-types' ),
		supportKey: 'thumbnail',
		icon: 'format-image',
		isBuiltIn: true,
	},
	{
		_id: '__support_excerpt',
		key: 'excerpt',
		label: __( 'Excerpt', 'wp-content-types' ),
		supportKey: 'excerpt',
		icon: 'editor-justify',
		isBuiltIn: true,
	},
];

/**
 * Support features that are always enabled and not shown in UI.
 * These are required for the block editor and core functionality.
 */
export const ALWAYS_ENABLED_SUPPORTS = [ 'editor', 'custom-fields', 'revisions' ];
