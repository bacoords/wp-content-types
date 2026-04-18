<?php
/**
 * Registry for merging hardcoded and database content type definitions.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WPCT_Registry {

	/**
	 * Cached merged content types.
	 *
	 * @var array|null
	 */
	private static $cache = null;

	/**
	 * Initialize the registry.
	 */
	public static function init() {
		// Clear cache when content types are updated.
		add_action( 'save_post_' . WPCT_Content_Type::POST_TYPE, array( __CLASS__, 'clear_cache' ) );
		add_action( 'delete_post', array( __CLASS__, 'clear_cache' ) );
	}

	/**
	 * Get all content types (merged hardcoded + database).
	 *
	 * @return array
	 */
	public static function get_all() {
		if ( null !== self::$cache ) {
			return self::$cache;
		}

		$hardcoded = self::get_hardcoded();
		$database  = WPCT_Content_Type::get_all();

		self::$cache = self::merge( $hardcoded, $database );

		return self::$cache;
	}

	/**
	 * Get a single merged content type by slug.
	 *
	 * @param string $slug Content type slug.
	 * @return array|null
	 */
	public static function get( $slug ) {
		$all = self::get_all();

		foreach ( $all as $content_type ) {
			if ( $content_type['slug'] === $slug ) {
				return $content_type;
			}
		}

		return null;
	}

	/**
	 * Get hardcoded content types from registered post types.
	 *
	 * @return array
	 */
	public static function get_hardcoded() {
		$post_types = get_post_types( array(), 'objects' );
		$hardcoded  = array();

		// Get database content type slugs to exclude them from hardcoded.
		$database_types = WPCT_Content_Type::get_all();
		$database_slugs = array_column( $database_types, 'slug' );

		foreach ( $post_types as $post_type ) {
			// Skip our internal post type.
			if ( $post_type->name === WPCT_Content_Type::POST_TYPE ) {
				continue;
			}

			// Skip attachment (media) post type.
			if ( $post_type->name === 'attachment' ) {
				continue;
			}

			// Skip non-public post types unless they show in menu.
			if ( ! $post_type->public && ! $post_type->show_in_menu ) {
				continue;
			}

			// Skip post types that exist in the database (user-created types).
			// These are registered by WPCT_Post_Type_Registrar but are not "hardcoded".
			if ( in_array( $post_type->name, $database_slugs, true ) ) {
				continue;
			}

			$hardcoded[] = array(
				'id'     => null,
				'name'   => $post_type->labels->singular_name,
				'slug'   => $post_type->name,
				'config' => array(
					'labels'      => (array) $post_type->labels,
					'supports'    => get_all_post_type_supports( $post_type->name ),
					'public'      => $post_type->public,
					'has_archive' => $post_type->has_archive,
					'fields'      => self::get_hardcoded_fields( $post_type->name ),
				),
				'source' => 'hardcoded',
			);
		}

		return $hardcoded;
	}

	/**
	 * Get hardcoded fields from registered post meta.
	 *
	 * @param string $post_type Post type slug.
	 * @return array
	 */
	private static function get_hardcoded_fields( $post_type ) {
		$registered = get_registered_meta_keys( 'post', $post_type );
		$fields     = array();

		foreach ( $registered as $key => $args ) {
			// Only include meta marked as content model fields.
			if ( empty( $args['show_in_content_model'] ) ) {
				continue;
			}

			$fields[] = array(
				'key'    => $key,
				'label'  => $args['label'] ?? $key,
				'type'   => $args['content_model_type'] ?? 'text',
				'config' => $args['content_model_config'] ?? array(),
				'source' => 'hardcoded',
			);
		}

		return $fields;
	}

	/**
	 * Merge hardcoded and database definitions.
	 *
	 * Database definitions override hardcoded for matching slugs.
	 * Additional fields from database are appended.
	 *
	 * @param array $hardcoded Hardcoded content types.
	 * @param array $database  Database content types.
	 * @return array
	 */
	private static function merge( $hardcoded, $database ) {
		$merged     = array();
		$db_by_slug = array();

		// Index database entries by slug.
		foreach ( $database as $db_type ) {
			$db_by_slug[ $db_type['slug'] ] = $db_type;
		}

		// Process hardcoded, merging with database if exists.
		foreach ( $hardcoded as $hc_type ) {
			if ( isset( $db_by_slug[ $hc_type['slug'] ] ) ) {
				$db_type  = $db_by_slug[ $hc_type['slug'] ];
				$merged[] = self::merge_single( $hc_type, $db_type );
				unset( $db_by_slug[ $hc_type['slug'] ] );
			} else {
				$merged[] = $hc_type;
			}
		}

		// Add remaining database-only entries.
		foreach ( $db_by_slug as $db_type ) {
			$merged[] = $db_type;
		}

		return $merged;
	}

	/**
	 * Merge a single hardcoded and database content type.
	 *
	 * @param array $hardcoded Hardcoded definition.
	 * @param array $database  Database definition.
	 * @return array
	 */
	private static function merge_single( $hardcoded, $database ) {
		$merged = $hardcoded;

		$merged['id']     = $database['id'];
		$merged['source'] = 'merged';

		// Merge fields: hardcoded first, then database additions.
		$hc_fields = $hardcoded['config']['fields'] ?? array();
		$db_fields = $database['config']['fields'] ?? array();

		$hc_keys = array_column( $hc_fields, 'key' );

		foreach ( $db_fields as $db_field ) {
			if ( ! in_array( $db_field['key'], $hc_keys, true ) ) {
				$hc_fields[] = $db_field;
			}
		}

		$merged['config']['fields'] = $hc_fields;

		return $merged;
	}

	/**
	 * Clear the cache.
	 */
	public static function clear_cache() {
		self::$cache = null;
	}
}
