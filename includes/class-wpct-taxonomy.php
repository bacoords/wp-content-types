<?php
/**
 * Taxonomy model and storage.
 *
 * @package WP_Content_Types
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Taxonomy model and storage class.
 *
 * Handles CRUD operations for taxonomies stored in the database.
 */
class WPCT_Taxonomy {

	const POST_TYPE = 'wp_content_taxonomy';

	/**
	 * Initialize the taxonomy storage.
	 */
	public static function init() {
		self::register_post_type();
		self::register_rest_fields();
	}

	/**
	 * Register the post type used to store taxonomy definitions.
	 */
	private static function register_post_type() {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'       => array(
					'name'          => __( 'Content Taxonomies', 'wp-content-types' ),
					'singular_name' => __( 'Content Taxonomy', 'wp-content-types' ),
				),
				'public'       => false,
				'show_ui'      => false,
				'show_in_rest' => true,
				'rest_base'    => 'content-taxonomies',
				'supports'     => array( 'title', 'custom-fields' ),
			)
		);
	}

	/**
	 * Register REST fields for the taxonomy.
	 */
	private static function register_rest_fields() {
		register_rest_field(
			self::POST_TYPE,
			'config',
			array(
				'get_callback'    => function ( $post ) {
					$decoded = json_decode( get_post_field( 'post_content', $post['id'] ), true );
					return $decoded ? $decoded : array();
				},
				'update_callback' => function ( $value, $post ) {
					wp_update_post(
						array(
							'ID'           => $post->ID,
							'post_content' => wp_json_encode( $value ),
						)
					);
				},
				'schema'          => array(
					'type'        => 'object',
					'description' => __( 'Taxonomy configuration.', 'wp-content-types' ),
				),
			)
		);
	}

	/**
	 * Get all stored taxonomies.
	 *
	 * @return array
	 */
	public static function get_all() {
		$posts = get_posts(
			array(
				'post_type'      => self::POST_TYPE,
				'posts_per_page' => -1,
				'post_status'    => 'publish',
			)
		);

		return array_map( array( __CLASS__, 'format' ), $posts );
	}

	/**
	 * Get a single taxonomy by ID.
	 *
	 * @param int $id Post ID.
	 * @return array|null
	 */
	public static function get( $id ) {
		$post = get_post( $id );

		if ( ! $post || self::POST_TYPE !== $post->post_type ) {
			return null;
		}

		return self::format( $post );
	}

	/**
	 * Get a taxonomy by its slug.
	 *
	 * @param string $slug Taxonomy slug.
	 * @return array|null
	 */
	public static function get_by_slug( $slug ) {
		$posts = get_posts(
			array(
				'post_type'      => self::POST_TYPE,
				'posts_per_page' => 1,
				'post_status'    => 'publish',
				'name'           => $slug,
			)
		);

		if ( empty( $posts ) ) {
			return null;
		}

		return self::format( $posts[0] );
	}

	/**
	 * Create a new taxonomy.
	 *
	 * @param array $data Taxonomy data.
	 * @return int|WP_Error
	 */
	public static function create( $data ) {
		$post_id = wp_insert_post(
			array(
				'post_type'    => self::POST_TYPE,
				'post_title'   => sanitize_text_field( $data['name'] ?? '' ),
				'post_name'    => sanitize_key( $data['slug'] ?? '' ),
				'post_content' => wp_json_encode( $data['config'] ?? array() ),
				'post_status'  => 'publish',
			)
		);

		return $post_id;
	}

	/**
	 * Update a taxonomy.
	 *
	 * @param int   $id   Post ID.
	 * @param array $data Taxonomy data.
	 * @return int|WP_Error
	 */
	public static function update( $id, $data ) {
		$update = array( 'ID' => $id );

		if ( isset( $data['name'] ) ) {
			$update['post_title'] = sanitize_text_field( $data['name'] );
		}

		if ( isset( $data['slug'] ) ) {
			$update['post_name'] = sanitize_key( $data['slug'] );
		}

		if ( isset( $data['config'] ) ) {
			$update['post_content'] = wp_json_encode( $data['config'] );
		}

		return wp_update_post( $update );
	}

	/**
	 * Delete a taxonomy.
	 *
	 * @param int $id Post ID.
	 * @return WP_Post|false|null
	 */
	public static function delete( $id ) {
		return wp_delete_post( $id, true );
	}

	/**
	 * Format a post object as taxonomy data.
	 *
	 * @param WP_Post $post Post object.
	 * @return array
	 */
	private static function format( $post ) {
		$config = json_decode( $post->post_content, true );
		return array(
			'id'     => $post->ID,
			'name'   => $post->post_title,
			'slug'   => $post->post_name,
			'config' => $config ? $config : array(),
			'source' => 'database',
		);
	}
}
