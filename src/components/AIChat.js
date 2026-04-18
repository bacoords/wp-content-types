/**
 * AI Chat Component
 *
 * Provides a chat interface for interacting with the AI assistant
 * to create and modify content types and fields.
 */
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { Button, TextControl, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Maximum number of messages to keep in state to prevent unbounded memory growth.
 */
const MAX_MESSAGES = 100;

/**
 * Debounce delay for scroll operations in milliseconds.
 */
const SCROLL_DEBOUNCE_MS = 150;

function ChatMessage( { message, isUser, isError } ) {
	const className = [
		'wpct-chat__message',
		isUser ? 'wpct-chat__message--user' : 'wpct-chat__message--assistant',
		isError ? 'wpct-chat__message--error' : '',
	]
		.filter( Boolean )
		.join( ' ' );

	return <div className={ className }>{ message }</div>;
}

function AppliedChange( { ability, success, error } ) {
	const className = `wpct-chat__ability ${
		success ? 'wpct-chat__ability--success' : 'wpct-chat__ability--error'
	}`;

	// Format the ability ID for display.
	const abilityName = ability.ability_id
		.replace( 'content-types/', '' )
		.replace( /-/g, ' ' );

	// Get a description of what was done.
	const getDescription = () => {
		const { input } = ability;
		if ( ability.ability_id === 'content-types/fields-add' ) {
			return `${ input.label || input.key } (${ input.type })`;
		}
		if ( ability.ability_id === 'content-types/fields-remove' ) {
			return input.field_key;
		}
		if ( ability.ability_id === 'content-types/fields-update' ) {
			return input.field_key;
		}
		if ( ability.ability_id === 'content-types/create' ) {
			return input.name || input.slug;
		}
		return '';
	};

	const description = getDescription();

	return (
		<div className={ className }>
			<span className="wpct-chat__ability-icon">
				{ success ? '✓' : '✗' }
			</span>
			<span className="wpct-chat__ability-name">
				{ abilityName }
				{ description && `: ${ description }` }
			</span>
			{ ! success && error && (
				<span className="wpct-chat__ability-error">{ error }</span>
			) }
		</div>
	);
}

/**
 * AI Chat Component
 *
 * @param {Object}   props                      Component props.
 * @param {string}   props.mode                 Mode: 'create' for new content types, 'edit' for existing.
 * @param {number}   props.contentTypeId        ID of content type being edited (edit mode only).
 * @param {string}   props.contentTypeSlug      Slug of content type being edited (edit mode only).
 * @param {Object}   props.fieldsManager        Hook for field CRUD operations (edit mode only).
 * @param {Array}    props.currentFields        Current fields array for context.
 * @param {Function} props.onContentTypeCreated Callback when a new content type is created (create mode).
 */
export default function AIChat( {
	mode = 'edit',
	contentTypeId,
	contentTypeSlug,
	fieldsManager,
	currentFields = [],
	onContentTypeCreated,
} ) {
	const [ messages, setMessages ] = useState( [] );
	const [ inputValue, setInputValue ] = useState( '' );
	const [ isLoading, setIsLoading ] = useState( false );
	const messagesEndRef = useRef( null );
	const scrollTimeoutRef = useRef( null );

	/**
	 * Add messages while enforcing the maximum limit.
	 * This prevents unbounded memory growth during long chat sessions.
	 */
	const addMessage = useCallback( ( newMessage ) => {
		setMessages( ( prev ) => {
			const updated = [ ...prev, newMessage ];
			// Trim to max messages if needed
			if ( updated.length > MAX_MESSAGES ) {
				return updated.slice( -MAX_MESSAGES );
			}
			return updated;
		} );
	}, [] );

	// Debounced scroll to bottom when messages change.
	// Prevents excessive scroll operations during rapid message additions.
	useEffect( () => {
		// Clear any pending scroll
		if ( scrollTimeoutRef.current ) {
			clearTimeout( scrollTimeoutRef.current );
		}

		// Debounce the scroll operation
		scrollTimeoutRef.current = setTimeout( () => {
			messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
		}, SCROLL_DEBOUNCE_MS );

		// Cleanup on unmount or when messages change again
		return () => {
			if ( scrollTimeoutRef.current ) {
				clearTimeout( scrollTimeoutRef.current );
			}
		};
	}, [ messages ] );

	/**
	 * Apply a field-related ability to the local state.
	 * Returns synchronous result for field operations.
	 */
	const applyFieldAbility = useCallback(
		( ability ) => {
			const { ability_id: abilityId, input } = ability;

			try {
				switch ( abilityId ) {
					case 'content-types/fields-add':
						if ( fieldsManager?.addField ) {
							fieldsManager.addField( {
								key: input.key,
								label: input.label || input.key,
								type: input.type || 'text',
								config: input.config || {},
							} );
							return { success: true };
						}
						return {
							success: false,
							error: __(
								'Field manager not available',
								'wp-content-types'
							),
						};

					case 'content-types/fields-remove':
						if ( fieldsManager?.deleteFieldByKey ) {
							const deleted = fieldsManager.deleteFieldByKey(
								input.field_key
							);
							if ( deleted ) {
								return { success: true };
							}
							return {
								success: false,
								error: __(
									'Field not found',
									'wp-content-types'
								),
							};
						}
						return {
							success: false,
							error: __(
								'Field manager not available',
								'wp-content-types'
							),
						};

					case 'content-types/fields-update':
						if ( fieldsManager?.updateFieldByKey ) {
							// Build edits object with only defined properties
							const edits = {};
							if ( input.label !== undefined ) {
								edits.label = input.label;
							}
							if ( input.type !== undefined ) {
								edits.type = input.type;
							}
							if ( input.required !== undefined ) {
								edits.required = input.required;
							}
							if ( input.config !== undefined ) {
								edits.config = input.config;
							}

							const updated = fieldsManager.updateFieldByKey(
								input.field_key,
								edits
							);
							if ( updated ) {
								return { success: true };
							}
							return {
								success: false,
								error: __(
									'Field not found',
									'wp-content-types'
								),
							};
						}
						return {
							success: false,
							error: __(
								'Field manager not available',
								'wp-content-types'
							),
						};

					default:
						return {
							success: false,
							error: __(
								'Action not supported in editor',
								'wp-content-types'
							),
						};
				}
			} catch ( err ) {
				return { success: false, error: err.message };
			}
		},
		[ fieldsManager ]
	);

	/**
	 * Create a new content type via the REST API.
	 * Returns the created content type data.
	 */
	const createContentType = useCallback( async ( input ) => {
		try {
			// Build the content type data.
			const contentTypeData = {
				title: input.name,
				slug: input.slug,
				status: 'publish',
				config: {
					public: input.config?.public ?? true,
					has_archive: input.config?.has_archive ?? true,
					supports: input.config?.supports ?? [
						'title',
						'editor',
						'thumbnail',
						'custom-fields',
					],
					fields: input.fields || [],
					...( input.config || {} ),
				},
			};

			const response = await apiFetch( {
				path: '/wp/v2/content-types',
				method: 'POST',
				data: contentTypeData,
			} );

			return { success: true, data: response };
		} catch ( err ) {
			return {
				success: false,
				error:
					err.message ||
					__( 'Failed to create content type', 'wp-content-types' ),
			};
		}
	}, [] );

	const handleSubmit = async ( e ) => {
		e?.preventDefault();

		const trimmedInput = inputValue.trim();
		if ( ! trimmedInput || isLoading ) {
			return;
		}

		// Add user message.
		const userMessage = {
			id: Date.now(),
			text: trimmedInput,
			isUser: true,
		};
		addMessage( userMessage );
		setInputValue( '' );
		setIsLoading( true );

		try {
			// Prepare current fields for context (strip internal _id).
			const fieldsForContext = ( currentFields || [] ).map( ( f ) => ( {
				key: f.key,
				label: f.label,
				type: f.type,
			} ) );

			// Build request data based on mode.
			const requestData = {
				message: trimmedInput,
				context: {
					currentFields: fieldsForContext,
				},
			};

			// In edit mode, include content type info.
			if ( mode === 'edit' && ( contentTypeId || contentTypeSlug ) ) {
				requestData.content_type_id = contentTypeId || contentTypeSlug;
				requestData.context.contentTypeId = contentTypeId;
				requestData.context.contentTypeSlug = contentTypeSlug;
			}

			const response = await apiFetch( {
				path: '/wp-content-types/v1/ai/chat',
				method: 'POST',
				data: requestData,
			} );

			// Check if response indicates an error.
			if ( response.success === false || response.code ) {
				throw new Error(
					response.message || response.code || 'Unknown error'
				);
			}

			// Apply abilities client-side.
			// Batch field additions to handle multiple at once.
			const appliedChanges = [];
			const fieldsToAdd = [];
			const fieldAbilities = [];
			const createAbilities = [];

			// Separate abilities by type.
			if ( response.abilities?.length > 0 ) {
				for ( const ability of response.abilities ) {
					if ( ability.ability_id === 'content-types/fields-add' ) {
						fieldsToAdd.push( ability );
					} else if (
						ability.ability_id === 'content-types/create'
					) {
						createAbilities.push( ability );
					} else if (
						ability.ability_id.startsWith( 'content-types/fields-' )
					) {
						fieldAbilities.push( ability );
					}
				}
			}

			// Handle content type creation first.
			// If we're also adding fields, include them in the content type config.
			let createdContentType = null;
			for ( const ability of createAbilities ) {
				const input = { ...ability.input };

				// In create mode, include any fields-add abilities in the config.
				if ( mode === 'create' && fieldsToAdd.length > 0 ) {
					const fieldsForConfig = fieldsToAdd.map(
						( fieldAbility ) => ( {
							key: fieldAbility.input.key,
							label:
								fieldAbility.input.label ||
								fieldAbility.input.key,
							type: fieldAbility.input.type || 'text',
							config: fieldAbility.input.config || {},
						} )
					);
					input.config = input.config || {};
					input.config.fields = [
						...( input.config.fields || [] ),
						...fieldsForConfig,
					];
				}

				const result = await createContentType( input );
				appliedChanges.push( { ability, ...result } );
				if ( result.success && result.data ) {
					createdContentType = result.data;
					// Mark field abilities as successful since they were included.
					if ( mode === 'create' ) {
						for ( const fieldAbility of fieldsToAdd ) {
							appliedChanges.push( {
								ability: fieldAbility,
								success: true,
							} );
						}
						// Clear fieldsToAdd so we don't try to add them again.
						fieldsToAdd.length = 0;
					}
				}
			}

			// Batch add all fields at once using fieldsManager.
			if ( fieldsToAdd.length > 0 && fieldsManager?.addFields ) {
				try {
					const fieldDataArray = fieldsToAdd.map( ( ability ) => ( {
						key: ability.input.key,
						label: ability.input.label || ability.input.key,
						type: ability.input.type || 'text',
						config: ability.input.config || {},
					} ) );
					fieldsManager.addFields( fieldDataArray );
					// Mark all as successful.
					for ( const ability of fieldsToAdd ) {
						appliedChanges.push( { ability, success: true } );
					}
				} catch ( err ) {
					for ( const ability of fieldsToAdd ) {
						appliedChanges.push( {
							ability,
							success: false,
							error: err.message,
						} );
					}
				}
			} else if ( fieldsToAdd.length > 0 ) {
				// No fieldsManager available - can't add fields.
				for ( const ability of fieldsToAdd ) {
					appliedChanges.push( {
						ability,
						success: false,
						error: __(
							'Create a content type first, then add fields',
							'wp-content-types'
						),
					} );
				}
			}

			// Handle other field abilities individually.
			for ( const ability of fieldAbilities ) {
				const result = applyFieldAbility( ability );
				appliedChanges.push( { ability, ...result } );
			}

			// If a content type was created, notify via callback.
			if ( createdContentType && onContentTypeCreated ) {
				onContentTypeCreated( createdContentType );
			}

			// Add assistant message with applied changes.
			const assistantMessage = {
				id: Date.now() + 1,
				text: response.message || __( 'Done!', 'wp-content-types' ),
				isUser: false,
				appliedChanges,
			};
			addMessage( assistantMessage );
		} catch ( error ) {
			// Add error message.
			const errorMessage = {
				id: Date.now() + 1,
				text:
					error.message ||
					__(
						'Something went wrong. Please try again.',
						'wp-content-types'
					),
				isUser: false,
				isError: true,
			};
			addMessage( errorMessage );
		} finally {
			setIsLoading( false );
		}
	};

	const handleKeyDown = ( e ) => {
		if ( e.key === 'Enter' && ! e.shiftKey ) {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div className="wpct-chat">
			<div className="wpct-chat__messages">
				{ messages.length === 0 && (
					<div className="wpct-chat__empty">
						{ mode === 'create' ? (
							<>
								<p>
									{ __(
										'Describe the content type you want to create.',
										'wp-content-types'
									) }
								</p>
								<p className="wpct-chat__examples">
									{ __( 'Try:', 'wp-content-types' ) }
									<br />
									{ __(
										'"Create a content type for Events with date and location fields"',
										'wp-content-types'
									) }
									<br />
									{ __(
										'"I need a Recipe content type with ingredients and instructions"',
										'wp-content-types'
									) }
								</p>
							</>
						) : (
							<>
								<p>
									{ __(
										'Ask me to create or modify fields.',
										'wp-content-types'
									) }
								</p>
								<p className="wpct-chat__examples">
									{ __( 'Try:', 'wp-content-types' ) }
									<br />
									{ __(
										'"Add a text field called Author Name"',
										'wp-content-types'
									) }
									<br />
									{ __(
										'"Create a date field for publication date"',
										'wp-content-types'
									) }
								</p>
							</>
						) }
					</div>
				) }
				{ messages.map( ( msg ) => (
					<div key={ msg.id } className="wpct-chat__message-group">
						<ChatMessage
							message={ msg.text }
							isUser={ msg.isUser }
							isError={ msg.isError }
						/>
						{ msg.appliedChanges?.length > 0 && (
							<div className="wpct-chat__abilities">
								{ msg.appliedChanges.map( ( change, index ) => (
									<AppliedChange
										key={ index }
										ability={ change.ability }
										success={ change.success }
										error={ change.error }
									/>
								) ) }
							</div>
						) }
					</div>
				) ) }
				{ isLoading && (
					<div className="wpct-chat__loading">
						<Spinner />
					</div>
				) }
				<div ref={ messagesEndRef } />
			</div>
			<form className="wpct-chat__input" onSubmit={ handleSubmit }>
				<TextControl
					value={ inputValue }
					onChange={ setInputValue }
					onKeyDown={ handleKeyDown }
					placeholder={ __( 'Type a message…', 'wp-content-types' ) }
					disabled={ isLoading }
					__nextHasNoMarginBottom
				/>
				<Button
					variant="primary"
					type="submit"
					disabled={ ! inputValue.trim() || isLoading }
					isBusy={ isLoading }
				>
					{ __( 'Send', 'wp-content-types' ) }
				</Button>
			</form>
		</div>
	);
}
