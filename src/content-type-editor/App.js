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
	TextControl,
	ToggleControl,
	CheckboxControl,
	Spinner,
	SlotFillProvider,
	Popover,
	__experimentalHeading as Heading,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { Icon, chevronRight } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useEffect, useCallback } from '@wordpress/element';

const contentTypeId = window.wpctSettings?.contentTypeId;

function generateSlug( name ) {
	return name
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '_' )
		.replace( /^_+|_+$/g, '' )
		.substring( 0, 20 );
}

const SUPPORTS_OPTIONS = [
	{ value: 'title', label: __( 'Title', 'wp-content-types' ) },
	{ value: 'editor', label: __( 'Editor', 'wp-content-types' ) },
	{ value: 'author', label: __( 'Author', 'wp-content-types' ) },
	{ value: 'thumbnail', label: __( 'Featured Image', 'wp-content-types' ) },
	{ value: 'excerpt', label: __( 'Excerpt', 'wp-content-types' ) },
	{ value: 'comments', label: __( 'Comments', 'wp-content-types' ) },
	{ value: 'trackbacks', label: __( 'Trackbacks', 'wp-content-types' ) },
	{ value: 'revisions', label: __( 'Revisions', 'wp-content-types' ) },
	{ value: 'page-attributes', label: __( 'Page Attributes', 'wp-content-types' ) },
	{ value: 'custom-fields', label: __( 'Custom Fields', 'wp-content-types' ) },
	{ value: 'post-formats', label: __( 'Post Formats', 'wp-content-types' ) },
];

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
	supports: [ 'title', 'editor', 'thumbnail' ],
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

function SupportsCheckboxes( { supports, onChange } ) {
	const currentSupports = supports ?? DEFAULT_CONFIG.supports;

	const handleChange = ( value, checked ) => {
		let newSupports;
		if ( checked ) {
			newSupports = [ ...currentSupports, value ];
		} else {
			newSupports = currentSupports.filter( ( item ) => item !== value );
		}
		onChange( newSupports );
	};

	return (
		<div className="wpct-supports-checkboxes">
			{ SUPPORTS_OPTIONS.map( ( option ) => (
				<CheckboxControl
					__nextHasNoMarginBottom
					key={ option.value }
					label={ option.label }
					checked={ currentSupports.includes( option.value ) }
					onChange={ ( checked ) => handleChange( option.value, checked ) }
				/>
			) ) }
		</div>
	);
}

