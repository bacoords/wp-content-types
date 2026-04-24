/**
 * Content Type Editor App
 */
import { useEntityRecord } from '@wordpress/core-data';
import {
	Button,
	Panel,
	PanelBody,
	TabPanel,
	Spinner,
	SlotFillProvider,
	Popover,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
// eslint-disable-next-line import/no-extraneous-dependencies
import {
	Icon,
	chevronRight,
	lock,
	moreVertical,
	post,
	postCategories,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useEffect, useCallback, useMemo, useState } from '@wordpress/element';
import FieldsDataView from './components/fields/FieldsDataView';
import { getAdvancedFields } from './fields';
import {
	SUPPORT_FIELDS,
	ALWAYS_ENABLED_SUPPORTS,
} from './fields/supportFields';
import { getAdvancedForm } from './forms';
import { useFormData } from './hooks/useFormData';
import { useFieldsManager } from './hooks/useFieldsManager';
import AIChat from '../components/AIChat';
import ContentTypeSettingsModal from '../components/ContentTypeSettingsModal';
import Badge from '../components/Badge';
import TaxonomyModal from './components/taxonomies/TaxonomyModal';

const contentTypeId = window.wpctSettings?.contentTypeId;
const contentTypeSlug = window.wpctSettings?.contentTypeSlug;
const contentTypeData = window.wpctSettings?.contentTypeData;
const initialTaxonomies = window.wpctSettings?.taxonomies || [];
const initialAvailableTaxonomies =
	window.wpctSettings?.availableTaxonomies || [];

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
	use_block_editor: true,
};

const CORE_POST_TYPES = [ 'post', 'page', 'attachment' ];

function getSourceBadgeLabel( source, slug ) {
	if ( source === 'hardcoded' ) {
		return CORE_POST_TYPES.includes( slug )
			? __( 'Core', 'wp-content-types' )
			: __( 'Plugin', 'wp-content-types' );
	}
	return __( 'Extended', 'wp-content-types' );
}

