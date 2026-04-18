<?php
/**
 * Custom REST Controller for Content Types.
 *
 * Extends WP_REST_Posts_Controller to return merged hardcoded + database types.
 * This follows the same pattern Gutenberg uses for wp_template.
 *
 * @package WP_Content_Types
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST controller for content types.
 *
 * Extends WP_REST_Posts_Controller to return merged hardcoded + database types.
 */
class WPCT_REST_Controller extends WP_REST_Posts_Controller {

	/**
	 * Get items - returns merged content types from registry.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function get_items( $request ) {
		$merged_types = WPCT_Registry::get_all();

		$response = array();
		foreach ( $merged_types as $content_type ) {
			$data       = $this->prepare_merged_item( $content_type, $request );
			$response[] = $this->prepare_response_for_collection( $data );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Get a single item.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function get_item( $request ) {
		$id = $request->get_param( 'id' );

		// Check if this is a slug-based lookup for hardcoded types.
		if ( ! is_numeric( $id ) ) {
			$content_type = WPCT_Registry::get( $id );
			if ( $content_type ) {
				return rest_ensure_response( $this->prepare_merged_item( $content_type, $request ) );
			}
			return new WP_Error( 'rest_post_invalid_id', __( 'Invalid content type ID.', 'wp-content-types' ), array( 'status' => 404 ) );
		}

		// First try to get from database.
		$post = get_post( $id );

		if ( $post && WPCT_Content_Type::POST_TYPE === $post->post_type ) {
			// Get merged version if it exists.
			$merged = WPCT_Registry::get( $post->post_name );
			if ( $merged ) {
				return rest_ensure_response( $this->prepare_merged_item( $merged, $request ) );
			}

			// Fall back to parent implementation.
			return parent::get_item( $request );
		}

		return new WP_Error( 'rest_post_invalid_id', __( 'Invalid content type ID.', 'wp-content-types' ), array( 'status' => 404 ) );
	}

	/**
	 * Prepare a merged content type item for response.
	 *
	 * @param array           $content_type Merged content type data.
	 * @param WP_REST_Request $request      Request object.
	 * @return array Prepared response data.
	 */
	protected function prepare_merged_item( $content_type, $request ) {
		$data = array(
			'id'     => $content_type['id'] ?? 'hardcoded-' . sanitize_key( $content_type['slug'] ),
			'title'  => array(
				'rendered' => $content_type['name'],
				'raw'      => $content_type['name'],
			),
			'slug'   => $content_type['slug'],
			'config' => $content_type['config'],
			'source' => $content_type['source'],
			'status' => 'publish',
			'type'   => WPCT_Content_Type::POST_TYPE,
		);

		// Add link for hardcoded types without database ID.
		if ( null === $content_type['id'] ) {
			$data['_links'] = array(
				'self' => array(
					array(
						'href' => rest_url( sprintf( '%s/%s/%s', 'wp/v2', 'content-types', $content_type['slug'] ) ),
					),
				),
			);
		}

		return $data;
	}

	/**
	 * Prepare item for response - adds source field.
	 *
	 * @param WP_Post         $item    Post object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );
		$data     = $response->get_data();

		// Check if this is a merged type.
		$merged = WPCT_Registry::get( $item->post_name );

		if ( $merged ) {
			$data['source'] = $merged['source'];
			$data['config'] = $merged['config'];
		} else {
			$data['source'] = 'database';
		}

		$response->set_data( $data );

		return $response;
	}

	/**
	 * Check if a given request has access to delete an item.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool|WP_Error True if the request has access, WP_Error otherwise.
	 */
	public function delete_item_permissions_check( $request ) {
		$parent_check = parent::delete_item_permissions_check( $request );

		if ( is_wp_error( $parent_check ) ) {
			return $parent_check;
		}

		// Block deletion of hardcoded/merged types.
		$id   = $request->get_param( 'id' );
		$post = get_post( $id );

		if ( $post ) {
			$merged = WPCT_Registry::get( $post->post_name );
			if ( $merged && 'database' !== $merged['source'] ) {
				return new WP_Error(
					'rest_cannot_delete_hardcoded',
					__( 'Cannot delete a core content type.', 'wp-content-types' ),
					array( 'status' => 403 )
				);
			}
		}

		return true;
	}

	/**
	 * Register additional REST routes for slug-based access to hardcoded types.
	 */
	public function register_routes() {
		parent::register_routes();

		// Add route for accessing hardcoded types by slug.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<slug>[a-z0-9_-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item_by_slug' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'slug' => array(
							'description' => __( 'Content type slug.', 'wp-content-types' ),
							'type'        => 'string',
						),
					),
				),
			)
		);
	}

	/**
	 * Get item by slug - for hardcoded types without database ID.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error on failure.
	 */
	public function get_item_by_slug( $request ) {
		$slug         = $request->get_param( 'slug' );
		$content_type = WPCT_Registry::get( $slug );

		if ( ! $content_type ) {
			return new WP_Error(
				'rest_post_invalid_slug',
				__( 'Invalid content type slug.', 'wp-content-types' ),
				array( 'status' => 404 )
			);
		}

		return rest_ensure_response( $this->prepare_merged_item( $content_type, $request ) );
	}
}
