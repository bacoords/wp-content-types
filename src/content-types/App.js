/**
 * Content Types List App
 */
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import {
	useEntityRecords,
	useEntityRecord,
	store as coreStore,
} from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useFieldsManager } from '../content-type-editor/hooks/useFieldsManager';
import { DataViews } from '@wordpress/dataviews';
import {
	Button,
	Panel,
	PanelBody,
	SlotFillProvider,
	Popover,
} from '@wordpress/components';
// eslint-disable-next-line import/no-extraneous-dependencies
import { lock } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import ContentTypeSettingsModal from '../components/ContentTypeSettingsModal';
import Badge from '../components/Badge';
import AIChat from '../components/AIChat';

function getEditUrl( item ) {
	// For hardcoded types without a database ID, use slug.
	const identifier =
		item.id && ! String( item.id ).startsWith( 'hardcoded-' )
			? item.id
			: item.slug;
	return `${ window.wpctSettings.adminUrl }admin.php?page=wp-content-type-edit&id=${ identifier }`;
}

function getManageUrl( slug ) {
	return `${ window.wpctSettings.adminUrl }edit.php?post_type=${ slug }`;
}

const CORE_POST_TYPES = [ 'post', 'page', 'attachment' ];

function getSourceLabel( source, slug ) {
	switch ( source ) {
		case 'hardcoded':
			return CORE_POST_TYPES.includes( slug )
				? __( 'Core', 'wp-content-types' )
				: __( 'Plugin', 'wp-content-types' );
		case 'merged':
			return __( 'Extended', 'wp-content-types' );
		case 'database':
		default:
			return __( 'Custom', 'wp-content-types' );
	}
}

const fields = [
	{
		id: 'name',
		label: __( 'Name', 'wp-content-types' ),
		getValue: ( { item } ) => item.title?.rendered || item.title,
		render: ( { item } ) => {
			const title = item.title?.rendered || item.title;
			return (
				<a href={ getEditUrl( item ) } style={ { fontWeight: 600 } }>
					{ title }
				</a>
			);
		},
		enableGlobalSearch: true,
	},
	{
		id: 'slug',
		label: __( 'Slug', 'wp-content-types' ),
		getValue: ( { item } ) => item.slug,
	},
	{
		id: 'source',
		label: __( 'Source', 'wp-content-types' ),
		getValue: ( { item } ) => getSourceLabel( item.source, item.slug ),
		render: ( { item } ) => {
			const isEditable = item.source === 'database';
			return (
				<Badge
					intent={ isEditable ? 'success' : 'default' }
					icon={ item.source === 'hardcoded' ? lock : null }
				>
					{ getSourceLabel( item.source, item.slug ) }
				</Badge>
			);
		},
		elements: [
			{
				value: __( 'Core', 'wp-content-types' ),
				label: __( 'Core', 'wp-content-types' ),
			},
			{
				value: __( 'Code', 'wp-content-types' ),
				label: __( 'Code', 'wp-content-types' ),
			},
			{
				value: __( 'Extended', 'wp-content-types' ),
				label: __( 'Extended', 'wp-content-types' ),
			},
			{
				value: __( 'Custom', 'wp-content-types' ),
				label: __( 'Custom', 'wp-content-types' ),
			},
		],
	},
	{
		id: 'visibility',
		label: __( 'Visibility', 'wp-content-types' ),
		getValue: ( { item } ) => {
			const isPublic = item.config?.public ?? true;
			return isPublic
				? __( 'Public', 'wp-content-types' )
				: __( 'Private', 'wp-content-types' );
		},
		render: ( { item } ) => {
			const isPublic = item.config?.public ?? true;
			return (
				<Badge intent={ isPublic ? 'success' : 'default' }>
					{ isPublic
						? __( 'Public', 'wp-content-types' )
						: __( 'Private', 'wp-content-types' ) }
				</Badge>
			);
		},
		elements: [
			{
				value: __( 'Public', 'wp-content-types' ),
				label: __( 'Public', 'wp-content-types' ),
			},
			{
				value: __( 'Private', 'wp-content-types' ),
				label: __( 'Private', 'wp-content-types' ),
			},
		],
	},
];

const actions = [
	{
		id: 'edit',
		label: __( 'Edit', 'wp-content-types' ),
		isPrimary: true,
		callback: ( items ) => {
			const item = items[ 0 ];
			window.location.href = getEditUrl( item );
		},
	},
	{
		id: 'manage',
		label: __( 'Manage Content', 'wp-content-types' ),
		callback: ( items ) => {
			const item = items[ 0 ];
			window.location.href = getManageUrl( item.slug );
		},
	},
	{
		id: 'delete',
		label: __( 'Delete', 'wp-content-types' ),
		isDestructive: true,
		isEligible: ( item ) => item.source === 'database',
		callback: async ( items ) => {
			const item = items[ 0 ];
			/* eslint-disable no-alert */
			if (
				window.confirm(
					__(
						'Are you sure you want to delete this content type?',
						'wp-content-types'
					)
				)
			) {
				/* eslint-enable no-alert */
				try {
					await window.wp.apiFetch( {
						path: `/wp/v2/content-types/${ item.id }`,
						method: 'DELETE',
					} );
					window.location.reload();
				} catch ( error ) {
					// eslint-disable-next-line no-console
					console.error( 'Failed to delete content type:', error );
				}
			}
		},
	},
];

