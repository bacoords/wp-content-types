/**
 * Content Type Editor App
 */
import { useEntityRecord } from '@wordpress/core-data';
import {
	Button,
	Card,
	CardHeader,
	CardBody,
	Panel,
	PanelBody,
	TabPanel,
	Spinner,
	SlotFillProvider,
	Popover,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { Icon, chevronRight, lock } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useEffect, useCallback, useMemo, useState } from '@wordpress/element';
import FieldsList from './components/fields/FieldsList';
import FieldEditorPanel from './components/fields/FieldEditorPanel';
import GroupEditorPanel from './components/fields/GroupEditorPanel';
import { getSettingsFields, getAdvancedFields } from './fields';
import { SETTINGS_FORM, getAdvancedForm } from './forms';
import { useFormData } from './hooks/useFormData';
import { useFieldsManager } from './hooks/useFieldsManager';

const contentTypeId = window.wpctSettings?.contentTypeId;
const contentTypeSlug = window.wpctSettings?.contentTypeSlug;
const contentTypeData = window.wpctSettings?.contentTypeData;

const DEFAULT_CONFIG = {
	public: true,
	hierarchical: false,
	publicly_queryable: true,
	exclude_from_search: false,
	show_in_rest: true,
	rest_base: '',
	has_archive: false,
	rewrite_slug: '',
	with_front: true,
	menu_icon: 'dashicons-database',
	menu_position: null,
	supports: [ 'title', 'editor', 'thumbnail', 'custom-fields' ],
};

const CORE_POST_TYPES = [ 'post', 'page', 'attachment' ];

function getSourceBadgeLabel( source, slug ) {
	if ( source === 'hardcoded' ) {
		return CORE_POST_TYPES.includes( slug )
			? __( 'Core', 'wp-content-types' )
			: __( 'Code', 'wp-content-types' );
	}
	return __( 'Extended', 'wp-content-types' );
}

function EditorHeader( { title, isSaving, hasEdits, onSave, source, slug } ) {
	const listUrl = window.wpctSettings.adminUrl + 'admin.php?page=wp-content-types';
	const isReadOnly = source !== 'database';

	return (
		<div className="wpct-editor__header">
			<nav className="wpct-editor__breadcrumb">
				<a href={ listUrl }>
					{ __( 'Content Types', 'wp-content-types' ) }
				</a>
				<Icon icon={ chevronRight } size={ 16 } />
				<strong>{ title || __( 'New Content Type', 'wp-content-types' ) }</strong>
				{ isReadOnly && (
					<span style={ {
						display: 'inline-flex',
						alignItems: 'center',
						gap: '4px',
						marginLeft: '8px',
						padding: '2px 8px',
						borderRadius: '2px',
						fontSize: '12px',
						backgroundColor: '#f0f0f0',
						color: '#50575e',
					} }>
						{ source === 'hardcoded' && <Icon icon={ lock } size={ 12 } /> }
						{ getSourceBadgeLabel( source, slug ) }
					</span>
				) }
			</nav>
			<div className="wpct-editor__header-actions">
				{ hasEdits && (
					<span>{ __( 'Unsaved changes', 'wp-content-types' ) }</span>
				) }
				<Button
					variant="primary"
					onClick={ onSave }
					disabled={ isSaving || ! hasEdits }
					isBusy={ isSaving }
				>
					{ __( 'Save', 'wp-content-types' ) }
				</Button>
			</div>
		</div>
	);
}

function EditorSidebar( { fieldsManager, fieldGroups } ) {
	const { selection, selectedData, updateField, deleteField, updateGroup, deleteGroup, clearSelection } = fieldsManager;

	// Render field editor panel
	if ( selection?.type === 'field' && selectedData ) {
		return (
			<div className="wpct-editor__sidebar">
				<FieldEditorPanel
					field={ selectedData }
					groupId={ selection.groupId }
					onUpdate={ updateField }
					onDelete={ deleteField }
					onClose={ clearSelection }
				/>
			</div>
		);
	}

	// Render group editor panel
	if ( selection?.type === 'group' && selectedData ) {
		return (
			<div className="wpct-editor__sidebar">
				<GroupEditorPanel
					group={ selectedData }
					onUpdate={ updateGroup }
					onDelete={ deleteGroup }
					onClose={ clearSelection }
				/>
			</div>
		);
	}

	// Default sidebar content
	return (
		<div className="wpct-editor__sidebar">
			<Panel>
				<PanelBody title={ __( 'Status', 'wp-content-types' ) } initialOpen={ true }>
					<p>{ __( 'Content type status and actions will appear here.', 'wp-content-types' ) }</p>
				</PanelBody>
			</Panel>
		</div>
	);
}

