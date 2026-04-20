/**
 * Fields DataView Component
 *
 * Displays fields in a DataViews table with edit modal.
 * Includes built-in support fields and custom fields.
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import { DataViews } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import FieldEditorModal from './FieldEditorModal';
import SupportFieldModal from './SupportFieldModal';
import FieldTypePicker from './FieldTypePicker';
import Badge from '../../../components/Badge';
import { getFieldTypeLabel, FIELD_TYPES } from '../../fields/fieldEditorFields';

export default function FieldsDataView( {
	fields,
	onAddField,
	onUpdateField,
	onDeleteField,
	supportFields = [],
	supports = [],
	onToggleSupport,
} ) {
	// View state for DataViews
	const [ view, setView ] = useState( {
		type: 'table',
		titleField: 'label',
		fields: [ 'key', 'type', 'status' ],
	} );

	// Modal state
	const [ editingField, setEditingField ] = useState( null );
	const [ editingSupportField, setEditingSupportField ] = useState( null );

	// Combine support fields with custom fields
	const combinedFields = useMemo( () => {
		// Add enabled status to support fields
		const supportFieldsWithStatus = supportFields.map( ( field ) => ( {
			...field,
			enabled: supports.includes( field.supportKey ),
			type: 'support',
		} ) );

		// Mark custom fields
		const customFieldsWithType = fields.map( ( field ) => ( {
			...field,
			isBuiltIn: false,
		} ) );

		return [ ...supportFieldsWithStatus, ...customFieldsWithType ];
	}, [ supportFields, supports, fields ] );

	// Handle opening the edit modal
	const handleEdit = useCallback( ( field ) => {
		if ( field.isBuiltIn ) {
			setEditingSupportField( field );
		} else {
			setEditingField( field );
		}
	}, [] );

	// Handle closing the modal
	const handleCloseModal = useCallback( () => {
		setEditingField( null );
	}, [] );

	// Handle closing support field modal
	const handleCloseSupportModal = useCallback( () => {
		setEditingSupportField( null );
	}, [] );

	// Handle saving from modal
	const handleSaveField = useCallback(
		( fieldId, edits ) => {
			onUpdateField( fieldId, edits );
		},
		[ onUpdateField ]
	);

	// Handle delete from modal
	const handleDeleteField = useCallback(
		( fieldId ) => {
			onDeleteField( fieldId );
			setEditingField( null );
		},
		[ onDeleteField ]
	);

	// Handle toggling support field
	const handleToggleSupportField = useCallback( () => {
		if ( editingSupportField && onToggleSupport ) {
			onToggleSupport( editingSupportField.supportKey );
		}
	}, [ editingSupportField, onToggleSupport ] );

	// Handle adding a new field with a specific type
	const handleAddField = useCallback(
		( type = 'text' ) => {
			const newField = onAddField( { type } );
			// Open the modal for the new field
			if ( newField ) {
				setEditingField( newField );
			}
		},
		[ onAddField ]
	);

	// DataViews field definitions - inside component to access handleEdit
	const dataViewFields = useMemo(
		() => [
			{
				id: 'label',
				label: __( 'Label', 'wp-content-types' ),
				getValue: ( { item } ) => item.label || '',
				render: ( { item } ) => (
					<div className="wpct-field-label-cell">
						<button
							type="button"
							className="wpct-field-label-link"
							onClick={ () => handleEdit( item ) }
						>
							{ item.label }
						</button>
						{ item.isBuiltIn && (
							<Badge intent="default">
								{ __( 'Built-in', 'wp-content-types' ) }
							</Badge>
						) }
					</div>
				),
				enableGlobalSearch: true,
			},
			{
				id: 'key',
				label: __( 'Key', 'wp-content-types' ),
				getValue: ( { item } ) => item.key || '',
				render: ( { item } ) => (
					<code
						style={ {
							fontSize: '12px',
							background: '#f0f0f0',
							padding: '2px 6px',
							borderRadius: '2px',
						} }
					>
						{ item.key }
					</code>
				),
			},
			{
				id: 'type',
				label: __( 'Type', 'wp-content-types' ),
				getValue: ( { item } ) => {
					if ( item.isBuiltIn ) {
						return __( 'WordPress', 'wp-content-types' );
					}
					return getFieldTypeLabel( item.type );
				},
				elements: [
					{
						value: __( 'WordPress', 'wp-content-types' ),
						label: __( 'WordPress', 'wp-content-types' ),
					},
					...Object.entries( FIELD_TYPES ).map(
						( [ , config ] ) => ( {
							value: config.label,
							label: config.label,
						} )
					),
				],
			},
			{
				id: 'status',
				label: __( 'Status', 'wp-content-types' ),
				getValue: ( { item } ) => {
					if ( item.isBuiltIn ) {
						return item.enabled
							? __( 'Enabled', 'wp-content-types' )
							: __( 'Disabled', 'wp-content-types' );
					}
					return item.required
						? __( 'Required', 'wp-content-types' )
						: __( 'Optional', 'wp-content-types' );
				},
				render: ( { item } ) => {
					if ( item.isBuiltIn ) {
						return (
							<Badge
								intent={ item.enabled ? 'success' : 'default' }
							>
								{ item.enabled
									? __( 'Enabled', 'wp-content-types' )
									: __( 'Disabled', 'wp-content-types' ) }
							</Badge>
						);
					}
					const isRequired = item.required === true;
					return (
						<span
							style={ {
								color: isRequired ? '#d63638' : '#757575',
								fontSize: '12px',
							} }
						>
							{ isRequired
								? __( 'Required', 'wp-content-types' )
								: __( 'Optional', 'wp-content-types' ) }
						</span>
					);
				},
				elements: [
					{
						value: __( 'Enabled', 'wp-content-types' ),
						label: __( 'Enabled', 'wp-content-types' ),
					},
					{
						value: __( 'Disabled', 'wp-content-types' ),
						label: __( 'Disabled', 'wp-content-types' ),
					},
					{
						value: __( 'Required', 'wp-content-types' ),
						label: __( 'Required', 'wp-content-types' ),
					},
					{
						value: __( 'Optional', 'wp-content-types' ),
						label: __( 'Optional', 'wp-content-types' ),
					},
				],
			},
		],
		[ handleEdit ]
	);

	// DataViews actions
	const actions = useMemo(
		() => [
			{
				id: 'edit',
				label: __( 'Edit', 'wp-content-types' ),
				isPrimary: true,
				callback: ( items ) => {
					const item = items[ 0 ];
					handleEdit( item );
				},
			},
			{
				id: 'enable',
				label: __( 'Enable', 'wp-content-types' ),
				isEligible: ( item ) => item.isBuiltIn && ! item.enabled,
				callback: ( items ) => {
					const item = items[ 0 ];
					if ( onToggleSupport ) {
						onToggleSupport( item.supportKey );
					}
				},
			},
			{
				id: 'disable',
				label: __( 'Disable', 'wp-content-types' ),
				isEligible: ( item ) => item.isBuiltIn && item.enabled,
				callback: ( items ) => {
					const item = items[ 0 ];
					if ( onToggleSupport ) {
						onToggleSupport( item.supportKey );
					}
				},
			},
			{
				id: 'delete',
				label: __( 'Delete', 'wp-content-types' ),
				isDestructive: true,
				isEligible: ( item ) => ! item.isBuiltIn,
				callback: ( items ) => {
					const item = items[ 0 ];
					/* eslint-disable no-alert */
					if (
						window.confirm(
							__(
								'Are you sure you want to delete this field?',
								'wp-content-types'
							)
						)
					) {
						onDeleteField( item._id );
					}
					/* eslint-enable no-alert */
				},
			},
		],
		[ handleEdit, onDeleteField, onToggleSupport ]
	);

	// Header button for DataViews toolbar
	const headerActions = <FieldTypePicker onSelect={ handleAddField } />;

	return (
		<div className="wpct-fields-dataview">
			<DataViews
				data={ combinedFields }
				fields={ dataViewFields }
				view={ view }
				onChangeView={ setView }
				paginationInfo={ {
					totalItems: combinedFields.length,
					totalPages: 1,
				} }
				getItemId={ ( item ) => item._id }
				isLoading={ false }
				defaultLayouts={ { table: {} } }
				actions={ actions }
				header={ headerActions }
			/>
			{ editingField && (
				<FieldEditorModal
					field={ editingField }
					onSave={ handleSaveField }
					onDelete={ handleDeleteField }
					onClose={ handleCloseModal }
				/>
			) }
			{ editingSupportField && (
				<SupportFieldModal
					field={ editingSupportField }
					isEnabled={ supports.includes(
						editingSupportField.supportKey
					) }
					onToggle={ handleToggleSupportField }
					onClose={ handleCloseSupportModal }
				/>
			) }
		</div>
	);
}
