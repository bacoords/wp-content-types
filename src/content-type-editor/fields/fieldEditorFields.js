/**
 * Field definitions for editing a single field via DataForm
 */
import { __ } from '@wordpress/i18n';

/**
 * Available field type options.
 */
export const FIELD_TYPE_OPTIONS = [
	{ value: 'text', label: __( 'Text', 'wp-content-types' ) },
	{ value: 'textarea', label: __( 'Textarea', 'wp-content-types' ) },
	{ value: 'number', label: __( 'Number', 'wp-content-types' ) },
	{ value: 'email', label: __( 'Email', 'wp-content-types' ) },
	{ value: 'url', label: __( 'URL', 'wp-content-types' ) },
	{ value: 'date', label: __( 'Date', 'wp-content-types' ) },
	{ value: 'select', label: __( 'Select', 'wp-content-types' ) },
	{ value: 'radio', label: __( 'Radio', 'wp-content-types' ) },
	{ value: 'checkbox', label: __( 'Checkbox', 'wp-content-types' ) },
];

/**
 * Get field definitions for the field editor.
 *
 * @return {Array} Array of field definitions.
 */
export function getFieldEditorFields() {
	return [
		// Basic Settings
		{
			id: 'label',
			type: 'text',
			label: __( 'Label', 'wp-content-types' ),
			description: __( 'The display label for this field.', 'wp-content-types' ),
			placeholder: __( 'e.g. Author Name', 'wp-content-types' ),
			isValid: { required: true },
		},
		{
			id: 'key',
			type: 'text',
			label: __( 'Key', 'wp-content-types' ),
			description: __( 'Unique identifier for this field. Auto-generated from label.', 'wp-content-types' ),
			placeholder: __( 'e.g. author_name', 'wp-content-types' ),
			isValid: {
				required: true,
				maxLength: 32,
				pattern: '^[a-z0-9_]+$',
			},
		},
		{
			id: 'type',
			type: 'select',
			label: __( 'Field Type', 'wp-content-types' ),
			elements: FIELD_TYPE_OPTIONS,
		},

		// Validation
		{
			id: 'required',
			type: 'boolean',
			label: __( 'Required', 'wp-content-types' ),
			description: __( 'Make this field mandatory.', 'wp-content-types' ),
		},

		// Display
		{
			id: 'description',
			type: 'text',
			label: __( 'Description', 'wp-content-types' ),
			description: __( 'Help text shown below the field.', 'wp-content-types' ),
			placeholder: __( 'e.g. Enter the full name of the author', 'wp-content-types' ),
		},
		{
			id: 'placeholder',
			type: 'text',
			label: __( 'Placeholder', 'wp-content-types' ),
			description: __( 'Placeholder text shown when field is empty.', 'wp-content-types' ),
			isVisible: ( item ) => [ 'text', 'textarea', 'number', 'email', 'url' ].includes( item.type ),
		},

		// Type-specific: Options (for select/radio)
		{
			id: 'options',
			type: 'text',
			label: __( 'Options', 'wp-content-types' ),
			description: __( 'One option per line. Format: value|Label (e.g. draft|Draft)', 'wp-content-types' ),
			placeholder: 'option1|Option One\noption2|Option Two',
		},

		// Type-specific: Number constraints
		{
			id: 'config_min',
			type: 'text',
			label: __( 'Minimum Value', 'wp-content-types' ),
		},
		{
			id: 'config_max',
			type: 'text',
			label: __( 'Maximum Value', 'wp-content-types' ),
		},
		{
			id: 'config_step',
			type: 'text',
			label: __( 'Step', 'wp-content-types' ),
			description: __( 'Increment/decrement step value.', 'wp-content-types' ),
		},

		// Type-specific: Textarea rows
		{
			id: 'config_rows',
			type: 'text',
			label: __( 'Rows', 'wp-content-types' ),
			description: __( 'Number of visible text rows.', 'wp-content-types' ),
		},
	];
}