function FieldsTab() {
	return (
		<div className="wpct-editor__tab-content">
			<Card>
				<CardHeader>
					<Heading level={ 3 }>{ __( 'Fields', 'wp-content-types' ) }</Heading>
				</CardHeader>
				<CardBody>
					<p>{ __( 'Field configuration will go here.', 'wp-content-types' ) }</p>
					<Button variant="secondary">
						{ __( 'Add Field', 'wp-content-types' ) }
					</Button>
				</CardBody>
			</Card>
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
	const title = editedRecord?.title ?? record?.title?.rendered ?? '';
	const slug = editedRecord?.slug ?? record?.slug ?? '';

	const handleTitleChange = ( value ) => {
		const edits = { title: value };
		const previousTitle = editedRecord?.title ?? record?.title?.rendered ?? '';
		const previousAutoSlug = generateSlug( previousTitle );

		if ( ! slug || slug === previousAutoSlug ) {
			edits.slug = generateSlug( value );
		}

		edit( edits );
	};

	return (
		<div className="wpct-editor__tab-content">
			<Card>
				<CardHeader>
					<Heading level={ 3 }>{ __( 'Basic Settings', 'wp-content-types' ) }</Heading>
				</CardHeader>
				<CardBody>
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Name', 'wp-content-types' ) }
						value={ title }
						onChange={ handleTitleChange }
						placeholder={ __( 'e.g. Book', 'wp-content-types' ) }
						help={ __( 'The singular name for this content type.', 'wp-content-types' ) }
					/>
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Slug', 'wp-content-types' ) }
						value={ slug }
						onChange={ ( value ) => edit( { slug: generateSlug( value ) } ) }
						placeholder={ __( 'e.g. book', 'wp-content-types' ) }
						help={ __( 'Max 20 characters, lowercase letters, numbers, underscores.', 'wp-content-types' ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Public', 'wp-content-types' ) }
						help={ __( 'Makes this content type visible on the front end.', 'wp-content-types' ) }
						checked={ config.public ?? DEFAULT_CONFIG.public }
						onChange={ ( value ) => updateConfig( 'public', value ) }
					/>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<Heading level={ 3 }>{ __( 'Features', 'wp-content-types' ) }</Heading>
				</CardHeader>
				<CardBody>
					<SupportsCheckboxes
						supports={ config.supports }
						onChange={ ( value ) => updateConfig( 'supports', value ) }
					/>
				</CardBody>
			</Card>
		</div>
	);
}

function AdvancedTab( { slug, config, updateConfig } ) {
	const isPublic = config.public ?? DEFAULT_CONFIG.public;

	return (
		<div className="wpct-editor__tab-content">
			<Card>
				<CardHeader>
					<Heading level={ 3 }>{ __( 'Visibility', 'wp-content-types' ) }</Heading>
				</CardHeader>
				<CardBody>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Hierarchical', 'wp-content-types' ) }
						help={ __( 'Allow parent/child relationships like pages.', 'wp-content-types' ) }
						checked={ config.hierarchical ?? DEFAULT_CONFIG.hierarchical }
						onChange={ ( value ) => updateConfig( 'hierarchical', value ) }
					/>
					{ isPublic && (
						<>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Publicly Queryable', 'wp-content-types' ) }
								help={ __( 'Allow queries on the front end.', 'wp-content-types' ) }
								checked={ config.publicly_queryable ?? DEFAULT_CONFIG.publicly_queryable }
								onChange={ ( value ) => updateConfig( 'publicly_queryable', value ) }
							/>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Exclude from Search', 'wp-content-types' ) }
								help={ __( 'Hide from search results.', 'wp-content-types' ) }
								checked={ config.exclude_from_search ?? DEFAULT_CONFIG.exclude_from_search }
								onChange={ ( value ) => updateConfig( 'exclude_from_search', value ) }
							/>
						</>
					) }
				</CardBody>
			</Card>

			{ isPublic && (
				<Card>
					<CardHeader>
						<Heading level={ 3 }>{ __( 'URLs & Permalinks', 'wp-content-types' ) }</Heading>
					</CardHeader>
					<CardBody>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Has Archive', 'wp-content-types' ) }
							help={ __( 'Enable archive page for this content type.', 'wp-content-types' ) }
							checked={ config.has_archive ?? DEFAULT_CONFIG.has_archive }
							onChange={ ( value ) => updateConfig( 'has_archive', value ) }
						/>
						<TextControl
							__nextHasNoMarginBottom
							label={ __( 'Rewrite Slug', 'wp-content-types' ) }
							value={ config.rewrite_slug ?? '' }
							onChange={ ( value ) => updateConfig( 'rewrite_slug', value ) }
							placeholder={ slug || __( 'Uses post type slug', 'wp-content-types' ) }
							help={ __( 'Custom URL slug. Leave empty to use the post type slug.', 'wp-content-types' ) }
						/>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'With Front', 'wp-content-types' ) }
							help={ __( 'Prepend the permalink structure front base.', 'wp-content-types' ) }
							checked={ config.with_front ?? DEFAULT_CONFIG.with_front }
							onChange={ ( value ) => updateConfig( 'with_front', value ) }
						/>
					</CardBody>
				</Card>
			) }

			<Card>
				<CardHeader>
					<Heading level={ 3 }>{ __( 'REST API', 'wp-content-types' ) }</Heading>
				</CardHeader>
				<CardBody>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show in REST API', 'wp-content-types' ) }
						help={ __( 'Required for block editor support.', 'wp-content-types' ) }
						checked={ config.show_in_rest ?? DEFAULT_CONFIG.show_in_rest }
						onChange={ ( value ) => updateConfig( 'show_in_rest', value ) }
					/>
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'REST Base', 'wp-content-types' ) }
						value={ config.rest_base ?? '' }
						onChange={ ( value ) => updateConfig( 'rest_base', value ) }
						placeholder={ slug || __( 'Uses post type slug', 'wp-content-types' ) }
					/>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<Heading level={ 3 }>{ __( 'Admin Menu', 'wp-content-types' ) }</Heading>
				</CardHeader>
				<CardBody>
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Menu Icon', 'wp-content-types' ) }
						value={ config.menu_icon ?? DEFAULT_CONFIG.menu_icon }
						onChange={ ( value ) => updateConfig( 'menu_icon', value ) }
						placeholder="dashicons-database"
					/>
					<NumberControl
						label={ __( 'Menu Position', 'wp-content-types' ) }
						value={ config.menu_position ?? '' }
						onChange={ ( value ) => updateConfig( 'menu_position', value === '' ? null : parseInt( value, 10 ) ) }
						min={ 0 }
						max={ 100 }
					/>
				</CardBody>
			</Card>
		</div>
	);
}

function EditorContent( { record, editedRecord, edit, config, updateConfig } ) {
	const slug = editedRecord?.slug ?? record?.slug ?? '';

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
							return <FieldsTab />;
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
									slug={ slug }
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
