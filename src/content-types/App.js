/**
 * Content Types List App
 */
import { useState } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { DataViews } from '@wordpress/dataviews';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Get the edit URL for a content type.
 *
 * @param {number} id The content type ID.
 * @return {string} The edit URL.
 */
function getEditUrl( id ) {
	return `${ window.wpctSettings.adminUrl }admin.php?page=wp-content-type-edit&id=${ id }`;
}

const fields = [
	{
		id: 'name',
		label: __( 'Name', 'wp-content-types' ),
		getValue: ( { item } ) => item.title?.rendered || item.title,
		render: ( { item } ) => {
			const title = item.title?.rendered || item.title;
			return (
				<a href={ getEditUrl( item.id ) } className="wpct-list__name-link">
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
];

/**
 * List Header component
 */
function ListHeader() {
	const addNewUrl = window.wpctSettings.adminUrl + 'admin.php?page=wp-content-type-edit';

	return (
		<div className="wpct-list__header">
			<h1 className="wpct-list__title">
				{ __( 'Content Types', 'wp-content-types' ) }
			</h1>
			<Button variant="primary" href={ addNewUrl }>
				{ __( 'Add New', 'wp-content-types' ) }
			</Button>
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

	return (
		<div className="wpct-list">
			<ListHeader />
			<div className="wpct-list__content">
				<DataViews
					data={ data }
					fields={ fields }
					view={ view }
					onChangeView={ setView }
					paginationInfo={ { totalItems: data.length, totalPages: 1 } }
					getItemId={ ( item ) => String( item.id ) }
					isLoading={ isResolving }
					defaultLayouts={ { table: {} } }
					actions={ actions }
				/>
			</div>
		</div>
	);
}
