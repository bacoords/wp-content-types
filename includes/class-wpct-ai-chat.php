<?php
/**
 * AI Chat REST API endpoint.
 *
 * Provides a chat interface that uses WordPress AI Client to execute abilities.
 *
 * @package WP_Content_Types
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * AI Chat class for REST API endpoint.
 *
 * Provides a chat interface that uses WordPress AI Client to execute abilities.
 */
class WPCT_AI_Chat {

	/**
	 * Initialize the AI Chat endpoint.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Register REST API routes.
	 */
	public static function register_routes() {
		register_rest_route(
			'wp-content-types/v1',
			'/ai/chat',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_chat' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'args'                => array(
					'message'         => array(
						'required'    => true,
						'type'        => 'string',
						'description' => 'User message to the AI assistant.',
					),
					'content_type_id' => array(
						'required'    => false,
						'type'        => array( 'integer', 'string' ),
						'description' => 'Current content type ID or slug being edited.',
					),
					'context'         => array(
						'required'    => false,
						'type'        => 'object',
						'description' => 'Additional context about the current state.',
					),
				),
			)
		);
	}

	/**
	 * Permission callback - requires manage_options capability.
	 *
	 * @return bool
	 */
	public static function permission_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Handle chat request.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function handle_chat( $request ) {
		// Check if AI Client is available.
		if ( ! function_exists( 'wp_ai_client_prompt' ) ) {
			return new WP_Error(
				'ai_client_unavailable',
				__( 'WordPress AI Client is not available. Please ensure WordPress 7.0+ is installed.', 'wp-content-types' ),
				array( 'status' => 503 )
			);
		}

		$message         = $request->get_param( 'message' );
		$content_type_id = $request->get_param( 'content_type_id' );
		$context         = $request->get_param( 'context' ) ?? array();

		// Build the system instruction.
		$system_instruction = self::get_system_instruction( $content_type_id, $context );

		// Define the response schema.
		// Note: input is a JSON string because the API doesn't support additionalProperties: true.
		$response_schema = array(
			'type'                 => 'object',
			'additionalProperties' => false,
			'properties'           => array(
				'message'   => array(
					'type'        => 'string',
					'description' => 'Friendly response message to display to the user.',
				),
				'abilities' => array(
					'type'        => 'array',
					'description' => 'List of abilities to execute.',
					'items'       => array(
						'type'                 => 'object',
						'additionalProperties' => false,
						'properties'           => array(
							'ability_id' => array(
								'type'        => 'string',
								'description' => 'The ability identifier to execute.',
							),
							'input_json' => array(
								'type'        => 'string',
								'description' => 'JSON string of input parameters for the ability.',
							),
						),
						'required'             => array( 'ability_id', 'input_json' ),
					),
				),
			),
			'required'             => array( 'message' ),
		);

		try {
			// Call the AI Client.
			$ai_response = wp_ai_client_prompt( $message )
				->using_system_instruction( $system_instruction )
				->as_json_response( $response_schema )
				->generate_text();

			if ( is_wp_error( $ai_response ) ) {
				return new WP_Error(
					'ai_request_failed',
					$ai_response->get_error_message(),
					array( 'status' => 500 )
				);
			}

			// Parse the JSON response.
			$parsed_response = json_decode( $ai_response, true );

			if ( json_last_error() !== JSON_ERROR_NONE ) {
				return new WP_Error(
					'invalid_ai_response',
					__( 'Failed to parse AI response.', 'wp-content-types' ),
					array( 'status' => 500 )
				);
			}

			// Parse abilities and their inputs for the client.
			$abilities = array();
			if ( ! empty( $parsed_response['abilities'] ) && is_array( $parsed_response['abilities'] ) ) {
				foreach ( $parsed_response['abilities'] as $ability_call ) {
					$ability_id = $ability_call['ability_id'] ?? '';
					$input_json = $ability_call['input_json'] ?? '{}';

					// Parse the input JSON string.
					$input = json_decode( $input_json, true );
					if ( json_last_error() !== JSON_ERROR_NONE ) {
						$input = array();
					}

					$abilities[] = array(
						'ability_id' => $ability_id,
						'input'      => $input,
					);
				}
			}

			// Return response without executing - client will apply changes.
			return rest_ensure_response(
				array(
					'success'   => true,
					'message'   => $parsed_response['message'] ?? '',
					'abilities' => $abilities,
				)
			);

		} catch ( Exception $e ) {
			return new WP_Error(
				'ai_chat_error',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}
	}

	/**
	 * Get system instruction for the AI.
	 *
	 * @param int|string|null $content_type_id Current content type ID or slug.
	 * @param array           $context         Additional context from the client.
	 * @return string
	 */
	private static function get_system_instruction( $content_type_id, $context ) {
		// Load the system instruction from the dedicated file.
		$instruction_file = WPCT_PATH . 'includes/ai/system-instruction.php';

		if ( file_exists( $instruction_file ) ) {
			$content_type_context = self::get_content_type_context( $content_type_id, $context );
			return include $instruction_file;
		}

		// Fallback instruction if file doesn't exist.
		return 'You are an assistant that helps manage WordPress content types.';
	}

	/**
	 * Get context about the current content type.
	 *
	 * @param int|string|null $content_type_id Content type ID or slug.
	 * @param array           $client_context  Context from the client including current fields.
	 * @return array
	 */
	private static function get_content_type_context( $content_type_id, $client_context = array() ) {
		if ( empty( $content_type_id ) ) {
			return array(
				'mode'   => 'create',
				'exists' => false,
				'fields' => $client_context['currentFields'] ?? array(),
			);
		}

		// Try to get content type by ID.
		if ( is_numeric( $content_type_id ) ) {
			$content_type = WPCT_Content_Type::get( $content_type_id );
		} else {
			// Try to get from registry by slug.
			$content_type = WPCT_Registry::get( $content_type_id );
		}

		if ( ! $content_type ) {
			return array(
				'mode'   => 'create',
				'exists' => false,
				'fields' => $client_context['currentFields'] ?? array(),
			);
		}

		// Use client-provided fields if available (includes unsaved changes),
		// otherwise fall back to saved fields.
		$current_fields = ! empty( $client_context['currentFields'] )
			? $client_context['currentFields']
			: ( $content_type['config']['fields'] ?? array() );

		return array(
			'mode'   => 'edit',
			'exists' => true,
			'id'     => $content_type['id'] ?? null,
			'name'   => $content_type['name'] ?? '',
			'slug'   => $content_type['slug'] ?? '',
			'source' => $content_type['source'] ?? 'database',
			'fields' => $current_fields,
		);
	}

	/**
	 * Execute an ability.
	 *
	 * @param string $ability_id The ability identifier.
	 * @param array  $input      Input parameters.
	 * @return array
	 */
	private static function execute_ability( $ability_id, $input ) {
		// Check if the Abilities API is available.
		if ( ! function_exists( 'wp_execute_ability' ) ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'abilities_unavailable',
					'message' => __( 'Abilities API is not available.', 'wp-content-types' ),
				),
			);
		}

		// Validate the ability exists and is in our category.
		$valid_abilities = array(
			'content-types/list',
			'content-types/get',
			'content-types/create',
			'content-types/update',
			'content-types/delete',
			'content-types/fields-list',
			'content-types/fields-add',
			'content-types/fields-update',
			'content-types/fields-remove',
		);

		if ( ! in_array( $ability_id, $valid_abilities, true ) ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'invalid_ability',
					'message' => sprintf(
						/* translators: %s: ability ID */
						__( 'Unknown ability: %s', 'wp-content-types' ),
						$ability_id
					),
				),
			);
		}

		// Execute the ability.
		$result = wp_execute_ability( $ability_id, $input );

		if ( is_wp_error( $result ) ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => $result->get_error_code(),
					'message' => $result->get_error_message(),
				),
			);
		}

		return $result;
	}
}
