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
import { Icon, chevronRight } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useEffect, useCallback, useMemo } from '@wordpress/element';
import FieldsList from './components/fields/FieldsList';
import { getSettingsFields, getAdvancedFields } from './fields';
import { SETTINGS_FORM, getAdvancedForm } from './forms';
import { useFormData } from './hooks/useFormData';

const contentTypeId = window.wpctSettings?.contentTypeId;

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

function EditorHeader( { title, isSaving, hasEdits, onSave } ) {
	const listUrl = window.wpctSettings.adminUrl + 'admin.php?page=wp-content-types';

	return (
		<div className="wpct-editor__header">
			<nav className="wpct-editor__breadcrumb">
				<a href={ listUrl }>
					{ __( 'Content Types', 'wp-content-types' ) }
				</a>
				<Icon icon={ chevronRight } size={ 16 } />
				<strong>{ title || __( 'New Content Type', 'wp-content-types' ) }</strong>
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

function EditorSidebar() {
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

function FieldsTab( { fieldGroups } ) {
	return (
		<div className="wpct-editor__tab-content">
			<FieldsList fieldGroups={ fieldGroups } />
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

function EditorContent( { record, editedRecord, edit, config, updateConfig } ) {
	const tabs = [
		{ name: 'fields', title: __( 'Fields', 'wp-content-types' ) },
		{ name: 'settings', title: __( 'Settings', 'wp-content-types' ) },
		{ name: 'advanced', title: __( 'Advanced', 'wp-content-types' ) },
		{ name: 'json', title: __( 'JSON', 'wp-content-types' ) },
	];

	return (
		<div className="wpct-editor__content">
			<div className="wpct-editor__content-inner">
				<TabPanel tabs={ tabs }>
					{ ( tab ) => {
						if ( tab.name === 'fields' ) {
							return <FieldsTab fieldGroups={ config.field_groups } />;
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
	const { record, editedRecord, hasEdits, edit, save, isSaving, hasResolved } =
		useEntityRecord( 'postType', 'wp_content_type', contentTypeId );

	const title = editedRecord?.title ?? record?.title?.rendered ?? '';
	const savedConfig = record?.config ?? {};
	const editedConfig = editedRecord?.config ?? savedConfig;
	const config = { ...DEFAULT_CONFIG, ...editedConfig };

	const updateConfig = useCallback(
		( key, value ) => {
			edit( {
				config: {
					...editedConfig,
					[ key ]: value,
				},
			} );
		},
		[ edit, editedConfig ]
	);

	const handleSave = async () => {
		await save();
	};

	useEffect( () => {
		document.body.classList.add( 'is-fullscreen-mode' );
		return () => {
			document.body.classList.remove( 'is-fullscreen-mode' );
		};
	}, [] );

	if ( ! contentTypeId ) {
		return (
			<div className="wpct-editor wpct-editor--empty">
				<p>{ __( 'No content type specified.', 'wp-content-types' ) }</p>
			</div>
		);
	}

	if ( ! hasResolved ) {
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
					hasEdits={ hasEdits }
					onSave={ handleSave }
				/>
				<div className="wpct-editor__body">
					<EditorContent
						record={ record }
						editedRecord={ editedRecord }
						edit={ edit }
						config={ config }
						updateConfig={ updateConfig }
					/>
					<EditorSidebar />
				</div>
			</div>
			<Popover.Slot />
		</SlotFillProvider>
	);
}
