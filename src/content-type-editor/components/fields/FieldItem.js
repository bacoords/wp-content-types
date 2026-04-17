/**
 * Field Item Component
 *
 * Displays a single field with its label, type badge, required status,
 * and description.
 */
import { __ } from '@wordpress/i18n';

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

export default function FieldItem( { field, isSelected, onClick } ) {
	const typeLabel = FIELD_TYPE_LABELS[ field.type ] || field.type;
	const isRequired = field.required === true;

	const handleClick = ( event ) => {
		event.stopPropagation();
		if ( onClick ) {
			onClick();
		}
	};

	const className = [
		'wpct-field-item',
		isSelected && 'wpct-field-item--selected',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<div
			className={ className }
			onClick={ handleClick }
			onKeyDown={ ( event ) => {
				if ( event.key === 'Enter' || event.key === ' ' ) {
					handleClick( event );
				}
			} }
			role="button"
			tabIndex={ 0 }
		>
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
			{ field.description && (
				<div className="wpct-field-item__description">
					{ field.description }
				</div>
			) }
		</div>
	);
}