function FieldsTab( { fieldGroups, fieldsManager } ) {
	const { selection, selectGroup, selectField, addField, addGroup } = fieldsManager;

	return (
		<div className="wpct-editor__tab-content">
			<FieldsList
				fieldGroups={ fieldGroups }
				selection={ selection }
				onSelectGroup={ selectGroup }
				onSelectField={ selectField }
				onAddField={ addField }
				onAddGroup={ addGroup }
			/>
		</div>
	);
}

function JsonTab( { record, editedRecord, config } ) {
	const schema = {
		name: editedRecord?.title ?? record?.title?.rendered ?? '',
		slug: editedRecord?.slug ?? record?.slug ?? '',
		config,
	};

	return (
		<div className="wpct-editor__tab-content">
			<Card>
				<CardHeader>
					<Heading level={ 3 }>{ __( 'JSON Schema', 'wp-content-types' ) }</Heading>
				</CardHeader>
				<CardBody>
					<textarea
						readOnly
						value={ JSON.stringify( schema, null, 2 ) }
						style={ {
							width: '100%',
							minHeight: '400px',
							fontFamily: 'monospace',
							fontSize: '13px',
							padding: '12px',
							border: '1px solid #ddd',
							borderRadius: '2px',
							resize: 'vertical',
						} }
					/>
				</CardBody>
			</Card>
		</div>
	);
}

function SettingsTab( { record, editedRecord, edit, config, updateConfig } ) {
	const { formData, handleFormChange } = useFormData( {
		record,
		editedRecord,
		edit,
		config,
		updateConfig,
	} );
	const fields = useMemo(
		() => getSettingsFields( formData.slug ),
		[ formData.slug ]
	);

	return (
		<div className="wpct-editor__tab-content">
			<DataForm
				data={ formData }
				fields={ fields }
				form={ SETTINGS_FORM }
				onChange={ handleFormChange }
			/>
		</div>
	);
}

function AdvancedTab( { record, editedRecord, edit, config, updateConfig } ) {
	const { formData, handleFormChange } = useFormData( {
		record,
		editedRecord,
		edit,
		config,
		updateConfig,
	} );
	const fields = useMemo(
		() => getAdvancedFields( formData.slug ),
		[ formData.slug ]
	);
	const form = useMemo(
		() => getAdvancedForm( formData.public ),
		[ formData.public ]
	);

	return (
		<div className="wpct-editor__tab-content">
			<DataForm
				data={ formData }
				fields={ fields }
				form={ form }
				onChange={ handleFormChange }
			/>
		</div>
	);
}

function EditorContent( { record, editedRecord, edit, config, updateConfig, fieldsManager, source } ) {
	const isReadOnly = source !== 'database';

	const tabs = [
		{ name: 'fields', title: __( 'Fields', 'wp-content-types' ) },
		...( isReadOnly ? [] : [
			{ name: 'settings', title: __( 'Settings', 'wp-content-types' ) },
			{ name: 'advanced', title: __( 'Advanced', 'wp-content-types' ) },
		] ),
		{ name: 'json', title: __( 'JSON', 'wp-content-types' ) },
	];

	return (
		<div className="wpct-editor__content">
			<div className="wpct-editor__content-inner">
				<TabPanel tabs={ tabs }>
					{ ( tab ) => {
						if ( tab.name === 'fields' ) {
							return (
								<FieldsTab
									fieldGroups={ config.field_groups }
									fieldsManager={ fieldsManager }
								/>
							);
						}
						if ( tab.name === 'settings' ) {
							return (
								<SettingsTab
									record={ record }
									editedRecord={ editedRecord }
									edit={ edit }
									config={ config }
									updateConfig={ updateConfig }
								/>
							);
						}
						if ( tab.name === 'advanced' ) {
							return (
								<AdvancedTab
									record={ record }
									editedRecord={ editedRecord }
									edit={ edit }
									config={ config }
									updateConfig={ updateConfig }
								/>
							);
						}
						if ( tab.name === 'json' ) {
							return (
								<JsonTab
									record={ record }
									editedRecord={ editedRecord }
									config={ config }
								/>
							);
						}
						return null;
					} }
				</TabPanel>
			</div>
		</div>
	);
}

