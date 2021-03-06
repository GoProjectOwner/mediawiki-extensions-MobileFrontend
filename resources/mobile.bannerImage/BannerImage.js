( function ( M, $ ) {
	var BannerImage,
		router = M.require( 'router' ),
		View = M.require( 'View' ),
		browser = M.require( 'browser' );

	/**
	 * Gets the aspect ratio of the banner image.
	 *
	 * On a tablet device or larger, maintain a 21:9 ratio, otherwise 16:9.
	 *
	 * @ignore
	 *
	 * @return {Number}
	 */
	function getAspectRatio() {
		if (
			browser.isWideScreen() ||

			// TODO: Shouldn't this be Device.isLandscape?
			( window.innerHeight < window.innerWidth ) // Landscape?
		) {
			return 21 / 9;
		}

		return 16 / 9;
	}

	/**
	 * A banner image at the head of the page
	 * @class BannerImage
	 * @extends View
	 */
	BannerImage = View.extend( {
		className: 'banner-image-container banner-container',

		/**
		 * @inheritdoc
		 *
		 * @param {Object} options
		 * @param {Object} options.repository The repository from which to load images
		 */
		initialize: function ( options ) {
			this.repository = options.repository;

			View.prototype.initialize.apply( this, arguments );
		},
		/**
		 * @inheritdoc
		 */
		postRender: function () {
			this.$imageEl = $( '<div class="banner-image"></div>' );
			this.$el.append( this.$imageEl );

			this.loadImage();
		},

		/**
		 * Tries to load an image.
		 *
		 * If an image is successfully loaded, then the image is displayed, otherwise the view
		 * element is removed from the DOM.
		 *
		 * @method
		 */
		loadImage: function () {
			var self = this,
				targetWidth = $( window ).width();

			self.repository.getImage( targetWidth )
				.then( function ( image ) {
					self.onImageLoaded( image );
				} )
				.fail( function () {
					self.remove();
					self.emit( 'loaded' );
				} );
		},

		/**
		 * When we have a valid image, set it as background, bind resize events.
		 * @method
		 * @param {Image} image Image object that loaded
		 */
		onImageLoaded: function ( image ) {
			var self = this;

			self.$imageEl
				.css( {
					'background-image': 'url("' + image.src + '")'
				} )
				.show()
				/**
				 * Show the image in mediaViewer
				 * @ignore
				 */
				.on( 'click', function () {
					var title = new mw.Title( 'File:' + image.fileName );
					router.navigate( '#/media/' + title.toString() );
				} );

			self.resizeContainer();

			/**
			 * @event loaded
			 * Fired when image has loaded and been rendered in page.
			 */
			self.emit( 'loaded' );

			if ( !self.hasLoadedOnce ) {
				self.hasLoadedOnce = true;
				M.on( 'resize', function () {
					// Don't wait until the image that best fits the width of the window has loaded
					// to resize the container.
					self.resizeContainer();

					self.loadImage();
				} );
			}
		},

		/**
		 * Resize the container to maintain the aspect ratio.
		 */
		resizeContainer: function () {
			this.$el
				.css( {
					// Max height is enforced with CSS
					height: this.$el.width() * ( 1 / getAspectRatio() )
				} );
		}
	} );

	M.define( 'modules/bannerImage/BannerImage', BannerImage );

}( mw.mobileFrontend, jQuery ) );
