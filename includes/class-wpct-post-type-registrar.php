<?php
/**
 * Registers user-created post types with WordPress.
 *
 * @package WP_Content_Types
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Post type registrar class.
 *
 * Registers user-created content types as WordPress post types.
 */
class WPCT_Post_Type_Registrar {

	/**
	 * Reserved post type slugs that cannot be used.
	 *
	 * @var array
	 */
	private static $reserved_slugs = array(
		'post',
		'page',
		'attachment',
		'revision',
		'nav_menu_item',
		'custom_css',
		'customize_changeset',
		'oembed_cache',
		'user_request',
		'wp_block',
		'wp_template',
		'wp_template_part',
		'wp_global_styles',
		'wp_navigation',
		'wp_font_family',
		'wp_font_face',
		'action',
		'author',
		'order',
		'theme',
	);

	/**
	 * Get reserved post type slugs.
	 *
	 * @return array
	 */
	public static function get_reserved_slugs() {
		return self::$reserved_slugs;
	}

	/**
	 * Initialize the registrar.
	 */
	public static function init() {
		self::register_all();

		// Schedule rewrite flush when content types change.
		add_action( 'save_post_' . WPCT_Content_Type::POST_TYPE, array( __CLASS__, 'schedule_flush' ) );
		add_action( 'before_delete_post', array( __CLASS__, 'maybe_schedule_flush_on_delete' ) );

		// Protect our meta keys from the Custom Fields metabox to prevent duplicate saves.
		add_filter( 'is_protected_meta', array( __CLASS__, 'protect_content_type_meta' ), 10, 2 );
	}

	/**
	 * Mark content type meta keys as protected.
	 *
	 * This prevents them from appearing in the Custom Fields metabox,
	 * which would cause duplicate saves with stale values.
	 *
	 * @param bool   $is_protected Whether the meta key is protected.
	 * @param string $meta_key     The meta key.
	 * @return bool
	 */
	public static function protect_content_type_meta( $is_protected, $meta_key ) {
		// Get all registered content type field keys.
		static $field_keys = null;

		if ( null === $field_keys ) {
			$field_keys    = array();
			$content_types = WPCT_Content_Type::get_all();

			foreach ( $content_types as $content_type ) {
				$config = $content_type['config'] ?? array();
				$fields = self::collect_all_fields( $config );

				foreach ( $fields as $field ) {
					if ( ! empty( $field['key'] ) ) {
						$field_keys[] = $field['key'];
					}
				}
			}
		}

		if ( in_array( $meta_key, $field_keys, true ) ) {
			return true;
		}

		return $is_protected;
	}

	/**
	 * Register all user-created post types.
	 */
	public static function register_all() {
		$content_types = WPCT_Content_Type::get_all();

		foreach ( $content_types as $content_type ) {
			self::register_single( $content_type );
		}
	}

	/**
	 * Register a single post type.
	 *
	 * For existing post types (like 'post', 'page'), this registers only the meta fields.
	 * For new post types, this registers both the post type and its meta fields.
	 *
	 * @param array $content_type Content type data.
	 * @return WP_Post_Type|WP_Error|bool
	 */
	public static function register_single( $content_type ) {
		$slug = $content_type['slug'] ?? '';

		// Always validate basic slug format.
		if ( ! self::is_valid_slug_format( $slug ) ) {
			return false;
		}

		// Path 1: Existing post type - just register meta fields.
		if ( post_type_exists( $slug ) ) {
			// Ensure custom-fields support for REST API meta exposure.
			if ( ! post_type_supports( $slug, 'custom-fields' ) ) {
				add_post_type_support( $slug, 'custom-fields' );
			}
			self::register_fields_meta( $slug, $content_type );
			return true;
		}

		// Path 2: New post type - validate not reserved, then register.
		if ( self::is_reserved_slug( $slug ) ) {
			return false;
		}

		$args = self::build_args( $content_type );

		$result = register_post_type( $slug, $args );

		// Register post meta for all fields.
		if ( ! is_wp_error( $result ) ) {
			self::register_fields_meta( $slug, $content_type );
		}

		return $result;
	}

