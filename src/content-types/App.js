/**
 * Content Types List App
 */
import { useState, useEffect } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { DataViews } from '@wordpress/dataviews';
import {
	Button,
	Panel,
	PanelBody,
	SlotFillProvider,
	Popover,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function getEditUrl( id ) {
	return `${ window.wpctSettings.adminUrl }admin.php?page=wp-content-type-edit&id=${ id }`;
}

function getManageUrl( slug ) {
	return `${ window.wpctSettings.adminUrl }edit.php?post_type=${ slug }`;
}

const fields = [
	{
		id: 'name',
		label: __( 'Name', 'wp-content-types' ),
		getValue: ( { item } ) => item.title?.rendered || item.title,
		render: ( { item } ) => {
			const title = item.title?.rendered || item.title;
			return (
				<a href={ getEditUrl( item.id ) } style={ { fontWeight: 600 } }>
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
		id: 'visibility',
		label: __( 'Visibility', 'wp-content-types' ),
		getValue: ( { item } ) => {
			const isPublic = item.config?.public ?? true;
			return isPublic ? __( 'Public', 'wp-content-types' ) : __( 'Private', 'wp-content-types' );
		},
		elements: [
			{ value: __( 'Public', 'wp-content-types' ), label: __( 'Public', 'wp-content-types' ) },
			{ value: __( 'Private', 'wp-content-types' ), label: __( 'Private', 'wp-content-types' ) },
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
			window.location.href = getEditUrl( item.id );
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
];

function ListHeader() {
	const addNewUrl = window.wpctSettings.adminUrl + 'admin.php?page=wp-content-type-edit';

	return (
		<div className="wpct-list__header">
			<h1>{ __( 'Content Types', 'wp-content-types' ) }</h1>
			<div className="wpct-list__header-actions">
				<Button variant="primary" href={ addNewUrl }>
					{ __( 'Add New', 'wp-content-types' ) }
				</Button>
			</div>
		</div>
	);
}

function ListSidebar() {
	return (
		<div className="wpct-list__sidebar">
			<Panel>
				<PanelBody title={ __( 'About', 'wp-content-types' ) } initialOpen={ true }>
					<p>{ __( 'Create and manage custom content types for your site.', 'wp-content-types' ) }</p>
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
		fields: [ 'name', 'slug', 'visibility' ],
	} );

	useEffect( () => {
		document.body.classList.add( 'is-fullscreen-mode' );
		return () => {
			document.body.classList.remove( 'is-fullscreen-mode' );
		};
	}, [] );

	return (
		<SlotFillProvider>
			<div className="wpct-list">
				<ListHeader />
				<div className="wpct-list__body">
					<ListContent
						data={ data }
						isLoading={ isResolving }
						view={ view }
						onChangeView={ setView }
					/>
					<ListSidebar />
				</div>
			</div>
			<Popover.Slot />
		</SlotFillProvider>
	);
}
