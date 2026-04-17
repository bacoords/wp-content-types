/**
 * Field Item Component
 *
 * Displays a single field with its label, type badge, required status,
 * preview, and description.
 */
import { __ } from '@wordpress/i18n';
import {
	TextFieldPreview,
	TextareaFieldPreview,
	NumberFieldPreview,
	EmailFieldPreview,
	UrlFieldPreview,
	DateFieldPreview,
	SelectFieldPreview,
	RadioFieldPreview,
	CheckboxFieldPreview,
} from './field-previews';

const FIELD_TYPE_LABELS = {
	text: __( 'text', 'wp-content-types' ),
	textarea: __( 'textarea', 'wp-content-types' ),
	number: __( 'number', 'wp-content-types' ),
	email: __( 'email', 'wp-content-types' ),
	url: __( 'url', 'wp-content-types' ),
	date: __( 'date', 'wp-content-types' ),
	select: __( 'select', 'wp-content-types' ),
	radio: __( 'radio', 'wp-content-types' ),
	checkbox: __( 'checkbox', 'wp-content-types' ),
};

function getFieldPreview( field ) {
	switch ( field.type ) {
		case 'text':
			return <TextFieldPreview field={ field } />;
		case 'textarea':
			return <TextareaFieldPreview field={ field } />;
		case 'number':
			return <NumberFieldPreview field={ field } />;
		case 'email':
			return <EmailFieldPreview field={ field } />;
		case 'url':
			return <UrlFieldPreview field={ field } />;
		case 'date':
			return <DateFieldPreview field={ field } />;
		case 'select':
			return <SelectFieldPreview field={ field } />;
		case 'radio':
			return <RadioFieldPreview field={ field } />;
		case 'checkbox':
			return <CheckboxFieldPreview field={ field } />;
		default:
			return (
				<div className="wpct-field-item__unknown">
					{ __( 'Unknown field type', 'wp-content-types' ) }
				</div>
			);
	}
}

export default function FieldItem( { field } ) {
	const typeLabel = FIELD_TYPE_LABELS[ field.type ] || field.type;
	const isRequired = field.required === true;
	const isCheckbox = field.type === 'checkbox';

	return (
		<div className="wpct-field-item">
			<div className="wpct-field-item__header">
				<span className="wpct-field-item__label">
					{ field.label }
				</span>
				<span className="wpct-field-item__type">
					({ typeLabel })
				</span>
				<span className={ `wpct-field-item__required ${ isRequired ? 'is-required' : 'is-optional' }` }>
					{ isRequired
						? __( 'Required', 'wp-content-types' )
						: __( 'Optional', 'wp-content-types' )
					}
				</span>
			</div>
			{ ! isCheckbox && (
				<div className="wpct-field-item__preview">
					{ getFieldPreview( field ) }
				</div>
			) }
			{ isCheckbox && (
				<div className="wpct-field-item__preview wpct-field-item__preview--checkbox">
					{ getFieldPreview( field ) }
				</div>
			) }
			{ field.description && (
				<div className="wpct-field-item__description">
					{ field.description }
				</div>
			) }
		</div>
	);
}