	/**
	 * Register post meta for all fields in a content type.
	 *
	 * @param string $post_type    Post type slug.
	 * @param array  $content_type Content type data.
	 */
	private static function register_fields_meta( $post_type, $content_type ) {
		$config = $content_type['config'] ?? array();
		$fields = self::collect_all_fields( $config );

		foreach ( $fields as $field ) {
			$meta_key = $field['key'] ?? '';

			if ( empty( $meta_key ) ) {
				continue;
			}

			$schema = self::get_field_schema( $field );

			register_post_meta(
				$post_type,
				$meta_key,
				array(
					'show_in_rest'      => true,
					'single'            => true,
					'type'              => $schema['type'],
					'default'           => $schema['default'] ?? '',
					'label'             => $field['label'] ?? '',
					'description'       => $field['description'] ?? '',
					'revisions_enabled' => true,
					'auth_callback'     => function () {
						return current_user_can( 'edit_posts' );
					},
				)
			);
		}
	}

	/**
	 * Collect all fields from a content type config.
	 *
	 * Handles both top-level 'fields' array and 'field_groups' with nested fields.
	 *
	 * @param array $config Content type config.
	 * @return array All fields.
	 */
	private static function collect_all_fields( $config ) {
		$fields = array();

		// Check for top-level fields array.
		if ( ! empty( $config['fields'] ) && is_array( $config['fields'] ) ) {
			$fields = array_merge( $fields, $config['fields'] );
		}

		// Check for field_groups with nested fields.
		if ( ! empty( $config['field_groups'] ) && is_array( $config['field_groups'] ) ) {
			foreach ( $config['field_groups'] as $group ) {
				if ( ! empty( $group['fields'] ) && is_array( $group['fields'] ) ) {
					$fields = array_merge( $fields, $group['fields'] );
				}
			}
		}

		return $fields;
	}

	/**
	 * Get the schema for a field based on its type.
	 *
	 * @param array $field Field data.
	 * @return array Schema with 'type' and optionally 'default'.
	 */
	private static function get_field_schema( $field ) {
		$type = $field['type'] ?? 'text';

		// Map field types to WordPress meta types.
		$type_map = array(
			'text'     => array(
				'type'    => 'string',
				'default' => '',
			),
			'textarea' => array(
				'type'    => 'string',
				'default' => '',
			),
			'number'   => array(
				'type'    => 'number',
				'default' => 0,
			),
			'integer'  => array(
				'type'    => 'integer',
				'default' => 0,
			),
			'boolean'  => array(
				'type'    => 'boolean',
				'default' => false,
			),
			'checkbox' => array(
				'type'    => 'boolean',
				'default' => false,
			),
			'select'   => array(
				'type'    => 'string',
				'default' => '',
			),
			'email'    => array(
				'type'    => 'string',
				'default' => '',
			),
			'url'      => array(
				'type'    => 'string',
				'default' => '',
			),
			'date'     => array(
				'type'    => 'string',
				'default' => '',
			),
			'image'    => array(
				'type'    => 'integer',
				'default' => 0,
			),
		);

		$default_schema = array(
			'type'    => 'string',
			'default' => '',
		);

		return isset( $type_map[ $type ] ) ? $type_map[ $type ] : $default_schema;
	}

