/**
 * Field Group Card Component
 *
 * Displays a group of fields within a Card component.
 */
import {
	Button,
	Card,
	CardHeader,
	CardBody,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import FieldItem from './FieldItem';

export default function FieldGroupCard( {
	group,
	isSelected,
	selectedFieldId,
	onSelectGroup,
	onSelectField,
	onAddField,
} ) {
	const fields = group.fields || [];

	const handleHeaderClick = ( event ) => {
		event.stopPropagation();
		if ( onSelectGroup ) {
			onSelectGroup( group._id );
		}
	};

	const handleAddField = ( event ) => {
		event.stopPropagation();
		if ( onAddField ) {
			onAddField( group._id );
		}
	};

	const cardClassName = [
		'wpct-field-group-card',
		isSelected && 'wpct-field-group-card--selected',
	]
		.filter( Boolean )
		.join( ' ' );

	return (
		<Card className={ cardClassName }>
			<CardHeader
				className="wpct-field-group-card__header-wrapper"
				onClick={ handleHeaderClick }
				onKeyDown={ ( event ) => {
					if ( event.key === 'Enter' || event.key === ' ' ) {
						handleHeaderClick( event );
					}
				} }
				role="button"
				tabIndex={ 0 }
			>
				<div className="wpct-field-group-card__header">
					<Heading level={ 3 }>{ group.label }</Heading>
					{ group.description && (
						<Text className="wpct-field-group-card__description">
							{ group.description }
						</Text>
					) }
				</div>
			</CardHeader>
			<CardBody>
				{ fields.length === 0 ? (
					<p className="wpct-field-group-card__empty">
						{ __( 'No fields in this group.', 'wp-content-types' ) }
					</p>
				) : (
					<div className="wpct-field-group-card__fields">
						{ fields.map( ( field ) => (
							<FieldItem
								key={ field._id || field.key }
								field={ field }
								isSelected={ selectedFieldId === field._id }
								onClick={ () => onSelectField?.( group._id, field._id ) }
							/>
						) ) }
					</div>
				) }
				<div className="wpct-field-group-card__add-field">
					<Button
						variant="tertiary"
						icon={ plus }
						onClick={ handleAddField }
					>
						{ __( 'Add Field', 'wp-content-types' ) }
					</Button>
				</div>
			</CardBody>
		</Card>
	);
}
