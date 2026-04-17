/**
 * Field Group Card Component
 *
 * Displays a group of fields within a Card component.
 */
import {
	Card,
	CardHeader,
	CardBody,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import FieldItem from './FieldItem';

export default function FieldGroupCard( { group } ) {
	const fields = group.fields || [];

	return (
		<Card className="wpct-field-group-card">
			<CardHeader>
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
							<FieldItem key={ field.key } field={ field } />
						) ) }
					</div>
				) }
			</CardBody>
		</Card>
	);
}