function EditorHeader( { title, isSaving, hasEdits, onSave, source, slug } ) {
	const listUrl =
		window.wpctSettings.adminUrl + 'admin.php?page=wp-content-types';
	const isReadOnly = source !== 'database';

	return (
		<div className="wpct-editor__header">
			<nav className="wpct-editor__breadcrumb">
				<a href={ listUrl }>
					{ __( 'Content Types', 'wp-content-types' ) }
				</a>
				<Icon icon={ chevronRight } size={ 16 } />
				<strong>
					{ title || __( 'New Content Type', 'wp-content-types' ) }
				</strong>
				{ isReadOnly && (
					<span style={ { marginLeft: '8px' } }>
						<Badge
							intent="default"
							icon={ source === 'hardcoded' ? lock : null }
						>
							{ getSourceBadgeLabel( source, slug ) }
						</Badge>
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

function EditorSidebar( {
	contentTypeId: sidebarContentTypeId,
	contentTypeSlug: sidebarContentTypeSlug,
	fieldsManager,
	formData,
	isReadOnly,
	config,
	title,
	onSettingsSaved,
} ) {
	const adminUrl = window.wpctSettings?.adminUrl || '/wp-admin/';
	const theme = window.wpctSettings?.theme || '';
	const slug = sidebarContentTypeSlug;

	const singleTemplateUrl = `${ adminUrl }site-editor.php?p=%2Fwp_template%2F${ theme }%2F%2Fsingle-${ slug }&canvas=edit`;
	const archiveTemplateUrl = `${ adminUrl }site-editor.php?p=%2Fwp_template%2F${ theme }%2F%2Farchive-${ slug }&canvas=edit`;

	// Settings modal state
	const [ isSettingsModalOpen, setIsSettingsModalOpen ] = useState( false );

	// Template existence state
	const [ singleTemplateExists, setSingleTemplateExists ] = useState( null );
	const [ archiveTemplateExists, setArchiveTemplateExists ] =
		useState( null );
	const [ isCreatingSingle, setIsCreatingSingle ] = useState( false );
	const [ isCreatingArchive, setIsCreatingArchive ] = useState( false );

	// Check if templates exist
	useEffect( () => {
		if ( ! config.public || ! slug || ! theme ) {
			return;
		}

		const checkTemplates = async () => {
			try {
				// Check single template
				const singleResponse = await window.wp.apiFetch( {
					path: `/wp/v2/templates/${ theme }//single-${ slug }`,
					method: 'GET',
				} );
				setSingleTemplateExists( !! singleResponse?.id );
			} catch {
				setSingleTemplateExists( false );
			}

			try {
				// Check archive template
				const archiveResponse = await window.wp.apiFetch( {
					path: `/wp/v2/templates/${ theme }//archive-${ slug }`,
					method: 'GET',
				} );
				setArchiveTemplateExists( !! archiveResponse?.id );
			} catch {
				setArchiveTemplateExists( false );
			}
		};

		checkTemplates();
	}, [ config.public, slug, theme ] );

	// Create template with default content from fallback template
	const createTemplate = async ( type ) => {
		const isArchive = type === 'archive';
		const setCreating = isArchive
			? setIsCreatingArchive
			: setIsCreatingSingle;
		const setExists = isArchive
			? setArchiveTemplateExists
			: setSingleTemplateExists;
		const fallbackSlug = isArchive ? 'archive' : 'single';
		const newSlug = isArchive ? `archive-${ slug }` : `single-${ slug }`;
		const templateUrl = isArchive ? archiveTemplateUrl : singleTemplateUrl;

		setCreating( true );

		try {
			// Fetch the default template content
			let defaultContent = '';
			try {
				const defaultTemplate = await window.wp.apiFetch( {
					path: `/wp/v2/templates/${ theme }//${ fallbackSlug }`,
					method: 'GET',
				} );
				defaultContent = defaultTemplate?.content?.raw || '';
			} catch {
				// Fallback content if default template doesn't exist
				defaultContent = isArchive
					? '<!-- wp:query --><div class="wp-block-query"><!-- wp:post-template --><!-- wp:post-title /--><!-- wp:post-excerpt /--><!-- /wp:post-template --></div><!-- /wp:query -->'
					: '<!-- wp:post-content /-->';
			}

			// Create the new template
			await window.wp.apiFetch( {
				path: '/wp/v2/templates',
				method: 'POST',
				data: {
					slug: newSlug,
					title: isArchive
						? `Archive: ${ title }`
						: `Single: ${ title }`,
					content: defaultContent,
					status: 'publish',
				},
			} );

			setExists( true );

			// Open the template in Site Editor
			window.open( templateUrl, '_blank' );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( `Failed to create ${ type } template:`, error );
		} finally {
			setCreating( false );
		}
	};

	// Prepare content type data for the modal
	const contentTypeForModal = {
		id: sidebarContentTypeId,
		name: formData.title,
		slug: formData.slug,
		public: formData.public,
		config,
	};

	return (
		<div className="wpct-editor__sidebar">
			{ ! isReadOnly && (
				<div className="wpct-sidebar-settings">
					<div className="wpct-sidebar-settings__header">
						<span className="wpct-sidebar-settings__title">
							{ formData.title ||
								__( 'Untitled', 'wp-content-types' ) }
						</span>
						<Button
							icon={ moreVertical }
							label={ __( 'Edit settings', 'wp-content-types' ) }
							onClick={ () => setIsSettingsModalOpen( true ) }
							size="small"
						/>
					</div>
					{ formData.description && (
						<p className="wpct-sidebar-settings__description">
							{ formData.description }
						</p>
					) }
					<div style={ { marginTop: '8px' } }>
						<Badge
							intent={ formData.public ? 'success' : 'default' }
						>
							{ formData.public
								? __( 'Public', 'wp-content-types' )
								: __( 'Private', 'wp-content-types' ) }
						</Badge>
					</div>
					{ config.public && slug && (
						<div className="wpct-template-links">
							{ /* eslint-disable-next-line no-nested-ternary */ }
							{ singleTemplateExists === null ? (
								<Spinner />
							) : singleTemplateExists ? (
								<Button
									variant="link"
									icon={ post }
									href={ singleTemplateUrl }
									target="_blank"
								>
									{ __(
										'Edit Single Template',
										'wp-content-types'
									) }
								</Button>
							) : (
								<Button
									variant="link"
									icon={ post }
									onClick={ () => createTemplate( 'single' ) }
									isBusy={ isCreatingSingle }
									disabled={ isCreatingSingle }
								>
									{ __(
										'Create Single Template',
										'wp-content-types'
									) }
								</Button>
							) }
							{ /* eslint-disable no-nested-ternary */ }
							{ config.has_archive &&
								( archiveTemplateExists === null ? (
									<Spinner />
								) : archiveTemplateExists ? (
									<Button
										variant="link"
										icon={ postCategories }
										href={ archiveTemplateUrl }
										target="_blank"
									>
										{ __(
											'Edit Archive Template',
											'wp-content-types'
										) }
									</Button>
								) : (
									<Button
										variant="link"
										icon={ postCategories }
										onClick={ () =>
											createTemplate( 'archive' )
										}
										isBusy={ isCreatingArchive }
										disabled={ isCreatingArchive }
									>
										{ __(
											'Create Archive Template',
											'wp-content-types'
										) }
									</Button>
								) ) }
							{ /* eslint-enable no-nested-ternary */ }
						</div>
					) }
				</div>
			) }
			<Panel>
				<PanelBody
					title={ __( 'AI Assistant', 'wp-content-types' ) }
					initialOpen={ true }
				>
					<AIChat
						contentTypeId={ contentTypeId }
						contentTypeSlug={ contentTypeSlug }
						fieldsManager={ fieldsManager }
						currentFields={ fieldsManager?.fields || [] }
					/>
				</PanelBody>
			</Panel>
			<ContentTypeSettingsModal
				isOpen={ isSettingsModalOpen }
				onClose={ () => setIsSettingsModalOpen( false ) }
				contentType={ contentTypeForModal }
				onSave={ onSettingsSaved }
			/>
		</div>
	);
}

function FieldsTab( {
	fieldsManager,
	supports,
	onToggleSupport,
	taxonomies = [],
	onOpenTaxonomyModal,
	onRemoveTaxonomy,
	configTaxonomies = [],
} ) {
	const { fields, addField, updateField, deleteField } = fieldsManager;

	return (
		<div className="wpct-editor__tab-content">
			<FieldsDataView
				fields={ fields }
				onAddField={ addField }
				onUpdateField={ updateField }
				onDeleteField={ deleteField }
				supportFields={ SUPPORT_FIELDS }
				taxonomyFields={ taxonomies }
				supports={ supports }
				onToggleSupport={ onToggleSupport }
				onOpenTaxonomyModal={ onOpenTaxonomyModal }
				onRemoveTaxonomy={ onRemoveTaxonomy }
				configTaxonomies={ configTaxonomies }
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
		<div className="wpct-editor__tab-content wpct-editor__tab-content--full">
			<textarea
				className="wpct-json-textarea"
				readOnly
				value={ JSON.stringify( schema, null, 2 ) }
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

function EditorContent( {
	record,
	editedRecord,
	edit,
	config,
	updateConfig,
	fieldsManager,
	source,
	taxonomies = [],
	onOpenTaxonomyModal,
	onRemoveTaxonomy,
} ) {
	const isReadOnly = source !== 'database';

	// Get supports array from config
	const supports = config.supports || [];

	// Handle toggling a support feature
	const handleToggleSupport = useCallback(
		( supportKey ) => {
			const currentSupports = config.supports || [];
			let newSupports;

			if ( currentSupports.includes( supportKey ) ) {
				// Remove the support
				newSupports = currentSupports.filter(
					( s ) => s !== supportKey
				);
			} else {
				// Add the support
				newSupports = [ ...currentSupports, supportKey ];
			}

			// Ensure always-enabled supports are included
			ALWAYS_ENABLED_SUPPORTS.forEach( ( s ) => {
				if ( ! newSupports.includes( s ) ) {
					newSupports.push( s );
				}
			} );

			updateConfig( 'supports', newSupports );
		},
		[ config.supports, updateConfig ]
	);

	const tabs = [
		{ name: 'fields', title: __( 'Fields', 'wp-content-types' ) },
		...( isReadOnly
			? []
			: [
					{
						name: 'advanced',
						title: __( 'Settings', 'wp-content-types' ),
					},
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
									fieldsManager={ fieldsManager }
									supports={ supports }
									onToggleSupport={ handleToggleSupport }
									taxonomies={ taxonomies }
									onOpenTaxonomyModal={ onOpenTaxonomyModal }
									onRemoveTaxonomy={ onRemoveTaxonomy }
									configTaxonomies={ config.taxonomies || [] }
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
	const {
		record,
		editedRecord,
		hasEdits,
		edit,
		save,
		isSaving,
		hasResolved,
	} = useEntityRecord( 'postType', 'wp_content_type', contentTypeId || 0 );

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

	// Taxonomy state
	const [ taxonomies, setTaxonomies ] = useState( initialTaxonomies );
	const [ availableTaxonomies, setAvailableTaxonomies ] = useState(
		initialAvailableTaxonomies
	);
	const [ isTaxonomyModalOpen, setIsTaxonomyModalOpen ] = useState( false );
	const [ pendingNewTaxonomies, setPendingNewTaxonomies ] = useState( [] );

	// Track baseline managed taxonomy slugs (updated after save)
	const [ baselineManagedTaxonomySlugs, setBaselineManagedTaxonomySlugs ] =
		useState( () =>
			initialTaxonomies
				.filter( ( t ) => t.isManaged )
				.map( ( t ) => t.key || t.name )
		);

	// Determine if we're editing a hardcoded type
	const isHardcodedType = !! contentTypeSlug && !! contentTypeData;
	const source = isHardcodedType
		? contentTypeData.source
		: record?.source ?? 'database';

	// Title handling
	const title = isHardcodedType
		? contentTypeData.name
		: editedRecord?.title ?? record?.title?.rendered ?? '';

	// Config handling
	const savedConfig = isHardcodedType
		? contentTypeData.config
		: record?.config ?? {};
	const editedConfig = isHardcodedType
		? hardcodedState?.config
		: editedRecord?.config ?? savedConfig;

	// Memoize config to prevent unnecessary re-renders and useCallback dependency changes
	const config = useMemo(
		() => ( { ...DEFAULT_CONFIG, ...editedConfig } ),
		[ editedConfig ]
	);

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

	// Form data for sidebar settings
	const { formData } = useFormData( {
		record,
		editedRecord,
		edit,
		config,
		updateConfig,
	} );

	// Get current post type slug
	const currentPostTypeSlug = isHardcodedType
		? contentTypeSlug
		: editedRecord?.slug ?? record?.slug ?? '';

	// Get current taxonomy slugs attached to this post type
	const currentTaxonomySlugs = useMemo( () => {
		return taxonomies.map( ( t ) => t.name || t.key );
	}, [ taxonomies ] );

	// Compute managed taxonomy changes (for deferred save)
	const managedTaxonomyChanges = useMemo( () => {
		const pendingNewSlugs = pendingNewTaxonomies.map( ( t ) => t.slug );
		const currentManagedSlugs = taxonomies
			.filter( ( t ) => t.isManaged )
			.map( ( t ) => t.key || t.name );

		// Added = managed taxonomies in current but not in initial (excluding pending new)
		const added = currentManagedSlugs.filter(
			( slug ) =>
				! baselineManagedTaxonomySlugs.includes( slug ) &&
				! pendingNewSlugs.includes( slug )
		);

		// Removed = managed taxonomies in initial but not in current
		const removed = baselineManagedTaxonomySlugs.filter(
			( slug ) => ! currentManagedSlugs.includes( slug )
		);

		return { added, removed };
	}, [ taxonomies, pendingNewTaxonomies, baselineManagedTaxonomySlugs ] );

	// Check if there are unsaved managed taxonomy changes
	const hasManagedTaxonomyChanges = useMemo( () => {
		return (
			pendingNewTaxonomies.length > 0 ||
			managedTaxonomyChanges.added.length > 0 ||
			managedTaxonomyChanges.removed.length > 0
		);
	}, [ pendingNewTaxonomies, managedTaxonomyChanges ] );

	// Save handler - applies all pending changes
	const handleSave = useCallback( async () => {
		try {
			// 1. Create pending new taxonomies
			for ( const taxonomyData of pendingNewTaxonomies ) {
				await window.wp.apiFetch( {
					path: '/wp/v2/content-taxonomies',
					method: 'POST',
					data: {
						title: taxonomyData.name,
						slug: taxonomyData.slug,
						status: 'publish',
						config: {
							hierarchical: taxonomyData.hierarchical,
							description: taxonomyData.description,
							public: true,
							show_in_rest: true,
							rest_base: taxonomyData.slug,
							post_types: [ currentPostTypeSlug ],
						},
					},
				} );
			}

			// 2. Update managed taxonomies that were added
			for ( const slug of managedTaxonomyChanges.added ) {
				const taxonomy = availableTaxonomies.find(
					( t ) => t.slug === slug && t.isManaged
				);
				if ( taxonomy ) {
					const updatedPostTypes = [
						...( taxonomy.postTypes || [] ),
						currentPostTypeSlug,
					];
					await window.wp.apiFetch( {
						path: `/wp/v2/content-taxonomies/${ taxonomy.id }`,
						method: 'PUT',
						data: {
							config: {
								...taxonomy.config,
								post_types: updatedPostTypes,
							},
						},
					} );
				}
			}

			// 3. Update managed taxonomies that were removed
			for ( const slug of managedTaxonomyChanges.removed ) {
				const taxonomy = availableTaxonomies.find(
					( t ) => t.slug === slug && t.isManaged
				);
				if ( taxonomy ) {
					const updatedPostTypes = (
						taxonomy.postTypes || []
					).filter( ( pt ) => pt !== currentPostTypeSlug );
					await window.wp.apiFetch( {
						path: `/wp/v2/content-taxonomies/${ taxonomy.id }`,
						method: 'PUT',
						data: {
							config: {
								...taxonomy.config,
								post_types: updatedPostTypes,
							},
						},
					} );
				}
			}

			// 4. Save the content type record
			if ( isHardcodedType ) {
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
				window.location.href = `${ window.wpctSettings.adminUrl }admin.php?page=wp-content-type-edit&id=${ response.id }`;
			} else {
				await save();
			}

			// 5. Reset pending state and update baseline
			setPendingNewTaxonomies( [] );

			// Update baseline to match current state so hasEdits resets
			const currentManagedSlugs = taxonomies
				.filter( ( t ) => t.isManaged )
				.map( ( t ) => t.key || t.name );
			setBaselineManagedTaxonomySlugs( currentManagedSlugs );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to save:', error );
		}
	}, [
		pendingNewTaxonomies,
		managedTaxonomyChanges,
		availableTaxonomies,
		currentPostTypeSlug,
		isHardcodedType,
		hardcodedState,
		save,
		taxonomies,
	] );

	// Handle creating a new taxonomy (queued for save)
	const handleCreateTaxonomy = useCallback(
		( taxonomyData ) => {
			// Queue taxonomy for creation on save
			setPendingNewTaxonomies( ( prev ) => [ ...prev, taxonomyData ] );

			// Add to local taxonomies state for display
			const newTaxonomy = {
				_id: '__taxonomy_' + taxonomyData.slug,
				key: taxonomyData.slug,
				name: taxonomyData.slug,
				label: taxonomyData.name,
				singularName: taxonomyData.name,
				restBase: taxonomyData.slug,
				hierarchical: taxonomyData.hierarchical,
				isTaxonomy: true,
				isManaged: true,
				isPending: true, // Mark as pending creation
			};
			setTaxonomies( ( prev ) => [ ...prev, newTaxonomy ] );

			// Add to available taxonomies so it shows up in lists
			setAvailableTaxonomies( ( prev ) => [
				...prev,
				{
					id: null, // No ID yet
					name: taxonomyData.name,
					slug: taxonomyData.slug,
					hierarchical: taxonomyData.hierarchical,
					postTypes: [ currentPostTypeSlug ],
					config: {
						hierarchical: taxonomyData.hierarchical,
						description: taxonomyData.description,
					},
					isManaged: true,
					isPending: true,
				},
			] );

			setIsTaxonomyModalOpen( false );
		},
		[ currentPostTypeSlug ]
	);

	// Handle adding an existing taxonomy to this post type (queued for save)
	const handleAddExistingTaxonomy = useCallback(
		( taxonomySlug ) => {
			// Find the taxonomy in availableTaxonomies
			const taxonomy = availableTaxonomies.find(
				( t ) => t.slug === taxonomySlug
			);
			if ( ! taxonomy ) {
				return;
			}

			// For external taxonomies, update config.taxonomies (goes through entity system)
			if ( ! taxonomy.isManaged ) {
				const currentTaxonomiesConfig = config.taxonomies || [];
				const updatedTaxonomiesConfig = [
					...currentTaxonomiesConfig,
					taxonomySlug,
				];
				updateConfig( 'taxonomies', updatedTaxonomiesConfig );
			}
			// For managed taxonomies, the change is tracked via managedTaxonomyChanges
			// and applied on save

			// Add to local taxonomies state for display
			const newTaxonomy = {
				_id: '__taxonomy_' + taxonomy.slug,
				key: taxonomy.slug,
				name: taxonomy.slug,
				label: taxonomy.name,
				singularName: taxonomy.name,
				restBase: taxonomy.restBase || taxonomy.slug,
				hierarchical: taxonomy.hierarchical,
				isTaxonomy: true,
				isManaged: taxonomy.isManaged,
				isCore: taxonomy.isCore,
				managedId: taxonomy.id,
			};
			setTaxonomies( ( prev ) => [ ...prev, newTaxonomy ] );

			setIsTaxonomyModalOpen( false );
		},
		[ availableTaxonomies, config, updateConfig ]
	);

	// Handle removing a taxonomy from this post type (queued for save)
	const handleRemoveTaxonomy = useCallback(
		( taxonomy ) => {
			// For external taxonomies, update config.taxonomies (goes through entity system)
			if ( ! taxonomy.isManaged ) {
				const currentTaxonomiesConfig = config.taxonomies || [];
				const updatedTaxonomiesConfig = currentTaxonomiesConfig.filter(
					( slug ) => slug !== taxonomy.key
				);
				updateConfig( 'taxonomies', updatedTaxonomiesConfig );
			}
			// For managed taxonomies, the change is tracked via managedTaxonomyChanges
			// and applied on save

			// Remove from local taxonomies state
			setTaxonomies( ( prev ) =>
				prev.filter( ( t ) => t.key !== taxonomy.key )
			);

			// If it was a pending new taxonomy, also remove from pending
			setPendingNewTaxonomies( ( prev ) =>
				prev.filter( ( t ) => t.slug !== taxonomy.key )
			);
		},
		[ config, updateConfig ]
	);

	const baseHasEdits = isHardcodedType ? hardcodedState?.hasEdits : hasEdits;
	const currentHasEdits = baseHasEdits || hasManagedTaxonomyChanges;
	const isReadOnly = source !== 'database';

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
				<p>
					{ __( 'No content type specified.', 'wp-content-types' ) }
				</p>
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
					slug={
						isHardcodedType
							? contentTypeSlug
							: editedRecord?.slug ?? record?.slug ?? ''
					}
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
						taxonomies={ taxonomies }
						onOpenTaxonomyModal={ () =>
							setIsTaxonomyModalOpen( true )
						}
						onRemoveTaxonomy={ handleRemoveTaxonomy }
					/>
					<EditorSidebar
						contentTypeId={ contentTypeId }
						contentTypeSlug={
							isHardcodedType
								? contentTypeSlug
								: editedRecord?.slug ?? record?.slug ?? ''
						}
						fieldsManager={ fieldsManager }
						formData={ formData }
						isReadOnly={ isReadOnly }
						config={ config }
						title={ title }
						onSettingsSaved={ () => window.location.reload() }
					/>
				</div>
			</div>
			{ isTaxonomyModalOpen && (
				<TaxonomyModal
					onClose={ () => setIsTaxonomyModalOpen( false ) }
					onCreateTaxonomy={ handleCreateTaxonomy }
					onAddExistingTaxonomy={ handleAddExistingTaxonomy }
					availableTaxonomies={ availableTaxonomies }
					currentTaxonomySlugs={ currentTaxonomySlugs }
				/>
			) }
			<Popover.Slot />
		</SlotFillProvider>
	);
}
