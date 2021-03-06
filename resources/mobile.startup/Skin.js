( function ( M, $ ) {

	var Skin,
		browser = M.require( 'browser' ),
		View = M.require( 'View' );

	/**
	 * Representation of the current skin being rendered.
	 *
	 * @class Skin
	 * @extends View
	 * @uses Browser
	 * @uses Page
	 */
	Skin = View.extend( {
		/**
		 * @inheritdoc
		 * @cfg {Object} defaults Default options hash.
		 * @cfg {Page} defaults.page page the skin is currently rendering
		 * @cfg {Array} defaults.tabletModules modules to load when in tablet
		 * @cfg {MainMenu} defaults.mainMenu instance of the mainMenu
		 */
		defaults: {
			page: undefined,
			tabletModules: [],
			mainMenu: undefined
		},

		/**
		 * @inheritdoc
		 */
		events: {},

		/**
		 * Close navigation if content tapped
		 * @param {jQuery.Event} ev
		 * @private
		 */
		_onPageCenterClick: function ( ev ) {
			var $target = $( ev.target );

			// Make sure the menu is open and we are not clicking on the menu button
			if (
				this.mainMenu.isOpen() &&
				// FIXME: remove the ID comparison when cache clears
				ev.target.id !== 'mw-mf-main-menu-button' &&
				!$target.hasClass( 'main-menu-button' )
			) {
				this.mainMenu.closeNavigationDrawers();
				ev.preventDefault();
			}
		},

		/**
		 * Setup position fixed emulation using position absolute.
		 */
		setupPositionFixedEmulation: function () {
			var $el = this.$el,
				// FIXME: Move all the variables below to Browser.js
				ua = window.navigator.userAgent,
				isIos = browser.isIos(),
				isOldIPhone = isIos && /OS [4]_[0-2]|OS [3]_/.test( ua );

			$el.addClass( 'no-position-fixed' );
			this.on( 'scroll', function () {
				var scrollTop = $( window ).scrollTop(),
					windowHeight = $( window ).height(),
					activeElement = document.activeElement,
					scrollBottom = scrollTop + windowHeight;
				if ( isOldIPhone ) {
					if ( activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT' ) {
						// add the height of the open soft keyboard
						scrollBottom -= 120;
					} else {
						// add the height of the address bar
						scrollBottom += 60;
					}
				}

				if ( scrollTop === 0 ) {
					// special case when we're at the beginning of the page and many
					// browsers (e.g. Android 2.x) return wrong window height because
					// of the URL bar
					$el.add( '.overlay' ).height( '100%' );
				} else {
					// keep expanding the viewport until the end of the page reached
					// #notification has bottom: 0 and sticks to the end of the viewport
					$el.add( '.overlay' ).height( scrollBottom );
				}
			} );
		},
		/**
		 * @inheritdoc
		 */
		initialize: function ( options ) {
			var self = this;

			this.page = options.page;
			this.name = options.name;
			this.tabletModules = options.tabletModules;
			this.mainMenu = options.mainMenu;
			View.prototype.initialize.apply( this, arguments );

			/**
			 * Tests current window size and if suitable loads styles and scripts specific for larger devices
			 *
			 * @method
			 * @ignore
			 */
			function loadWideScreenModules() {
				if ( browser.isWideScreen() ) {
					// Adjust screen for tablets
					if ( self.page.inNamespace( '' ) ) {
						mw.loader.using( self.tabletModules ).always( function () {
							self.off( '_resize' );
							self.emit.call( self, 'changed' );
						} );
					}
				}
			}
			M.on( 'resize', $.proxy( this, 'emit', '_resize' ) );
			this.on( '_resize', loadWideScreenModules );
			this.emit( '_resize' );
		},
		/**
		 * @inheritdoc
		 */
		postRender: function () {
			var $el = this.$el;
			if ( browser.supportsAnimations() ) {
				$el.addClass( 'animations' );
			}
			if ( !browser.supportsPositionFixed() ) {
				this.setupPositionFixedEmulation();
			}
			if ( browser.supportsTouchEvents() ) {
				$el.addClass( 'touch-events' );
			}
			$( '<div class="transparent-shield cloaked-element">' ).appendTo( '#mw-mf-page-center' );
			/**
			 * @event changed
			 * Fired when appearance of skin changes.
			 */
			this.emit( 'changed' );
			// FIXME: Move back into events when T98200 resolved
			this.$( '#mw-mf-page-center' ).on( 'click',
				$.proxy( this, '_onPageCenterClick' ) );
		},

		/**
		 * Return the instance of MainMenu
		 * @returns {MainMenu}
		 */
		getMainMenu: function () {
			return this.mainMenu;
		},

		/**
		 * Returns the appropriate license message including links/name to
		 * terms of use (if any) and license page
		 */
		getLicenseMsg: function () {
			var licenseMsg,
				mfLicense = mw.config.get( 'wgMFLicense' ),
				licensePlural = mw.language.convertNumber( mfLicense.plural );

			if ( mfLicense.link ) {
				if ( $( '#footer-places-terms-use' ).length > 0 ) {
					licenseMsg = mw.msg(
						'mobile-frontend-editor-licensing-with-terms',
						mw.message(
							'mobile-frontend-editor-terms-link',
							$( '#footer-places-terms-use a' ).attr( 'href' )
						).parse(),
						mfLicense.link,
						licensePlural
					);
				} else {
					licenseMsg = mw.msg(
						'mobile-frontend-editor-licensing',
						mfLicense.link,
						licensePlural
					);
				}
			}
			return licenseMsg;
		}
	} );

	M.define( 'Skin', Skin );

}( mw.mobileFrontend, jQuery ) );
