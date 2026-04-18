/**
 * Form layout configurations for field editor
 */
import { __ } from '@wordpress/i18n';

/**
 * Get form layout for the field editor.
 *
 * @param {string} fieldType Current field type for conditional cards.
 * @return {Object} Form configuration object.
 */
export function getFieldEditorForm( fieldType ) {
	const cards = [
		{
			id: 'basic',
			label: __( 'Basic Settings', 'wp-content-types' ),
			layout: { type: 'regular' },
			children: [ 'label', 'key', 'type' ],
		},
		{
			id: 'validation',
			label: __( 'Validation', 'wp-content-types' ),
			layout: { type: 'regular' },
			children: [ 'required' ],
		},
		{
			id: 'display',
			label: __( 'Display', 'wp-content-types' ),
			layout: { type: 'regular' },
			children: [ 'description', 'placeholder' ],
		},
	];

	// Add type-specific card for select/radio options
	if ( [ 'select', 'radio' ].includes( fieldType ) ) {
		cards.push( {
			id: 'options',
			label: __( 'Options', 'wp-content-types' ),
			layout: { type: 'regular' },
			children: [ 'options' ],
		} );
	}

	// Add type-specific card for number constraints
	if ( fieldType === 'number' ) {
		cards.push( {
			id: 'constraints',
			label: __( 'Constraints', 'wp-content-types' ),
			layout: { type: 'regular' },
			children: [ 'config_min', 'config_max', 'config_step' ],
		} );
	}

	// Add type-specific card for textarea
	if ( fieldType === 'textarea' ) {
		cards.push( {
			id: 'textarea-config',
			label: __( 'Textarea Settings', 'wp-content-types' ),
			layout: { type: 'regular' },
			children: [ 'config_rows' ],
		} );
	}

	return { fields: cards };
}