function ListHeader( { onAddNew } ) {
	return (
		<div className="wpct-list__header">
			<h1>{ __( 'Content Types', 'wp-content-types' ) }</h1>
			<div className="wpct-list__header-actions">
				<Button variant="primary" onClick={ onAddNew }>
					{ __( 'Add New', 'wp-content-types' ) }
				</Button>
			</div>
		</div>
	);
}

function ListSidebar( {
	sessionContentType,
	fieldsManager,
	onContentTypeCreated,
} ) {
	// Determine mode based on whether we have a session content type.
	const mode = sessionContentType ? 'edit' : 'create';

	return (
		<div className="wpct-list__sidebar">
			<Panel>
				<PanelBody
					title={ __( 'AI Assistant', 'wp-content-types' ) }
					initialOpen={ true }
				>
					<AIChat
						mode={ mode }
						contentTypeId={ sessionContentType?.id }
						contentTypeSlug={ sessionContentType?.slug }
						fieldsManager={ fieldsManager }
						currentFields={ fieldsManager?.fields || [] }
						onContentTypeCreated={ onContentTypeCreated }
					/>
				</PanelBody>
			</Panel>
		</div>
	);
}

function ListContent( { data, isLoading, view, onChangeView } ) {
	return (
		<div className="wpct-list__content">
			<DataViews
				data={ data }
				fields={ fields }
				view={ view }
				onChangeView={ onChangeView }
				paginationInfo={ { totalItems: data.length, totalPages: 1 } }
				getItemId={ ( item ) => String( item.id ) }
				isLoading={ isLoading }
				defaultLayouts={ { table: {} } }
				actions={ actions }
			/>
		</div>
	);
}

export default function App() {
	const { records, isResolving } = useEntityRecords(
		'postType',
		'wp_content_type',
		{ per_page: -1, status: 'publish' }
	);

	const data = records || [];

	const [ view, setView ] = useState( {
		type: 'table',
		titleField: 'name',
		fields: [ 'slug', 'source', 'visibility' ],
		layout: { density: 'compact' },
	} );

	const [ isAddModalOpen, setIsAddModalOpen ] = useState( false );

	// Track the content type created in this session for field management.
	const [ sessionContentTypeId, setSessionContentTypeId ] = useState( null );

	const { invalidateResolution } = useDispatch( coreStore );

	// Load the session content type if we have one.
	const {
		record: sessionContentType,
		editedRecord,
		edit: editEntity,
	} = useEntityRecord( 'postType', 'wp_content_type', sessionContentTypeId );

	// Create updateConfig function for fieldsManager.
	const updateConfig = useCallback(
		( key, value ) => {
			if ( ! sessionContentTypeId ) {
				return;
			}
			const currentConfig =
				editedRecord?.config || sessionContentType?.config || {};
			editEntity( {
				config: {
					...currentConfig,
					[ key ]: value,
				},
			} );
		},
		[ sessionContentTypeId, editedRecord, sessionContentType, editEntity ]
	);

	// Get the current config for fieldsManager.
	const currentConfig = useMemo( () => {
		return editedRecord?.config || sessionContentType?.config || {};
	}, [ editedRecord, sessionContentType ] );

	// Create fieldsManager for the session content type.
	const fieldsManager = useFieldsManager( {
		config: currentConfig,
		updateConfig,
	} );

	// Only provide fieldsManager when we have a session content type.
	const activeFieldsManager = sessionContentTypeId ? fieldsManager : null;

	/**
	 * Handle content type creation from AI Chat.
	 * Refresh the data view and track the content type for field management.
	 */
	const handleContentTypeCreated = useCallback(
		( contentType ) => {
			// Track this content type for field management.
			if ( contentType?.id ) {
				setSessionContentTypeId( contentType.id );
			}

			// Invalidate the entity records cache to trigger a refetch.
			invalidateResolution( 'getEntityRecords', [
				'postType',
				'wp_content_type',
				{ per_page: -1, status: 'publish' },
			] );
		},
		[ invalidateResolution ]
	);

	useEffect( () => {
		document.body.classList.add( 'is-fullscreen-mode' );
		return () => {
			document.body.classList.remove( 'is-fullscreen-mode' );
		};
	}, [] );

	return (
		<SlotFillProvider>
			<div className="wpct-list">
				<ListHeader onAddNew={ () => setIsAddModalOpen( true ) } />
				<div className="wpct-list__body">
					<ListContent
						data={ data }
						isLoading={ isResolving }
						view={ view }
						onChangeView={ setView }
					/>
					<ListSidebar
						sessionContentType={ sessionContentType }
						fieldsManager={ activeFieldsManager }
						onContentTypeCreated={ handleContentTypeCreated }
					/>
				</div>
			</div>
			<ContentTypeSettingsModal
				isOpen={ isAddModalOpen }
				onClose={ () => setIsAddModalOpen( false ) }
			/>
			<Popover.Slot />
		</SlotFillProvider>
	);
}
