<?php
/**
 * Registers user-created post types with WordPress.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
	 * Initialize the registrar.
	 */
	public static function init() {
		self::register_all();

		// Schedule rewrite flush when content types change.
		add_action( 'save_post_' . WPCT_Content_Type::POST_TYPE, array( __CLASS__, 'schedule_flush' ) );
		add_action( 'before_delete_post', array( __CLASS__, 'maybe_schedule_flush_on_delete' ) );
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
	 * @param array $content_type Content type data.
	 * @return WP_Post_Type|WP_Error|false
	 */
	public static function register_single( $content_type ) {
		$slug = $content_type['slug'] ?? '';

		// Validate the slug.
		if ( ! self::is_valid_slug( $slug ) ) {
			return false;
		}

		// Skip if already registered (hardcoded types take precedence).
		if ( post_type_exists( $slug ) ) {
			return false;
		}

		$args = self::build_args( $content_type );

		return register_post_type( $slug, $args );
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
			'add_new_item'          => sprintf( __( 'Add New %s', 'wp-content-types' ), $name ),
			'edit_item'             => sprintf( __( 'Edit %s', 'wp-content-types' ), $name ),
			'new_item'              => sprintf( __( 'New %s', 'wp-content-types' ), $name ),
			'view_item'             => sprintf( __( 'View %s', 'wp-content-types' ), $name ),
			'view_items'            => sprintf( __( 'View %s', 'wp-content-types' ), $plural ),
			'search_items'          => sprintf( __( 'Search %s', 'wp-content-types' ), $plural ),
			'not_found'             => sprintf( __( 'No %s found.', 'wp-content-types' ), strtolower( $plural ) ),
			'not_found_in_trash'    => sprintf( __( 'No %s found in Trash.', 'wp-content-types' ), strtolower( $plural ) ),
			'all_items'             => sprintf( __( 'All %s', 'wp-content-types' ), $plural ),
			'archives'              => sprintf( __( '%s Archives', 'wp-content-types' ), $name ),
			'attributes'            => sprintf( __( '%s Attributes', 'wp-content-types' ), $name ),
			'insert_into_item'      => sprintf( __( 'Insert into %s', 'wp-content-types' ), strtolower( $name ) ),
			'uploaded_to_this_item' => sprintf( __( 'Uploaded to this %s', 'wp-content-types' ), strtolower( $name ) ),
			'filter_items_list'     => sprintf( __( 'Filter %s list', 'wp-content-types' ), strtolower( $plural ) ),
			'items_list_navigation' => sprintf( __( '%s list navigation', 'wp-content-types' ), $plural ),
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
