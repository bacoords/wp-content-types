<?php
/**
 * WordPress Abilities API integration.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WPCT_Abilities {

	/**
	 * Initialize abilities registration.
	 */
	public static function init() {
		// Only register if Abilities API is available (WP 6.9+).
		if ( ! function_exists( 'wp_register_ability' ) ) {
			return;
		}

		add_action( 'wp_abilities_api_categories_init', array( __CLASS__, 'register_category' ) );
		add_action( 'wp_abilities_api_init', array( __CLASS__, 'register_abilities' ) );
	}

	/**
	 * Register the content-types category.
	 */
	public static function register_category() {
		wp_register_ability_category(
			'content-types',
			array(
				'label'       => __( 'Content Types', 'wp-content-types' ),
				'description' => __( 'Manage custom content types and their fields.', 'wp-content-types' ),
			)
		);
	}

	/**
	 * Register all abilities.
	 */
	public static function register_abilities() {
		self::register_content_type_abilities();
		self::register_field_abilities();
	}

	/**
	 * Permission callback - requires manage_options.
	 *
	 * @return bool
	 */
	public static function permission_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Register content type CRUD abilities.
	 */
	private static function register_content_type_abilities() {
		// List content types.
		wp_register_ability(
			'content-types/list',
			array(
				'label'               => __( 'List Content Types', 'wp-content-types' ),
				'description'         => __( 'Retrieve all registered content types.', 'wp-content-types' ),
				'category'            => 'content-types',
				'input_schema'        => WPCT_Schemas::list_content_types_input(),
				'output_schema'       => WPCT_Schemas::list_content_types_output(),
				'execute_callback'    => array( __CLASS__, 'execute_list_content_types' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array( 'show_in_rest' => true ),
			)
		);

		// Get single content type.
		wp_register_ability(
			'content-types/get',
			array(
				'label'               => __( 'Get Content Type', 'wp-content-types' ),
				'description'         => __( 'Retrieve a single content type by ID.', 'wp-content-types' ),
				'category'            => 'content-types',
				'input_schema'        => WPCT_Schemas::get_content_type_input(),
				'output_schema'       => WPCT_Schemas::content_type_output(),
				'execute_callback'    => array( __CLASS__, 'execute_get_content_type' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array( 'show_in_rest' => true ),
			)
		);

		// Create content type.
		wp_register_ability(
			'content-types/create',
			array(
				'label'               => __( 'Create Content Type', 'wp-content-types' ),
				'description'         => __( 'Create a new content type.', 'wp-content-types' ),
				'category'            => 'content-types',
				'input_schema'        => WPCT_Schemas::create_content_type_input(),
				'output_schema'       => WPCT_Schemas::content_type_output(),
				'execute_callback'    => array( __CLASS__, 'execute_create_content_type' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array( 'show_in_rest' => true ),
			)
		);

		// Update content type.
		wp_register_ability(
			'content-types/update',
			array(
				'label'               => __( 'Update Content Type', 'wp-content-types' ),
				'description'         => __( 'Update an existing content type.', 'wp-content-types' ),
				'category'            => 'content-types',
				'input_schema'        => WPCT_Schemas::update_content_type_input(),
				'output_schema'       => WPCT_Schemas::content_type_output(),
				'execute_callback'    => array( __CLASS__, 'execute_update_content_type' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array( 'show_in_rest' => true ),
			)
		);

		// Delete content type.
		wp_register_ability(
			'content-types/delete',
			array(
				'label'               => __( 'Delete Content Type', 'wp-content-types' ),
				'description'         => __( 'Delete a content type.', 'wp-content-types' ),
				'category'            => 'content-types',
				'input_schema'        => WPCT_Schemas::delete_content_type_input(),
				'output_schema'       => WPCT_Schemas::delete_content_type_output(),
				'execute_callback'    => array( __CLASS__, 'execute_delete_content_type' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array( 'show_in_rest' => true ),
			)
		);
	}

	/**
	 * Register field management abilities.
	 */
	private static function register_field_abilities() {
		// List fields for a content type.
		wp_register_ability(
			'content-types/fields/list',
			array(
				'label'               => __( 'List Fields', 'wp-content-types' ),
				'description'         => __( 'List all fields for a content type.', 'wp-content-types' ),
				'category'            => 'content-types',
				'input_schema'        => WPCT_Schemas::list_fields_input(),
				'output_schema'       => WPCT_Schemas::list_fields_output(),
				'execute_callback'    => array( __CLASS__, 'execute_list_fields' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array( 'show_in_rest' => true ),
			)
		);

		// Add field.
		wp_register_ability(
			'content-types/fields/add',
			array(
				'label'               => __( 'Add Field', 'wp-content-types' ),
				'description'         => __( 'Add a field to a content type.', 'wp-content-types' ),
				'category'            => 'content-types',
				'input_schema'        => WPCT_Schemas::add_field_input(),
				'output_schema'       => WPCT_Schemas::field_output(),
				'execute_callback'    => array( __CLASS__, 'execute_add_field' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array( 'show_in_rest' => true ),
			)
		);

		// Update field.
		wp_register_ability(
			'content-types/fields/update',
			array(
				'label'               => __( 'Update Field', 'wp-content-types' ),
				'description'         => __( 'Update a field in a content type.', 'wp-content-types' ),
				'category'            => 'content-types',
				'input_schema'        => WPCT_Schemas::update_field_input(),
				'output_schema'       => WPCT_Schemas::field_output(),
				'execute_callback'    => array( __CLASS__, 'execute_update_field' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array( 'show_in_rest' => true ),
			)
		);

		// Remove field.
		wp_register_ability(
			'content-types/fields/remove',
			array(
				'label'               => __( 'Remove Field', 'wp-content-types' ),
				'description'         => __( 'Remove a field from a content type.', 'wp-content-types' ),
				'category'            => 'content-types',
				'input_schema'        => WPCT_Schemas::remove_field_input(),
				'output_schema'       => WPCT_Schemas::remove_field_output(),
				'execute_callback'    => array( __CLASS__, 'execute_remove_field' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array( 'show_in_rest' => true ),
			)
		);
	}

	/**
	 * Execute: List content types.
	 *
	 * @param array $input Input parameters.
	 * @return array
	 */
	public static function execute_list_content_types( $input ) {
		$source = $input['source'] ?? 'all';

		if ( 'database' === $source ) {
			$content_types = WPCT_Content_Type::get_all();
		} elseif ( 'hardcoded' === $source ) {
			$content_types = WPCT_Registry::get_hardcoded();
		} else {
			$content_types = WPCT_Registry::get_all();
		}

		return array(
			'success' => true,
			'data'    => $content_types,
		);
	}

	/**
	 * Execute: Get single content type.
	 *
	 * @param array $input Input parameters.
	 * @return array
	 */
	public static function execute_get_content_type( $input ) {
		$content_type = WPCT_Content_Type::get( $input['id'] );

		if ( ! $content_type ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'not_found',
					'message' => __( 'Content type not found.', 'wp-content-types' ),
				),
			);
		}

		return array(
			'success' => true,
			'data'    => $content_type,
		);
	}

	/**
	 * Execute: Create content type.
	 *
	 * @param array $input Input parameters.
	 * @return array
	 */
	public static function execute_create_content_type( $input ) {
		$result = WPCT_Content_Type::create( $input );

		if ( is_wp_error( $result ) ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => $result->get_error_code(),
					'message' => $result->get_error_message(),
				),
			);
		}

		return array(
			'success' => true,
			'data'    => WPCT_Content_Type::get( $result ),
		);
	}

	/**
	 * Execute: Update content type.
	 *
	 * @param array $input Input parameters.
	 * @return array
	 */
	public static function execute_update_content_type( $input ) {
		$id = $input['id'];
		unset( $input['id'] );

		$existing = WPCT_Content_Type::get( $id );
		if ( ! $existing ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'not_found',
					'message' => __( 'Content type not found.', 'wp-content-types' ),
				),
			);
		}

		$result = WPCT_Content_Type::update( $id, $input );

		if ( is_wp_error( $result ) ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => $result->get_error_code(),
					'message' => $result->get_error_message(),
				),
			);
		}

		return array(
			'success' => true,
			'data'    => WPCT_Content_Type::get( $id ),
		);
	}

	/**
	 * Execute: Delete content type.
	 *
	 * @param array $input Input parameters.
	 * @return array
	 */
	public static function execute_delete_content_type( $input ) {
		$existing = WPCT_Content_Type::get( $input['id'] );
		if ( ! $existing ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'not_found',
					'message' => __( 'Content type not found.', 'wp-content-types' ),
				),
			);
		}

		$result = WPCT_Content_Type::delete( $input['id'] );

		if ( ! $result ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'delete_failed',
					'message' => __( 'Failed to delete content type.', 'wp-content-types' ),
				),
			);
		}

		return array(
			'success' => true,
			'message' => __( 'Content type deleted.', 'wp-content-types' ),
		);
	}

	/**
	 * Execute: List fields for a content type.
	 *
	 * @param array $input Input parameters.
	 * @return array
	 */
	public static function execute_list_fields( $input ) {
		$content_type = WPCT_Content_Type::get( $input['content_type_id'] );

		if ( ! $content_type ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'not_found',
					'message' => __( 'Content type not found.', 'wp-content-types' ),
				),
			);
		}

		$fields = WPCT_Field::get_all( $input['content_type_id'] );

		return array(
			'success' => true,
			'data'    => $fields,
		);
	}

	/**
	 * Execute: Add field to content type.
	 *
	 * @param array $input Input parameters.
	 * @return array
	 */
	public static function execute_add_field( $input ) {
		$content_type_id = $input['content_type_id'];
		unset( $input['content_type_id'] );

		$content_type = WPCT_Content_Type::get( $content_type_id );
		if ( ! $content_type ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'not_found',
					'message' => __( 'Content type not found.', 'wp-content-types' ),
				),
			);
		}

		$result = WPCT_Field::add( $content_type_id, $input );

		if ( ! $result ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'add_failed',
					'message' => __( 'Failed to add field.', 'wp-content-types' ),
				),
			);
		}

		$field = WPCT_Field::get( $content_type_id, $input['key'] );

		return array(
			'success' => true,
			'data'    => $field,
		);
	}

	/**
	 * Execute: Update field.
	 *
	 * @param array $input Input parameters.
	 * @return array
	 */
	public static function execute_update_field( $input ) {
		$content_type_id = $input['content_type_id'];
		$field_key       = $input['field_key'];
		unset( $input['content_type_id'], $input['field_key'] );

		$existing = WPCT_Field::get( $content_type_id, $field_key );
		if ( ! $existing ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'not_found',
					'message' => __( 'Field not found.', 'wp-content-types' ),
				),
			);
		}

		$result = WPCT_Field::update( $content_type_id, $field_key, $input );

		if ( ! $result ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'update_failed',
					'message' => __( 'Failed to update field.', 'wp-content-types' ),
				),
			);
		}

		$field = WPCT_Field::get( $content_type_id, $field_key );

		return array(
			'success' => true,
			'data'    => $field,
		);
	}

	/**
	 * Execute: Remove field.
	 *
	 * @param array $input Input parameters.
	 * @return array
	 */
	public static function execute_remove_field( $input ) {
		$existing = WPCT_Field::get( $input['content_type_id'], $input['field_key'] );
		if ( ! $existing ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'not_found',
					'message' => __( 'Field not found.', 'wp-content-types' ),
				),
			);
		}

		$result = WPCT_Field::remove( $input['content_type_id'], $input['field_key'] );

		if ( ! $result ) {
			return array(
				'success' => false,
				'error'   => array(
					'code'    => 'remove_failed',
					'message' => __( 'Failed to remove field.', 'wp-content-types' ),
				),
			);
		}

		return array(
			'success' => true,
			'message' => __( 'Field removed.', 'wp-content-types' ),
		);
	}
}
