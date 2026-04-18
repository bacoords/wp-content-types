/**
 * Content Type Settings Modal
 *
 * Shared modal for adding and editing content type settings.
 */
import { useState, useCallback } from '@wordpress/element';
import {
	Modal,
	Button,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Generate a slug from a name.
 *
 * @param {string} name The name to convert.
 * @return {string} The slug.
 */
function nameToSlug( name ) {
	return name
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '_' )
		.replace( /^_+|_+$/g, '' )
		.substring( 0, 20 );
}

/**
 * Form fields for the content type settings.
 */
const settingsFields = [
	{
		id: 'name',
		label: __( 'Name', 'wp-content-types' ),
		type: 'text',
	},
	{
		id: 'slug',
		label: __( 'Slug', 'wp-content-types' ),
		type: 'text',
		description: __(
			"Warning: changing the slug will remove any existing content you've already added.",
			'wp-content-types'
		),
	},
	{
		id: 'public',
		label: __( 'Public', 'wp-content-types' ),
		type: 'text',
		Edit: ( { data, field, onChange } ) => {
			const { ToggleControl } = wp.components;
			return (
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Public', 'wp-content-types' ) }
					checked={ data.public }
					onChange={ ( value ) => onChange( { public: value } ) }
				/>
			);
		},
	},
];

/**
 * Form layout for the content type settings.
 */
const settingsForm = {
	fields: [ 'name', 'slug', 'public' ],
};

/**
 * Content Type Settings Modal Component.
 *
 * @param {Object}   props             Component props.
 * @param {boolean}  props.isOpen      Whether the modal is open.
 * @param {Function} props.onClose     Callback when modal closes.
 * @param {Object}   props.contentType Existing content type data (null for new).
 * @param {Function} props.onSave      Callback after successful save.
 */
export default function ContentTypeSettingsModal( {
	isOpen,
	onClose,
	contentType = null,
	onSave,
} ) {
	const isEditing = !! contentType;

	const [ formData, setFormData ] = useState( () => ( {
		name: contentType?.name || '',
		slug: contentType?.slug || '',
		public: contentType?.public ?? true,
	} ) );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ autoSlug, setAutoSlug ] = useState( ! isEditing );

	const handleChange = useCallback(
		( edits ) => {
			setFormData( ( prev ) => {
				const newData = { ...prev, ...edits };

				// Auto-generate slug from name if user hasn't manually edited it
				if ( edits.name !== undefined && autoSlug ) {
					newData.slug = nameToSlug( edits.name );
				}

				// If user manually edits slug, stop auto-generating
				if ( edits.slug !== undefined && edits.name === undefined ) {
					setAutoSlug( false );
				}

				return newData;
			} );
		},
		[ autoSlug ]
	);

	const handleSave = useCallback( async () => {
		if ( ! formData.name.trim() || ! formData.slug.trim() ) {
			return;
		}

		setIsSaving( true );

		try {
			if ( isEditing ) {
				// Update existing content type
				await apiFetch( {
					path: `/wp/v2/content-types/${ contentType.id }`,
					method: 'POST',
					data: {
						title: formData.name,
						slug: formData.slug,
						config: {
							...contentType.config,
							public: formData.public,
						},
					},
				} );

				if ( onSave ) {
					onSave( formData );
				}
				onClose();
			} else {
				// Create new content type
				const response = await apiFetch( {
					path: '/wp/v2/content-types',
					method: 'POST',
					data: {
						title: formData.name,
						slug: formData.slug,
						status: 'publish',
						config: {
							public: formData.public,
						},
					},
				} );

				// Redirect to the edit page for the new content type
				window.location.href = `${ window.wpctSettings.adminUrl }admin.php?page=wp-content-type-edit&id=${ response.id }`;
			}
		} catch ( error ) {
			console.error( 'Failed to save content type:', error );
			setIsSaving( false );
		}
	}, [ formData, isEditing, contentType, onSave, onClose ] );

	const isValid = formData.name.trim() && formData.slug.trim();

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={
				isEditing
					? __( 'Edit Content Type', 'wp-content-types' )
					: __( 'Add Content Type', 'wp-content-types' )
			}
			onRequestClose={ onClose }
			className="wpct-settings-modal"
			size="small"
		>
			<div className="wpct-settings-modal__content">
				<DataForm
					data={ formData }
					fields={ settingsFields }
					form={ settingsForm }
					onChange={ handleChange }
				/>
			</div>
			<div className="wpct-settings-modal__footer">
				<HStack justify="flex-end" spacing={ 3 }>
					<Button variant="tertiary" onClick={ onClose }>
						{ __( 'Cancel', 'wp-content-types' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ handleSave }
						disabled={ ! isValid || isSaving }
						isBusy={ isSaving }
					>
						{ isEditing
							? __( 'Save', 'wp-content-types' )
							: __( 'Create', 'wp-content-types' ) }
					</Button>
				</HStack>
			</div>
		</Modal>
	);
}