export default function App() {
	// For database content types, use entity record
	const { record, editedRecord, hasEdits, edit, save, isSaving, hasResolved } =
		useEntityRecord( 'postType', 'wp_content_type', contentTypeId || 0 );

	// For hardcoded content types, use local state
	const [ hardcodedState, setHardcodedState ] = useState( () => {
		if ( contentTypeData ) {
			return {
				config: { ...DEFAULT_CONFIG, ...contentTypeData.config },
				hasEdits: false,
			};
		}
		return null;
	} );

	// Determine if we're editing a hardcoded type
	const isHardcodedType = !! contentTypeSlug && !! contentTypeData;
	const source = isHardcodedType
		? contentTypeData.source
		: ( record?.source ?? 'database' );

	// Title handling
	const title = isHardcodedType
		? contentTypeData.name
		: ( editedRecord?.title ?? record?.title?.rendered ?? '' );

	// Config handling
	const savedConfig = isHardcodedType
		? contentTypeData.config
		: ( record?.config ?? {} );
	const editedConfig = isHardcodedType
		? hardcodedState?.config
		: ( editedRecord?.config ?? savedConfig );
	const config = { ...DEFAULT_CONFIG, ...editedConfig };

	const updateConfig = useCallback(
		( key, value ) => {
			if ( isHardcodedType ) {
				setHardcodedState( ( prev ) => ( {
					...prev,
					config: {
						...prev.config,
						[ key ]: value,
					},
					hasEdits: true,
				} ) );
			} else {
				edit( {
					config: {
						...editedConfig,
						[ key ]: value,
					},
				} );
			}
		},
		[ edit, editedConfig, isHardcodedType ]
	);

	// Initialize fields manager hook
	const fieldsManager = useFieldsManager( { config, updateConfig } );

	const handleSave = async () => {
		if ( isHardcodedType ) {
			// For hardcoded types, we need to create a database record to store custom fields
			try {
				const response = await window.wp.apiFetch( {
					path: '/wp/v2/content-types',
					method: 'POST',
					data: {
						title: contentTypeData.name,
						slug: contentTypeSlug,
						status: 'publish',
						config: hardcodedState.config,
					},
				} );

				// Redirect to the new database record
				window.location.href = `${ window.wpctSettings.adminUrl }admin.php?page=wp-content-type-edit&id=${ response.id }`;
			} catch ( error ) {
				console.error( 'Failed to save content type:', error );
			}
		} else {
			await save();
		}
	};

	const currentHasEdits = isHardcodedType ? hardcodedState?.hasEdits : hasEdits;

	useEffect( () => {
		document.body.classList.add( 'is-fullscreen-mode' );
		return () => {
			document.body.classList.remove( 'is-fullscreen-mode' );
		};
	}, [] );

	// No content type specified
	if ( ! contentTypeId && ! contentTypeSlug ) {
		return (
			<div className="wpct-editor wpct-editor--empty">
				<p>{ __( 'No content type specified.', 'wp-content-types' ) }</p>
			</div>
		);
	}

	// Loading state (only for database types)
	if ( contentTypeId && ! hasResolved ) {
		return (
			<div className="wpct-editor wpct-editor--loading">
				<Spinner />
			</div>
		);
	}

	return (
		<SlotFillProvider>
			<div className="wpct-editor">
				<EditorHeader
					title={ title }
					isSaving={ isSaving }
					hasEdits={ currentHasEdits }
					onSave={ handleSave }
					source={ source }
					slug={ isHardcodedType ? contentTypeSlug : ( editedRecord?.slug ?? record?.slug ?? '' ) }
				/>
				<div className="wpct-editor__body">
					<EditorContent
						record={ record }
						editedRecord={ editedRecord }
						edit={ edit }
						config={ config }
						updateConfig={ updateConfig }
						fieldsManager={ fieldsManager }
						source={ source }
					/>
					<EditorSidebar
						fieldsManager={ fieldsManager }
						fieldGroups={ config.field_groups }
					/>
				</div>
			</div>
			<Popover.Slot />
		</SlotFillProvider>
	);
}
