/**
 * Taxonomy Modal Component
 *
 * Modal for creating new taxonomies or adding existing ones to a content type.
 */
import {
	Button,
	Modal,
	TextControl,
	TextareaControl,
	ToggleControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { category, plus } from '@wordpress/icons';
import './taxonomy-modal.css';

/**
 * Generate a slug from a name.
 *
 * @param {string} name The name to convert.
 * @return {string} Generated slug.
 */
function generateSlug( name ) {
	return name
		.toLowerCase()
		.replace( /[^a-z0-9\s_]/g, '' )
		.replace( /\s+/g, '_' )
		.substring( 0, 32 );
}

/**
 * Choice Screen - Initial screen to choose between adding existing or creating new.
 *
 * @param {Object}   props                       Component props.
 * @param {Function} props.onAddExisting         Callback when user chooses to add existing.
 * @param {Function} props.onCreateNew           Callback when user chooses to create new.
 * @param {boolean}  props.hasExistingTaxonomies Whether there are existing taxonomies to add.
 */
function ChoiceScreen( { onAddExisting, onCreateNew, hasExistingTaxonomies } ) {
	return (
		<div className="wpct-taxonomy-modal__choices">
			<VStack spacing={ 4 }>
				<p className="wpct-taxonomy-modal__intro">
					{ __(
						'Add a taxonomy to organize your content with categories or tags.',
						'wp-content-types'
					) }
				</p>
				<HStack spacing={ 4 } justify="center" wrap>
					<Button
						variant="secondary"
						icon={ category }
						onClick={ onAddExisting }
						disabled={ ! hasExistingTaxonomies }
						className="wpct-taxonomy-modal__choice-button"
					>
						{ __( 'Add existing taxonomy', 'wp-content-types' ) }
					</Button>
					<Button
						variant="primary"
						icon={ plus }
						onClick={ onCreateNew }
						className="wpct-taxonomy-modal__choice-button"
					>
						{ __( 'Create new taxonomy', 'wp-content-types' ) }
					</Button>
				</HStack>
				{ ! hasExistingTaxonomies && (
					<p className="wpct-taxonomy-modal__hint">
						{ __(
							'No existing taxonomies available to add.',
							'wp-content-types'
						) }
					</p>
				) }
			</VStack>
		</div>
	);
}

/**
 * Add Existing Screen - List of taxonomies not attached to current post type.
 *
 * @param {Object}   props                     Component props.
 * @param {Array}    props.availableTaxonomies List of taxonomies available to add.
 * @param {Function} props.onSelect            Callback when a taxonomy is selected.
 * @param {Function} props.onBack              Callback to go back to choice screen.
 * @param {boolean}  props.isLoading           Whether an operation is in progress.
 */
function AddExistingScreen( {
	availableTaxonomies,
	onSelect,
	onBack,
	isLoading,
} ) {
	const [ selectedSlug, setSelectedSlug ] = useState( null );

	const handleAdd = useCallback( () => {
		if ( selectedSlug ) {
			onSelect( selectedSlug );
		}
	}, [ selectedSlug, onSelect ] );

	return (
		<div className="wpct-taxonomy-modal__existing">
			<VStack spacing={ 4 }>
				{ availableTaxonomies.length === 0 ? (
					<p>
						{ __(
							'All taxonomies are already attached to this content type.',
							'wp-content-types'
						) }
					</p>
				) : (
					<>
						<p>
							{ __(
								'Select a taxonomy to add to this content type:',
								'wp-content-types'
							) }
						</p>
						<div className="wpct-taxonomy-modal__list">
							{ availableTaxonomies.map( ( taxonomy ) => (
								<button
									key={ taxonomy.slug }
									type="button"
									className={ `wpct-taxonomy-modal__list-item ${
										selectedSlug === taxonomy.slug
											? 'is-selected'
											: ''
									}` }
									onClick={ () =>
										setSelectedSlug( taxonomy.slug )
									}
								>
									<span className="wpct-taxonomy-modal__list-item-name">
										{ taxonomy.name }
									</span>
									<span className="wpct-taxonomy-modal__list-item-slug">
										{ taxonomy.slug }
									</span>
									<span className="wpct-taxonomy-modal__list-item-type">
										{ taxonomy.hierarchical
											? __(
													'Hierarchical',
													'wp-content-types'
											  )
											: __( 'Flat', 'wp-content-types' ) }
									</span>
								</button>
							) ) }
						</div>
					</>
				) }
			</VStack>
			<div className="wpct-taxonomy-modal__footer">
				<HStack justify="space-between">
					<Button variant="tertiary" onClick={ onBack }>
						{ __( 'Back', 'wp-content-types' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ handleAdd }
						disabled={ ! selectedSlug || isLoading }
						isBusy={ isLoading }
					>
						{ __( 'Add Taxonomy', 'wp-content-types' ) }
					</Button>
				</HStack>
			</div>
		</div>
	);
}

/**
 * Create New Screen - Form to create a new taxonomy.
 *
 * @param {Object}   props           Component props.
 * @param {Function} props.onSave    Callback when form is submitted.
 * @param {Function} props.onBack    Callback to go back to choice screen.
 * @param {boolean}  props.isLoading Whether an operation is in progress.
 */
function CreateNewScreen( { onSave, onBack, isLoading } ) {
	const [ formData, setFormData ] = useState( {
		name: '',
		slug: '',
		hierarchical: true,
		description: '',
	} );
	const [ slugManuallyEdited, setSlugManuallyEdited ] = useState( false );

	const handleChange = useCallback(
		( key, value ) => {
			setFormData( ( prev ) => {
				const newData = { ...prev, [ key ]: value };

				// Auto-generate slug from name if not manually edited
				if ( key === 'name' && ! slugManuallyEdited ) {
					newData.slug = generateSlug( value );
				}

				// Mark slug as manually edited if user types in it
				if ( key === 'slug' ) {
					setSlugManuallyEdited( true );
				}

				return newData;
			} );
		},
		[ slugManuallyEdited ]
	);

	const handleCreate = useCallback( () => {
		if ( formData.name && formData.slug ) {
			onSave( formData );
		}
	}, [ formData, onSave ] );

	const isValid = formData.name.trim() && formData.slug.trim();

	return (
		<div className="wpct-taxonomy-modal__create">
			<VStack spacing={ 4 }>
				<TextControl
					label={ __( 'Name', 'wp-content-types' ) }
					value={ formData.name }
					onChange={ ( value ) => handleChange( 'name', value ) }
					placeholder={ __( 'Genre', 'wp-content-types' ) }
					required
					__nextHasNoMarginBottom
				/>
				<TextControl
					label={ __( 'Slug', 'wp-content-types' ) }
					value={ formData.slug }
					onChange={ ( value ) => handleChange( 'slug', value ) }
					placeholder={ __( 'genre', 'wp-content-types' ) }
					help={ __(
						'Used in URLs and the REST API. Max 32 characters, lowercase letters, numbers, and underscores only.',
						'wp-content-types'
					) }
					required
					__nextHasNoMarginBottom
				/>
				<ToggleControl
					label={ __( 'Hierarchical', 'wp-content-types' ) }
					checked={ formData.hierarchical }
					onChange={ ( value ) =>
						handleChange( 'hierarchical', value )
					}
					help={
						formData.hierarchical
							? __(
									'Like categories - terms can have parent/child relationships.',
									'wp-content-types'
							  )
							: __(
									'Like tags - flat list of terms.',
									'wp-content-types'
							  )
					}
					__nextHasNoMarginBottom
				/>
				<TextareaControl
					label={ __( 'Description', 'wp-content-types' ) }
					value={ formData.description }
					onChange={ ( value ) =>
						handleChange( 'description', value )
					}
					placeholder={ __(
						'Optional description for this taxonomy.',
						'wp-content-types'
					) }
					__nextHasNoMarginBottom
				/>
			</VStack>
			<div className="wpct-taxonomy-modal__footer">
				<HStack justify="space-between">
					<Button variant="tertiary" onClick={ onBack }>
						{ __( 'Back', 'wp-content-types' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ handleCreate }
						disabled={ ! isValid || isLoading }
						isBusy={ isLoading }
					>
						{ __( 'Create Taxonomy', 'wp-content-types' ) }
					</Button>
				</HStack>
			</div>
		</div>
	);
}

export default function TaxonomyModal( {
	onClose,
	onCreateTaxonomy,
	onAddExistingTaxonomy,
	availableTaxonomies: allTaxonomies = [],
	currentTaxonomySlugs = [],
	isLoading = false,
} ) {
	const [ screen, setScreen ] = useState( 'choice' ); // 'choice', 'existing', 'create'

	// Filter out taxonomies that are already attached to this content type
	const availableTaxonomies = useMemo( () => {
		return allTaxonomies.filter(
			( taxonomy ) => ! currentTaxonomySlugs.includes( taxonomy.slug )
		);
	}, [ allTaxonomies, currentTaxonomySlugs ] );

	const hasExistingTaxonomies = availableTaxonomies.length > 0;

	const handleCreateNew = useCallback(
		( formData ) => {
			onCreateTaxonomy( formData );
		},
		[ onCreateTaxonomy ]
	);

	const handleAddExisting = useCallback(
		( taxonomySlug ) => {
			onAddExistingTaxonomy( taxonomySlug );
		},
		[ onAddExistingTaxonomy ]
	);

	const getModalTitle = () => {
		switch ( screen ) {
			case 'existing':
				return __( 'Add Existing Taxonomy', 'wp-content-types' );
			case 'create':
				return __( 'Create New Taxonomy', 'wp-content-types' );
			default:
				return __( 'Add Taxonomy', 'wp-content-types' );
		}
	};

	return (
		<Modal
			title={ getModalTitle() }
			onRequestClose={ onClose }
			className="wpct-taxonomy-modal"
			size="medium"
		>
			<div className="wpct-taxonomy-modal__content">
				{ screen === 'choice' && (
					<ChoiceScreen
						onAddExisting={ () => setScreen( 'existing' ) }
						onCreateNew={ () => setScreen( 'create' ) }
						hasExistingTaxonomies={ hasExistingTaxonomies }
					/>
				) }
				{ screen === 'existing' && (
					<AddExistingScreen
						availableTaxonomies={ availableTaxonomies }
						onSelect={ handleAddExisting }
						onBack={ () => setScreen( 'choice' ) }
						isLoading={ isLoading }
					/>
				) }
				{ screen === 'create' && (
					<CreateNewScreen
						onSave={ handleCreateNew }
						onBack={ () => setScreen( 'choice' ) }
						isLoading={ isLoading }
					/>
				) }
			</div>
		</Modal>
	);
}
