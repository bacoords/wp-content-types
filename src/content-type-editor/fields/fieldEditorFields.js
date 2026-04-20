/**
 * Field definitions for editing a single field via DataForm
 */
import { __ } from '@wordpress/i18n';
import {
	typography,
	paragraph,
	postAuthor,
	link,
	formatListNumbered,
	calendar,
	menu,
	button,
	check,
	image,
} from '@wordpress/icons';

/**
 * Single source of truth for all field types.
 * Each type includes: label, icon, and category for grouping.
 */
export const FIELD_TYPES = {
	text: {
		label: __( 'Text', 'wp-content-types' ),
		icon: typography,
		category: 'text',
	},
	textarea: {
		label: __( 'Textarea', 'wp-content-types' ),
		icon: paragraph,
		category: 'text',
	},
	email: {
		label: __( 'Email', 'wp-content-types' ),
		icon: postAuthor,
		category: 'text',
	},
	url: {
		label: __( 'URL', 'wp-content-types' ),
		icon: link,
		category: 'text',
	},
	number: {
		label: __( 'Number', 'wp-content-types' ),
		icon: formatListNumbered,
		category: 'data',
	},
	date: {
		label: __( 'Date', 'wp-content-types' ),
		icon: calendar,
		category: 'data',
	},
	select: {
		label: __( 'Dropdown', 'wp-content-types' ),
		icon: menu,
		category: 'choice',
	},
	radio: {
		label: __( 'Radio', 'wp-content-types' ),
		icon: button,
		category: 'choice',
	},
	checkbox: {
		label: __( 'Checkbox', 'wp-content-types' ),
		icon: check,
		category: 'choice',
	},
	image: {
		label: __( 'Image', 'wp-content-types' ),
		icon: image,
		category: 'media',
	},
};

/**
 * Category definitions for grouping field types in the picker.
 */
export const FIELD_CATEGORIES = {
	text: { label: __( 'Text', 'wp-content-types' ) },
	data: { label: __( 'Number & Date', 'wp-content-types' ) },
	choice: { label: __( 'Choice', 'wp-content-types' ) },
	media: { label: __( 'Media', 'wp-content-types' ) },
};

/**
 * Get the label for a field type.
 *
 * @param {string} type - The field type key.
 * @return {string} The localized label, or the type key if not found.
 */
export function getFieldTypeLabel( type ) {
	return FIELD_TYPES[ type ]?.label || type;
}

/**
 * Get field types grouped by category for the picker UI.
 *
 * @return {Array} Array of category objects with their types.
 */
export function getGroupedFieldTypes() {
	return Object.entries( FIELD_CATEGORIES ).map(
		( [ categoryId, category ] ) => ( {
			id: categoryId,
			label: category.label,
			types: Object.entries( FIELD_TYPES )
				.filter( ( [ , config ] ) => config.category === categoryId )
				.map( ( [ id, config ] ) => ( { id, ...config } ) ),
		} )
	);
}

/**
 * Available field type options (backward compatible format).
 */
export const FIELD_TYPE_OPTIONS = Object.entries( FIELD_TYPES ).map(
	( [ value, config ] ) => ( { value, label: config.label } )
);

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
			description: __(
				'The display label for this field.',
				'wp-content-types'
			),
			placeholder: __( 'e.g. Author Name', 'wp-content-types' ),
			isValid: { required: true },
		},
		{
			id: 'key',
			type: 'text',
			label: __( 'Key', 'wp-content-types' ),
			description: __(
				'Unique identifier for this field. Auto-generated from label.',
				'wp-content-types'
			),
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
			description: __(
				'Help text shown below the field.',
				'wp-content-types'
			),
			placeholder: __(
				'e.g. Enter the full name of the author',
				'wp-content-types'
			),
		},
		{
			id: 'placeholder',
			type: 'text',
			label: __( 'Placeholder', 'wp-content-types' ),
			description: __(
				'Placeholder text shown when field is empty.',
				'wp-content-types'
			),
			isVisible: ( item ) =>
				[ 'text', 'textarea', 'number', 'email', 'url' ].includes(
					item.type
				),
		},

		// Type-specific: Options (for select/radio)
		{
			id: 'options',
			type: 'text',
			label: __( 'Options', 'wp-content-types' ),
			description: __(
				'One option per line. Format: value|Label (e.g. draft|Draft)',
				'wp-content-types'
			),
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
			description: __(
				'Increment/decrement step value.',
				'wp-content-types'
			),
		},

		// Type-specific: Textarea rows
		{
			id: 'config_rows',
			type: 'text',
			label: __( 'Rows', 'wp-content-types' ),
			description: __(
				'Number of visible text rows.',
				'wp-content-types'
			),
		},
	];
}
