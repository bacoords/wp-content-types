/**
 * Fields DataView Component
 *
 * Displays fields in a DataViews table with edit modal.
 * Includes built-in support fields and custom fields.
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import { DataViews } from '@wordpress/dataviews';
import { useView } from '@wordpress/views';
import { __ } from '@wordpress/i18n';
import FieldEditorModal from './FieldEditorModal';
import SupportFieldModal from './SupportFieldModal';
import FieldTypePicker from './FieldTypePicker';
import Badge from '../../../components/Badge';
import { getFieldTypeLabel, FIELD_TYPES } from '../../fields/fieldEditorFields';

/**
 * Default view configuration for the fields DataView.
 */
const DEFAULT_VIEW = {
	type: 'table',
	titleField: 'label',
	fields: [ 'key', 'type', 'status' ],
	layout: { density: 'compact' },
	groupBy: {
		field: 'category',
		direction: 'asc',
		showLabel: false,
	},
};

export default function FieldsDataView( {
	fields,
	onAddField,
	onUpdateField,
	onDeleteField,
	supportFields = [],
	taxonomyFields = [],
	supports = [],
	onToggleSupport,
	onOpenTaxonomyModal,
	onRemoveTaxonomy,
	configTaxonomies = [],
} ) {
	// View state for DataViews with persistence
	const { view, updateView } = useView( {
		kind: 'wpct',
		name: 'field',
		slug: 'editor',
		defaultView: DEFAULT_VIEW,
	} );

	// Modal state
	const [ editingField, setEditingField ] = useState( null );
	const [ editingSupportField, setEditingSupportField ] = useState( null );

	// Combine support fields, taxonomy fields, and custom fields
	const combinedFields = useMemo( () => {
		// Add enabled status to support fields
		const supportFieldsWithStatus = supportFields.map( ( field ) => ( {
			...field,
			enabled: supports.includes( field.supportKey ),
			type: 'support',
		} ) );

		// Mark taxonomy fields (always enabled, read-only)
		const taxonomyFieldsWithStatus = taxonomyFields.map( ( field ) => ( {
			...field,
			enabled: true,
			type: 'taxonomy',
		} ) );

		// Mark custom fields
		const customFieldsWithType = fields.map( ( field ) => ( {
			...field,
			isBuiltIn: false,
		} ) );

		return [
			...supportFieldsWithStatus,
			...taxonomyFieldsWithStatus,
			...customFieldsWithType,
		];
	}, [ supportFields, taxonomyFields, supports, fields ] );

	// Handle opening the edit modal
	const handleEdit = useCallback( ( field ) => {
		if ( field.isTaxonomy ) {
			// Taxonomies are read-only, don't open a modal
			return;
		}
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
				id: 'category',
				label: __( 'Category', 'wp-content-types' ),
				getValue: ( { item } ) => {
					if ( item.isBuiltIn ) {
						return __( 'Built-in', 'wp-content-types' );
					}
					if ( item.isTaxonomy ) {
						return __( 'Taxonomy', 'wp-content-types' );
					}
					return __( 'Custom', 'wp-content-types' );
				},
				enableHiding: false,
				enableSorting: false,
			},
			{
				id: 'label',
				label: __( 'Label', 'wp-content-types' ),
				getValue: ( { item } ) => item.label || '',
				render: ( { item } ) => {
					// Taxonomy fields are read-only, don't make them clickable
					if ( item.isTaxonomy ) {
						return <span>{ item.label }</span>;
					}
					return (
						<button
							type="button"
							className="wpct-field-label-link"
							onClick={ () => handleEdit( item ) }
						>
							{ item.label }
						</button>
					);
				},
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
					if ( item.isTaxonomy ) {
						return item.hierarchical
							? __( 'Hierarchical', 'wp-content-types' )
							: __( 'Flat', 'wp-content-types' );
					}
					return getFieldTypeLabel( item.type );
				},
				elements: [
					{
						value: __( 'WordPress', 'wp-content-types' ),
						label: __( 'WordPress', 'wp-content-types' ),
					},
					{
						value: __( 'Hierarchical', 'wp-content-types' ),
						label: __( 'Hierarchical', 'wp-content-types' ),
					},
					{
						value: __( 'Flat', 'wp-content-types' ),
						label: __( 'Flat', 'wp-content-types' ),
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
					if ( item.isTaxonomy ) {
						if ( item.isManaged ) {
							return __( 'Custom', 'wp-content-types' );
						}
						return item.isCore
							? __( 'Core', 'wp-content-types' )
							: __( 'Plugin', 'wp-content-types' );
					}
					return item.required
						? __( 'Required', 'wp-content-types' )
						: __( 'Optional', 'wp-content-types' );
				},
				render: ( { item } ) => {
					if ( item.isBuiltIn ) {
						return (
							<button
								type="button"
								className="wpct-status-toggle"
								onClick={ () =>
									onToggleSupport( item.supportKey )
								}
							>
								<Badge
									intent={
										item.enabled ? 'success' : 'default'
									}
								>
									{ item.enabled
										? __( 'Enabled', 'wp-content-types' )
										: __( 'Disabled', 'wp-content-types' ) }
								</Badge>
							</button>
						);
					}
					if ( item.isTaxonomy ) {
						if ( item.isManaged ) {
							return (
								<Badge intent="success">
									{ __( 'Custom', 'wp-content-types' ) }
								</Badge>
							);
						}
						return (
							<Badge intent={ item.isCore ? 'info' : 'default' }>
								{ item.isCore
									? __( 'Core', 'wp-content-types' )
									: __( 'Plugin', 'wp-content-types' ) }
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
						value: __( 'Custom', 'wp-content-types' ),
						label: __( 'Custom', 'wp-content-types' ),
					},
					{
						value: __( 'Core', 'wp-content-types' ),
						label: __( 'Core', 'wp-content-types' ),
					},
					{
						value: __( 'Plugin', 'wp-content-types' ),
						label: __( 'Plugin', 'wp-content-types' ),
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
		[ handleEdit, onToggleSupport ]
	);

	// DataViews actions
	const actions = useMemo(
		() => [
			{
				id: 'edit',
				label: __( 'Edit', 'wp-content-types' ),
				isPrimary: true,
				isEligible: ( item ) => ! item.isTaxonomy,
				callback: ( items ) => {
					const item = items[ 0 ];
					handleEdit( item );
				},
			},
			{
				id: 'enable',
				label: __( 'Enable', 'wp-content-types' ),
				isEligible: ( item ) =>
					item.isBuiltIn && ! item.isTaxonomy && ! item.enabled,
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
				isEligible: ( item ) =>
					item.isBuiltIn && ! item.isTaxonomy && item.enabled,
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
				isEligible: ( item ) => ! item.isBuiltIn && ! item.isTaxonomy,
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
			{
				id: 'remove-taxonomy',
				label: __( 'Remove', 'wp-content-types' ),
				isDestructive: true,
				isEligible: ( item ) => {
					if ( ! item.isTaxonomy ) {
						return false;
					}
					// WPCT-managed taxonomies can always be removed
					if ( item.isManaged ) {
						return true;
					}
					// External taxonomies added via config can be removed
					if ( configTaxonomies.includes( item.key ) ) {
						return true;
					}
					return false;
				},
				callback: ( items ) => {
					const item = items[ 0 ];
					/* eslint-disable no-alert */
					if (
						window.confirm(
							__(
								'Remove this taxonomy from this content type?',
								'wp-content-types'
							)
						)
					) {
						if ( onRemoveTaxonomy ) {
							onRemoveTaxonomy( item );
						}
					}
					/* eslint-enable no-alert */
				},
			},
		],
		[
			handleEdit,
			onDeleteField,
			onToggleSupport,
			onRemoveTaxonomy,
			configTaxonomies,
		]
	);

	// Header button for DataViews toolbar
	const headerActions = (
		<FieldTypePicker
			onSelect={ handleAddField }
			onSelectTaxonomy={ onOpenTaxonomyModal }
		/>
	);

	return (
		<div className="wpct-fields-dataview">
			<DataViews
				data={ combinedFields }
				fields={ dataViewFields }
				view={ view }
				onChangeView={ updateView }
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
