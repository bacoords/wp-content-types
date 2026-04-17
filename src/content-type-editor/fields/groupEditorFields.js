/**
 * Field definitions for editing a field group via DataForm
 */
import { __ } from '@wordpress/i18n';

/**
 * Get field definitions for the group editor.
 *
 * @return {Array} Array of field definitions.
 */
export function getGroupEditorFields() {
	return [
		{
			id: 'label',
			type: 'text',
			label: __( 'Label', 'wp-content-types' ),
			description: __( 'The display name for this group.', 'wp-content-types' ),
			placeholder: __( 'e.g. Product Details', 'wp-content-types' ),
			isValid: { required: true },
		},
		{
			id: 'key',
			type: 'text',
			label: __( 'Key', 'wp-content-types' ),
			description: __( 'Unique identifier for this group. Auto-generated from label.', 'wp-content-types' ),
			placeholder: __( 'e.g. product_details', 'wp-content-types' ),
			isValid: {
				required: true,
				maxLength: 32,
				pattern: '^[a-z0-9_]+$',
			},
		},
		{
			id: 'description',
			type: 'text',
			label: __( 'Description', 'wp-content-types' ),
			description: __( 'Optional description shown below the group header.', 'wp-content-types' ),
			placeholder: __( 'e.g. Enter product specifications and pricing', 'wp-content-types' ),
		},
		{
			id: 'position',
			type: 'text',
			label: __( 'Position', 'wp-content-types' ),
			description: __( 'Sort order for this group. Lower numbers appear first.', 'wp-content-types' ),
		},
	];
}