	/**
	 * Validate a post type slug.
	 *
	 * @param string $slug The slug to validate.
	 * @return bool
	 */
	private static function is_valid_slug( $slug ) {
		// Must be 1-20 characters.
		if ( empty( $slug ) || strlen( $slug ) > 20 ) {
			return false;
		}

		// Must be lowercase alphanumeric with underscores only.
		if ( ! preg_match( '/^[a-z0-9_]+$/', $slug ) ) {
			return false;
		}

		// Cannot be a reserved slug.
		if ( in_array( $slug, self::$reserved_slugs, true ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Validate slug format only (length, characters).
	 *
	 * Does not check reserved slugs - use for extending existing post types.
	 *
	 * @param string $slug The slug to validate.
	 * @return bool
	 */
	private static function is_valid_slug_format( $slug ) {
		// Must be 1-20 characters.
		if ( empty( $slug ) || strlen( $slug ) > 20 ) {
			return false;
		}

		// Must be lowercase alphanumeric with underscores only.
		if ( ! preg_match( '/^[a-z0-9_]+$/', $slug ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Check if a slug is reserved for WordPress core.
	 *
	 * @param string $slug The slug to check.
	 * @return bool
	 */
	private static function is_reserved_slug( $slug ) {
		return in_array( $slug, self::$reserved_slugs, true );
	}

	/**
	 * Build register_post_type() arguments from content type config.
	 *
	 * @param array $content_type Content type data.
	 * @return array
	 */
	private static function build_args( $content_type ) {
		$config = $content_type['config'] ?? array();
		$slug   = $content_type['slug'] ?? '';
		$name   = $content_type['name'] ?? '';

		// Build labels from name if not provided.
		$labels = $config['labels'] ?? self::generate_labels( $name );

		// Default supports.
		$supports = $config['supports'] ?? array( 'title', 'editor', 'thumbnail' );
		if ( ! in_array( 'custom-fields', $supports, true ) ) {
			$supports[] = 'custom-fields';
		}
		if ( ! in_array( 'revisions', $supports, true ) ) {
			$supports[] = 'revisions';
		}

		// Visibility & Access settings.
		$public              = $config['public'] ?? true;
		$hierarchical        = $config['hierarchical'] ?? false;
		$publicly_queryable  = $config['publicly_queryable'] ?? true;
		$exclude_from_search = $config['exclude_from_search'] ?? false;

		// REST API settings.
		$show_in_rest = $config['show_in_rest'] ?? true;
		$rest_base    = ! empty( $config['rest_base'] ) ? $config['rest_base'] : $slug;

		// Archive & rewrite settings.
		$has_archive  = $config['has_archive'] ?? false;
		$rewrite_slug = ! empty( $config['rewrite_slug'] ) ? $config['rewrite_slug'] : $slug;
		$with_front   = $config['with_front'] ?? true;

		// Admin menu settings.
		$menu_icon     = $config['menu_icon'] ?? 'dashicons-database';
		$menu_position = isset( $config['menu_position'] ) && is_numeric( $config['menu_position'] )
			? (int) $config['menu_position']
			: null;

		$args = array(
			'labels'              => $labels,
			'public'              => $public,
			'hierarchical'        => $hierarchical,
			'publicly_queryable'  => $publicly_queryable,
			'exclude_from_search' => $exclude_from_search,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'show_in_rest'        => $show_in_rest,
			'rest_base'           => $rest_base,
			'has_archive'         => $has_archive,
			'supports'            => $supports,
			'menu_icon'           => $menu_icon,
			'rewrite'             => array(
				'slug'       => $rewrite_slug,
				'with_front' => $with_front,
			),
		);

		if ( null !== $menu_position ) {
			$args['menu_position'] = $menu_position;
		}

		return $args;
	}

	/**
	 * Generate labels from a content type name.
	 *
	 * @param string $name Singular name.
	 * @return array
	 */
	private static function generate_labels( $name ) {
		$plural = self::pluralize( $name );

		return array(
			'name'                  => $plural,
			'singular_name'         => $name,
			'add_new'               => __( 'Add New', 'wp-content-types' ),
			/* translators: %s: Content type singular name */
			'add_new_item'          => sprintf( __( 'Add New %s', 'wp-content-types' ), $name ),
			/* translators: %s: Content type singular name */
			'edit_item'             => sprintf( __( 'Edit %s', 'wp-content-types' ), $name ),
			/* translators: %s: Content type singular name */
			'new_item'              => sprintf( __( 'New %s', 'wp-content-types' ), $name ),
			/* translators: %s: Content type singular name */
			'view_item'             => sprintf( __( 'View %s', 'wp-content-types' ), $name ),
			/* translators: %s: Content type plural name */
			'view_items'            => sprintf( __( 'View %s', 'wp-content-types' ), $plural ),
			/* translators: %s: Content type plural name */
			'search_items'          => sprintf( __( 'Search %s', 'wp-content-types' ), $plural ),
			/* translators: %s: Content type plural name (lowercase) */
			'not_found'             => sprintf( __( 'No %s found.', 'wp-content-types' ), strtolower( $plural ) ),
			/* translators: %s: Content type plural name (lowercase) */
			'not_found_in_trash'    => sprintf( __( 'No %s found in Trash.', 'wp-content-types' ), strtolower( $plural ) ),
			/* translators: %s: Content type plural name */
			'all_items'             => sprintf( __( 'All %s', 'wp-content-types' ), $plural ),
			/* translators: %s: Content type singular name */
			'archives'              => sprintf( __( '%s Archives', 'wp-content-types' ), $name ),
			/* translators: %s: Content type singular name */
			'attributes'            => sprintf( __( '%s Attributes', 'wp-content-types' ), $name ),
			/* translators: %s: Content type singular name (lowercase) */
			'insert_into_item'      => sprintf( __( 'Insert into %s', 'wp-content-types' ), strtolower( $name ) ),
			/* translators: %s: Content type singular name (lowercase) */
			'uploaded_to_this_item' => sprintf( __( 'Uploaded to this %s', 'wp-content-types' ), strtolower( $name ) ),
			/* translators: %s: Content type plural name (lowercase) */
			'filter_items_list'     => sprintf( __( 'Filter %s list', 'wp-content-types' ), strtolower( $plural ) ),
			/* translators: %s: Content type plural name */
			'items_list_navigation' => sprintf( __( '%s list navigation', 'wp-content-types' ), $plural ),
			/* translators: %s: Content type plural name */
			'items_list'            => sprintf( __( '%s list', 'wp-content-types' ), $plural ),
		);
	}

	/**
	 * Simple pluralization for labels.
	 *
	 * @param string $name Singular name.
	 * @return string
	 */
	private static function pluralize( $name ) {
		if ( empty( $name ) ) {
			return $name;
		}

		// Simple English pluralization rules.
		$last_char = strtolower( substr( $name, -1 ) );
		$last_two  = strtolower( substr( $name, -2 ) );

		if ( 'y' === $last_char && ! in_array( $last_two[0], array( 'a', 'e', 'i', 'o', 'u' ), true ) ) {
			return substr( $name, 0, -1 ) . 'ies';
		}

		if ( in_array( $last_char, array( 's', 'x', 'z' ), true ) || in_array( $last_two, array( 'sh', 'ch' ), true ) ) {
			return $name . 'es';
		}

		return $name . 's';
	}

	/**
	 * Schedule a rewrite rules flush.
	 */
	public static function schedule_flush() {
		if ( ! wp_next_scheduled( 'wpct_flush_rewrite_rules' ) ) {
			wp_schedule_single_event( time(), 'wpct_flush_rewrite_rules' );
		}
	}

	/**
	 * Maybe schedule flush when a content type is deleted.
	 *
	 * @param int $post_id Post ID.
	 */
	public static function maybe_schedule_flush_on_delete( $post_id ) {
		$post = get_post( $post_id );

		if ( $post && WPCT_Content_Type::POST_TYPE === $post->post_type ) {
			self::schedule_flush();
		}
	}
}

// Handle scheduled flush.
add_action( 'wpct_flush_rewrite_rules', 'flush_rewrite_rules' );
