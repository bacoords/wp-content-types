/**
 * Post Editor App
 *
 * Block editor screen for editing posts of custom content types.
 */
import { useState } from '@wordpress/element';
import {
	Button,
	Panel,
	PanelBody,
	PanelRow,
	TextControl,
	TextareaControl,
	SelectControl,
	Spinner,
	SlotFillProvider,
	Popover,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Editor Header component
 */
function EditorHeader( { title, isSaving, hasEdits, onSave } ) {
	return (
		<div className="wpct-editor__header">
			<div className="wpct-editor__header-left">
				<h1 className="wpct-editor__title">
					{ title || __( 'Edit Post', 'wp-content-types' ) }
				</h1>
				{ hasEdits && (
					<span className="wpct-editor__unsaved-indicator">
						{ __( 'Unsaved changes', 'wp-content-types' ) }
					</span>
				) }
			</div>
			<div className="wpct-editor__header-right">
				<Button variant="secondary" style={ { marginRight: '8px' } }>
					{ __( 'Preview', 'wp-content-types' ) }
				</Button>
				<Button
					variant="primary"
					onClick={ onSave }
					disabled={ isSaving || ! hasEdits }
				>
					{ isSaving ? (
						<>
							<Spinner />
							{ __( 'Saving…', 'wp-content-types' ) }
						</>
					) : (
						__( 'Save', 'wp-content-types' )
					) }
				</Button>
			</div>
		</div>
	);
}

/**
 * Editor Sidebar component
 */
function EditorSidebar() {
	const [ status, setStatus ] = useState( 'draft' );

	return (
		<div className="wpct-editor__sidebar">
			<Panel>
				<PanelBody
					title={ __( 'Status', 'wp-content-types' ) }
					initialOpen={ true }
				>
					<PanelRow>
						<SelectControl
							label={ __( 'Status', 'wp-content-types' ) }
							value={ status }
							options={ [
								{ label: __( 'Draft', 'wp-content-types' ), value: 'draft' },
								{ label: __( 'Published', 'wp-content-types' ), value: 'publish' },
								{ label: __( 'Pending Review', 'wp-content-types' ), value: 'pending' },
							] }
							onChange={ setStatus }
						/>
					</PanelRow>
				</PanelBody>
				<PanelBody
					title={ __( 'Metadata', 'wp-content-types' ) }
					initialOpen={ false }
				>
					<PanelRow>
						<p className="wpct-editor__sidebar-info">
							{ __( 'Post metadata will appear here.', 'wp-content-types' ) }
						</p>
					</PanelRow>
				</PanelBody>
			</Panel>
		</div>
	);
}

/**
 * Editor Canvas component - the main content area with fields
 */
function EditorCanvas( { onEdit } ) {
	const [ title, setTitle ] = useState( '' );
	const [ author, setAuthor ] = useState( '' );
	const [ year, setYear ] = useState( '' );
	const [ isbn, setIsbn ] = useState( '' );
	const [ summary, setSummary ] = useState( '' );

	const handleChange = ( setter ) => ( value ) => {
		setter( value );
		onEdit();
	};

	return (
		<div className="wpct-editor__canvas">
			<div className="wpct-editor__canvas-inner">
				<Notice status="info" isDismissible={ false }>
					{ __( 'This is a prototype. Fields shown are examples for a "Book" content type.', 'wp-content-types' ) }
				</Notice>

				<Panel>
					<PanelBody
						title={ __( 'Book Details', 'wp-content-types' ) }
						initialOpen={ true }
					>
						<TextControl
							label={ __( 'Title', 'wp-content-types' ) }
							value={ title }
							onChange={ handleChange( setTitle ) }
							placeholder={ __( 'Enter book title…', 'wp-content-types' ) }
						/>
						<TextControl
							label={ __( 'Author', 'wp-content-types' ) }
							value={ author }
							onChange={ handleChange( setAuthor ) }
							placeholder={ __( 'Enter author name…', 'wp-content-types' ) }
						/>
						<TextControl
							label={ __( 'Year Published', 'wp-content-types' ) }
							value={ year }
							onChange={ handleChange( setYear ) }
							type="number"
							placeholder={ __( 'e.g. 2024', 'wp-content-types' ) }
						/>
						<TextControl
							label={ __( 'ISBN', 'wp-content-types' ) }
							value={ isbn }
							onChange={ handleChange( setIsbn ) }
							placeholder={ __( 'e.g. 978-3-16-148410-0', 'wp-content-types' ) }
						/>
					</PanelBody>
					<PanelBody
						title={ __( 'Summary', 'wp-content-types' ) }
						initialOpen={ true }
					>
						<TextareaControl
							label={ __( 'Book Summary', 'wp-content-types' ) }
							value={ summary }
							onChange={ handleChange( setSummary ) }
							placeholder={ __( 'Write a brief summary of the book…', 'wp-content-types' ) }
							rows={ 6 }
						/>
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
	const [ isSaving, setIsSaving ] = useState( false );
	const [ hasEdits, setHasEdits ] = useState( false );

	const handleSave = () => {
		setIsSaving( true );
		// Simulate save
		setTimeout( () => {
			setIsSaving( false );
			setHasEdits( false );
		}, 1000 );
	};

	const handleEdit = () => {
		setHasEdits( true );
	};

	return (
		<SlotFillProvider>
			<div className="wpct-editor">
				<EditorHeader
					title={ __( 'Edit Book', 'wp-content-types' ) }
					isSaving={ isSaving }
					hasEdits={ hasEdits }
					onSave={ handleSave }
				/>
				<div className="wpct-editor__body">
					<EditorCanvas onEdit={ handleEdit } />
					<EditorSidebar />
				</div>
			</div>
			<Popover.Slot />
		</SlotFillProvider>
	);
}
