/**
 * Content Type Editor App
 *
 * Editor screen for editing content type configuration.
 * Uses a custom layout with WordPress components (similar to the official tutorial).
 */
import { useEntityRecord } from '@wordpress/core-data';
import {
	Button,
	Panel,
	PanelBody,
	PanelRow,
	TextControl,
	ToggleControl,
	Spinner,
	SlotFillProvider,
	Popover,
	NavigableMenu,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

const contentTypeId = window.wpctSettings?.contentTypeId;

/**
 * Editor Header component
 */
function EditorHeader( { title, isSaving, hasEdits, onSave } ) {
	return (
		<div
			className="wpct-editor__header"
			role="region"
			aria-label={ __( 'Editor top bar', 'wp-content-types' ) }
			tabIndex="-1"
		>
			<h1 className="wpct-editor__title">
				{ title || __( 'New Content Type', 'wp-content-types' ) }
			</h1>
			<div className="wpct-editor__header-actions">
				{ hasEdits && (
					<span className="wpct-editor__unsaved">
						{ __( 'Unsaved changes', 'wp-content-types' ) }
					</span>
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

/**
 * Editor Sidebar component
 */
function EditorSidebar() {
	return (
		<div
			className="wpct-editor__sidebar"
			role="region"
			aria-label={ __( 'Content Type Settings', 'wp-content-types' ) }
			tabIndex="-1"
		>
			<Panel>
				<PanelBody
					title={ __( 'Settings', 'wp-content-types' ) }
					initialOpen={ true }
				>
					<PanelRow>
						<p className="wpct-editor__sidebar-info">
							{ __( 'Content type settings will appear here.', 'wp-content-types' ) }
						</p>
					</PanelRow>
				</PanelBody>
				<PanelBody
					title={ __( 'Visibility', 'wp-content-types' ) }
					initialOpen={ false }
				>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Public', 'wp-content-types' ) }
						checked={ true }
						onChange={ () => {} }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show in REST API', 'wp-content-types' ) }
						checked={ true }
						onChange={ () => {} }
					/>
				</PanelBody>
			</Panel>
		</div>
	);
}

/**
 * Editor Content component - the main content area
 */
function EditorContent( { record, editedRecord, edit } ) {
	const title = editedRecord?.title ?? record?.title?.rendered ?? '';

	return (
		<div
			className="wpct-editor__content"
			role="region"
			aria-label={ __( 'Content Type Editor', 'wp-content-types' ) }
			tabIndex="-1"
		>
			<div className="wpct-editor__content-inner">
				<Panel>
					<PanelBody
						title={ __( 'Basic Info', 'wp-content-types' ) }
						initialOpen={ true }
					>
						<TextControl
							__nextHasNoMarginBottom
							label={ __( 'Name', 'wp-content-types' ) }
							value={ title }
							onChange={ ( value ) => edit( { title: value } ) }
							placeholder={ __( 'e.g. Book', 'wp-content-types' ) }
							help={ __( 'The singular name for this content type.', 'wp-content-types' ) }
						/>
					</PanelBody>
					<PanelBody
						title={ __( 'Fields', 'wp-content-types' ) }
						initialOpen={ true }
					>
						<p className="wpct-editor__placeholder">
							{ __( 'Field configuration will go here.', 'wp-content-types' ) }
						</p>
						<Button variant="secondary">
							{ __( 'Add Field', 'wp-content-types' ) }
						</Button>
					</PanelBody>
				</Panel>
			</div>
		</div>
	);
}

/**
 * Main Editor App
 */
export default function App() {
	const { record, editedRecord, hasEdits, edit, save, isSaving, hasResolved } =
		useEntityRecord( 'postType', 'wp_content_type', contentTypeId );

	const title = editedRecord?.title ?? record?.title?.rendered ?? '';

	const handleSave = async () => {
		await save();
	};

	// Add class to body for full-screen editor styling
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
					/>
					<EditorSidebar />
				</div>
			</div>
			<Popover.Slot />
		</SlotFillProvider>
	);
}
